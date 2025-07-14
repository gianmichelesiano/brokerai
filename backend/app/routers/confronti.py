"""
API router for Confronti (Insurance Comparisons) endpoints
"""
# app/routers/confronti.py (versione semplificata)
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

from app.models.confronti import (
    ConfrontoRequest, 
    ConfrontoResult, 
    ConfrontoAnalysis,
    ConfrontoSalvatoCreate, # New import
    ConfrontoSalvato,      # New import
    ConfrontoSalvatoDetail # New import
)
from app.services.confronti_service import AnalizzatorePolizze
from app.config.database import get_supabase, Tables # Import Tables
from app.routers.auth import get_current_user # Import get_current_user
from app.utils.exceptions import NotFoundError, DatabaseError # Import exceptions


logger = logging.getLogger(__name__)

router = APIRouter()

analizzatore = AnalizzatorePolizze()

@router.post("/compare", response_model=ConfrontoResult)
async def compare_companies(
    request: ConfrontoRequest,
    supabase=Depends(get_supabase)
):
    """
    Confronta polizze per le garanzie specificate
    """
    try:
        risultati_analisi = []
        
        # Per ogni garanzia richiesta
        for garanzia_id in request.garanzia_ids:
            
            # Recupera i dati per il confronto
            dati_confronto = await prepara_dati_confronto(
                supabase, garanzia_id, request.compagnia_ids
            )
            
            if dati_confronto and len(dati_confronto['polizze']) >= 2:
                # Esegui l'analisi
                analisi = analizzatore.analizza_garanzie(
                    dati_confronto['nome_garanzia'],
                    dati_confronto['polizze']
                )
                
                # Converti in oggetto Pydantic
                analisi_obj = ConfrontoAnalysis(**analisi)
                risultati_analisi.append(analisi_obj)
        
        if not risultati_analisi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nessuna garanzia valida trovata per il confronto"
            )
        
        return ConfrontoResult(risultati_analisi=risultati_analisi)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore durante il confronto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno: {str(e)}"
        )


async def prepara_dati_confronto(supabase, garanzia_id: int, compagnie_ids: List[int]) -> Optional[dict]:
    """
    Prepara i dati per il confronto recuperando i testi dal database
    """
    try:
        # Importa le funzioni del database
        from app.services.garanzie_service import garanzie_service
        from app.config.database import Tables
        
        # Recupera la garanzia usando il servizio dedicato
        garanzia = await garanzie_service.get_garanzia_by_id(garanzia_id, supabase)
        
        if not garanzia:
            logger.warning(f"Garanzia {garanzia_id} non trovata per il confronto.")
            return None
        
        # Recupera i testi estratti dall'AI dalla tabella analisi_ai_polizze
        # Esegui una join con la tabella 'compagnie' per ottenere il nome della compagnia
        result = supabase.table("analisi_ai_polizze").select(
            "ai_testo_estratto, compagnia_id, compagnie(nome)"
        ).eq("garanzia_id", garanzia_id).in_("compagnia_id", compagnie_ids).execute()
        
        polizze_data = []
        if result.data:
            for item in result.data:
                # Assicurati che 'compagnie' e 'nome' siano presenti e che il testo AI sia valido
                compagnia_nome = item.get('compagnie', {}).get('nome')
                ai_testo_estratto = item.get('ai_testo_estratto')
                
                if not compagnia_nome:
                    logger.debug(f"Skipping item for garanzia {garanzia_id}: Compagnia nome non trovato. Item: {item}")
                    continue
                if not ai_testo_estratto or not ai_testo_estratto.strip():
                    logger.debug(f"Skipping item for garanzia {garanzia_id}: Testo estratto AI vuoto o nullo per compagnia {compagnia_nome}. Item: {item}")
                    continue
                if len(ai_testo_estratto) <= 50:
                    logger.debug(f"Skipping item for garanzia {garanzia_id}: Testo estratto AI troppo corto ({len(ai_testo_estratto)} chars) per compagnia {compagnia_nome}. Item: {item}")
                    continue
                if 'NON PREVISTA' in ai_testo_estratto.upper():
                    logger.debug(f"Skipping item for garanzia {garanzia_id}: Testo estratto AI contiene 'NON PREVISTA' per compagnia {compagnia_nome}. Item: {item}")
                    continue
                
                polizze_data.append({
                    'compagnia': compagnia_nome,
                    'testo': ai_testo_estratto
                })
        
        if len(polizze_data) < 2:
            logger.warning(f"Dati insufficienti per confronto garanzia {garanzia_id}. Trovate {len(polizze_data)} polizze valide (minimo 2 richieste).")
            return None
        
        return {
            'nome_garanzia': garanzia.titolo,
            'polizze': polizze_data
        }
        
    except Exception as e:
        logger.error(f"Errore preparazione dati: {e}")
        return None


@router.post("/salva", response_model=ConfrontoSalvato)
async def salva_confronto(
    confronto: ConfrontoSalvatoCreate,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Salva un confronto completato"""
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utente non autenticato"
            )
        logger.info(f"current_user: {current_user}")
        # Prepara i dati per l'inserimento
        data_to_insert = confronto.model_dump()
        data_to_insert["utente_id"] = current_user["user"]["id"]
        data_to_insert["created_at"] = datetime.utcnow().isoformat()
        data_to_insert["updated_at"] = datetime.utcnow().isoformat()

        logger.info(f"Data to insert in confronti_salvati: {data_to_insert}")

        result = supabase.table(Tables.CONFRONTI_SALVATI).insert(data_to_insert).execute()

        logger.info(f"Risultato insert confronto: {result.data}")
        if result.data and isinstance(result.data, list) and result.data:
            logger.info(f"Insert keys: {list(result.data[0].keys())}")

        if not result.data or not isinstance(result.data, list) or not result.data or 'id' not in result.data[0]:
            logger.error(f"Insert confronto: dati restituiti non validi o manca 'id': {result.data}")
            # Fallback: cerca il confronto appena creato per utente, nome e created_at
            fallback = supabase.table(Tables.CONFRONTI_SALVATI)\
                .select("*")\
                .eq("utente_id", current_user["user"]["id"])\
                .eq("nome", confronto.nome)\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()
            logger.info(f"Fallback select confronto: {fallback.data}")
            if fallback.data and isinstance(fallback.data, list) and fallback.data:
                logger.info(f"Fallback keys: {list(fallback.data[0].keys())}")
            if fallback.data and isinstance(fallback.data, list) and 'id' in fallback.data[0]:
                result.data = [fallback.data[0]]
            else:
                raise DatabaseError("Nessun dato valido restituito dalla creazione del confronto salvato")
        
        # Recupera i nomi delle compagnie per la risposta
        compagnie_response = supabase.table(Tables.COMPAGNIE).select("id, nome").in_("id", confronto.compagnie_ids).execute()
        compagnie_map = {c['id']: c['nome'] for c in compagnie_response.data}
        compagnie_nomi = [compagnie_map.get(c_id, "Sconosciuta") for c_id in confronto.compagnie_ids]

        # Recupera il nome della tipologia
        tipologia_response = supabase.table(Tables.TIPOLOGIA_ASSICURAZIONE).select("nome").eq("id", confronto.tipologia_id).single().execute()
        tipologia_nome = tipologia_response.data['nome'] if tipologia_response.data else "Sconosciuta"

        confronto_id = result.data[0].get('id')
        logger.info(f"Confronto salvato: id={confronto_id}, dati={result.data[0]}")
        return ConfrontoSalvato(
            id=confronto_id,
            nome=result.data[0]['nome'],
            descrizione=result.data[0]['descrizione'],
            tipologia_id=result.data[0]['tipologia_id'],
            tipologia_nome=tipologia_nome,
            compagnie_nomi=compagnie_nomi,
            garanzie_count=len(result.data[0]['garanzie_ids']),
            created_at=datetime.fromisoformat(result.data[0]['created_at'].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(result.data[0]['updated_at'].replace('Z', '+00:00'))
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore durante il salvataggio del confronto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno: {str(e)}"
        )


@router.get("/storico", response_model=List[ConfrontoSalvato])
async def get_storico_confronti(
    page: int = 1,
    size: int = 20,
    tipologia_id: Optional[int] = None,
    search: Optional[str] = None,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Recupera lo storico dei confronti dell'utente"""
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utente non autenticato"
            )
        
        offset = (page - 1) * size
        
        query = supabase.table(Tables.CONFRONTI_SALVATI).select(
            "id, nome, descrizione, tipologia_id, created_at, updated_at, compagnie_ids, garanzie_ids, tipologia_assicurazione(nome)" # Removed compagnie(nome)
        ).eq("utente_id", current_user["user"]["id"]) # Use current_user["user"]["id"]

        if tipologia_id:
            query = query.eq("tipologia_id", tipologia_id)
        
        if search:
            query = query.ilike("nome", f"%{search}%")

        # Get total count
        count_query = supabase.table(Tables.CONFRONTI_SALVATI).select("id", count="exact").eq("utente_id", current_user["user"]["id"]) # Use current_user["user"]["id"]
        if tipologia_id:
            count_query = count_query.eq("tipologia_id", tipologia_id)
        if search:
            count_query = count_query.ilike("nome", f"%{search}%")
        total = count_query.execute().count or 0

        query = query.order("created_at", desc=True).range(offset, offset + size - 1)
        result = query.execute()

        logger.info(f"Risultato get_storico_confronti: {result.data}")
        if result.data and isinstance(result.data, list) and result.data:
            logger.info(f"Get storico keys: {list(result.data[0].keys())}")

        confronti_list = []
        for item in result.data:
            tipologia_nome = item.get('tipologia_assicurazione', {}).get('nome') if item.get('tipologia_assicurazione') else "Sconosciuta"
            
            # Recupera i nomi delle compagnie separatamente
            compagnie_ids_for_item = item.get('compagnie_ids', [])
            compagnie_nomi = []
            if compagnie_ids_for_item:
                compagnie_res = supabase.table(Tables.COMPAGNIE).select("nome").in_("id", compagnie_ids_for_item).execute()
                compagnie_nomi = [c['nome'] for c in compagnie_res.data if c.get('nome')]

            confronti_list.append(ConfrontoSalvato(
                id=item['id'],
                nome=item['nome'],
                descrizione=item['descrizione'],
                tipologia_id=item['tipologia_id'],
                tipologia_nome=tipologia_nome,
                compagnie_nomi=compagnie_nomi,
                garanzie_count=len(item['garanzie_ids']),
                created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00'))
            ))
        
        return confronti_list # TODO: Implement pagination metadata if needed by frontend

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero storico confronti: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno: {str(e)}"
        )


@router.get("/storico/{confronto_id}", response_model=ConfrontoSalvatoDetail)
async def get_confronto_detail(
    confronto_id: int,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Recupera i dettagli completi di un confronto salvato"""
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utente non autenticato"
            )
        
        result = supabase.table(Tables.CONFRONTI_SALVATI).select(
            "*, tipologia_assicurazione(nome)" # Removed compagnie(nome)
        ).eq("id", confronto_id).eq("utente_id", current_user["user"]["id"]).single().execute() # Use current_user["user"]["id"]

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Confronto con ID {confronto_id} non trovato o non autorizzato"
            )
        
        item = result.data
        
        tipologia_nome = item.get('tipologia_assicurazione', {}).get('nome') if item.get('tipologia_assicurazione') else "Sconosciuta"
        
        # Recupera i nomi delle compagnie separatamente
        compagnie_ids_for_item = item.get('compagnie_ids', [])
        compagnie_nomi = []
        if compagnie_ids_for_item:
            compagnie_res = supabase.table(Tables.COMPAGNIE).select("nome").in_("id", compagnie_ids_for_item).execute()
            compagnie_nomi = [c['nome'] for c in compagnie_res.data if c.get('nome')]

        return ConfrontoSalvatoDetail(
            id=item['id'],
            nome=item['nome'],
            descrizione=item['descrizione'],
            tipologia_id=item['tipologia_id'],
            tipologia_nome=tipologia_nome,
            compagnie_nomi=compagnie_nomi,
            garanzie_count=len(item['garanzie_ids']),
            created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00')),
            dati_confronto=item['dati_confronto'],
            compagnie_ids=item['compagnie_ids'],
            garanzie_ids=item['garanzie_ids']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero dettagli confronto {confronto_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno: {str(e)}"
        )


@router.delete("/storico/{confronto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_confronto(
    confronto_id: int,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Elimina un confronto salvato"""
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utente non autenticato"
            )
        
        # Verifica che il confronto esista e appartenga all'utente
        result = supabase.table(Tables.CONFRONTI_SALVATI).delete().eq("id", confronto_id).eq("utente_id", current_user["user"]["id"]).execute() # Use current_user["user"]["id"]

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Confronto con ID {confronto_id} non trovato o non autorizzato"
            )
        
        return None # No content for 204

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'eliminazione confronto {confronto_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno: {str(e)}"
        )
