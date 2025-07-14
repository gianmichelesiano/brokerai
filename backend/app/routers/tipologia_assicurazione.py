"""
API router for Tipologia Assicurazione (Insurance Types) endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
import logging
from datetime import datetime

from app.models.tipologia_assicurazione import (
    TipologiaAssicurazione,
    TipologiaAssicurazioneCreate,
    TipologiaAssicurazioneUpdate,
    TipologiaAssicurazioneList,
    TipologiaAssicurazioneFilter,
    TipologiaAssicurazioneStats,
    TipologiaAssicurazioneBulkCreate,
    TipologiaAssicurazioneBulkUpdate,
    TipologiaAssicurazioneBulkDelete
)
from app.config.database import get_supabase, get_supabase_service
from app.utils.exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check(supabase=Depends(get_supabase)):
    """
    Verifica la connessione al database e restituisce informazioni di stato
    """
    try:
        # Test connessione con una query semplice
        result = supabase.table("tipologia_assicurazione").select("id").limit(1).execute()
        
        # Conta il numero totale di tipologie
        count_result = supabase.table("tipologia_assicurazione").select("*", count="exact").execute()
        total_tipologie = count_result.count or 0
        
        return {
            "status": "ok",
            "database": "connected",
            "total_tipologie": total_tipologie,
            "message": "Database connesso correttamente"
        }
    except Exception as e:
        logger.error(f"Health check fallito: {e}")
        return {
            "status": "error",
            "database": "disconnected",
            "total_tipologie": 0,
            "error": str(e),
            "message": "Errore di connessione al database"
        }


@router.get("/", response_model=TipologiaAssicurazioneList)
async def get_tipologie_assicurazione(
    search: Optional[str] = Query(None, description="Ricerca nel nome o descrizione"),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    sort_by: Optional[str] = Query("created_at", description="Campo per ordinamento"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$", description="Ordine di ordinamento"),
    supabase=Depends(get_supabase)
):
    """
    Recupera lista paginata di tipologie assicurazione con filtri opzionali
    """
    try:
        # Calcola offset per paginazione
        offset = (page - 1) * size
        
        # Costruisci query base
        query = supabase.table("tipologia_assicurazione").select("*")
        
        # Applica filtro di ricerca se presente
        if search:
            query = query.or_(f"nome.ilike.%{search}%,descrizione.ilike.%{search}%")
        
        # Applica ordinamento
        if sort_order == "desc":
            query = query.order(sort_by, desc=True)
        else:
            query = query.order(sort_by)
        
        # Applica paginazione
        query = query.range(offset, offset + size - 1)
        
        # Esegui query
        result = query.execute()
        
        # Query per conteggio totale
        count_query = supabase.table("tipologia_assicurazione").select("*", count="exact")
        if search:
            count_query = count_query.or_(f"nome.ilike.%{search}%,descrizione.ilike.%{search}%")
        count_result = count_query.execute()
        
        total = count_result.count or 0
        pages = (total + size - 1) // size if total > 0 else 0
        
        # Converti i dati per adattarli al modello Pydantic
        items = []
        for item in result.data:
            # Assicurati che le date siano nel formato corretto
            created_at = item.get("created_at")
            updated_at = item.get("updated_at")
            
            # Se le date sono stringhe, mantienile così, altrimenti usa datetime
            if isinstance(created_at, str):
                created_at_str = created_at
            else:
                created_at_str = created_at.isoformat() if created_at else datetime.utcnow().isoformat()
                
            if isinstance(updated_at, str):
                updated_at_str = updated_at
            else:
                updated_at_str = updated_at.isoformat() if updated_at else datetime.utcnow().isoformat()
            
            tipologia_data = {
                "id": item["id"],
                "nome": item["nome"],
                "descrizione": item.get("descrizione"),
                "created_at": created_at_str,
                "updated_at": updated_at_str
            }
            items.append(tipologia_data)
        
        return TipologiaAssicurazioneList(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Errore nel recupero tipologie assicurazione: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/stats", response_model=TipologiaAssicurazioneStats)
async def get_tipologie_assicurazione_stats(supabase=Depends(get_supabase)):
    """
    Recupera statistiche delle tipologie assicurazione
    """
    try:
        # Query per tutte le tipologie
        result = supabase.table("tipologia_assicurazione").select("*").execute()
        tipologie = result.data
        
        total_tipologie = len(tipologie)
        tipologie_con_descrizione = sum(1 for t in tipologie if t.get("descrizione"))
        tipologie_senza_descrizione = total_tipologie - tipologie_con_descrizione
        
        # Date di creazione e modifica
        created_dates = [t.get("created_at") for t in tipologie if t.get("created_at")]
        updated_dates = [t.get("updated_at") for t in tipologie if t.get("updated_at")]
        
        ultima_creazione = max(created_dates) if created_dates else None
        ultima_modifica = max(updated_dates) if updated_dates else None
        
        # Nomi più lunghi
        nomi_piu_lunghi = sorted(
            [{"nome": t["nome"], "lunghezza": len(t["nome"])} for t in tipologie],
            key=lambda x: x["lunghezza"],
            reverse=True
        )[:5]
        
        return TipologiaAssicurazioneStats(
            total_tipologie=total_tipologie,
            tipologie_con_descrizione=tipologie_con_descrizione,
            tipologie_senza_descrizione=tipologie_senza_descrizione,
            ultima_creazione=ultima_creazione,
            ultima_modifica=ultima_modifica,
            nomi_piu_lunghi=nomi_piu_lunghi
        )
        
    except Exception as e:
        logger.error(f"Errore nel recupero statistiche: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/{tipologia_id}", response_model=TipologiaAssicurazione)
async def get_tipologia_assicurazione(
    tipologia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera una tipologia assicurazione specifica per ID
    """
    try:
        result = supabase.table("tipologia_assicurazione").select("*").eq("id", tipologia_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tipologia assicurazione con ID {tipologia_id} non trovata"
            )
        
        item = result.data[0]
        
        # Converti i dati per adattarli al modello Pydantic
        tipologia_data = {
            **item,
            "created_at": item.get("created_at") or datetime.utcnow().isoformat(),
            "updated_at": item.get("updated_at") or datetime.utcnow().isoformat()
        }
        
        return TipologiaAssicurazione(**tipologia_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero tipologia assicurazione {tipologia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/", response_model=TipologiaAssicurazione, status_code=status.HTTP_201_CREATED)
async def create_tipologia_assicurazione(
    tipologia_data: TipologiaAssicurazioneCreate,
    supabase=Depends(get_supabase),
    supabase_service=Depends(get_supabase_service)
):
    """
    Crea una nuova tipologia assicurazione
    """
    try:
        # Verifica se esiste già una tipologia con lo stesso nome
        existing = supabase.table("tipologia_assicurazione").select("id").eq("nome", tipologia_data.nome).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Esiste già una tipologia assicurazione con il nome '{tipologia_data.nome}'"
            )
        
        # Crea la nuova tipologia
        now = datetime.utcnow().isoformat()
        
        insert_data = {
            "nome": tipologia_data.nome,
            "descrizione": tipologia_data.descrizione,
            "created_at": now,
            "updated_at": now
        }
        
        result = supabase.table("tipologia_assicurazione").insert(insert_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nella creazione della tipologia assicurazione"
            )
        
        item = result.data[0]
        
        # Converti i dati per adattarli al modello Pydantic
        tipologia_data = {
            **item,
            "created_at": item.get("created_at") or now,
            "updated_at": item.get("updated_at") or now
        }
        
        return TipologiaAssicurazione(**tipologia_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nella creazione tipologia assicurazione: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.put("/{tipologia_id}", response_model=TipologiaAssicurazione)
async def update_tipologia_assicurazione(
    tipologia_id: int,
    tipologia_data: TipologiaAssicurazioneUpdate,
    supabase=Depends(get_supabase)
):
    """
    Aggiorna una tipologia assicurazione esistente
    """
    try:
        # Verifica se la tipologia esiste
        existing = supabase.table("tipologia_assicurazione").select("*").eq("id", tipologia_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tipologia assicurazione con ID {tipologia_id} non trovata"
            )
        
        # Prepara i dati per l'aggiornamento
        update_data = {}
        if tipologia_data.nome is not None:
            # Verifica se esiste già una tipologia con lo stesso nome (diversa da quella corrente)
            name_check = supabase.table("tipologia_assicurazione").select("id").eq("nome", tipologia_data.nome).neq("id", tipologia_id).execute()
            if name_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Esiste già un'altra tipologia assicurazione con il nome '{tipologia_data.nome}'"
                )
            update_data["nome"] = tipologia_data.nome
        
        if tipologia_data.descrizione is not None:
            update_data["descrizione"] = tipologia_data.descrizione
        
        # Aggiungi timestamp di aggiornamento
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Esegui l'aggiornamento
        result = supabase.table("tipologia_assicurazione").update(update_data).eq("id", tipologia_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nell'aggiornamento della tipologia assicurazione"
            )
        
        item = result.data[0]
        
        # Converti i dati per adattarli al modello Pydantic
        tipologia_data = {
            **item,
            "created_at": item.get("created_at") or datetime.utcnow().isoformat(),
            "updated_at": item.get("updated_at") or datetime.utcnow().isoformat()
        }
        
        return TipologiaAssicurazione(**tipologia_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'aggiornamento tipologia assicurazione {tipologia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.delete("/{tipologia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tipologia_assicurazione(
    tipologia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Elimina una tipologia assicurazione
    """
    try:
        # Verifica se la tipologia esiste
        existing = supabase.table("tipologia_assicurazione").select("id").eq("id", tipologia_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tipologia assicurazione con ID {tipologia_id} non trovata"
            )
        
        # Elimina la tipologia
        result = supabase.table("tipologia_assicurazione").delete().eq("id", tipologia_id).execute()
        
        # Non restituire nulla per status 204
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'eliminazione tipologia assicurazione {tipologia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/search/{query}", response_model=TipologiaAssicurazioneList)
async def search_tipologie_assicurazione(
    query: str,
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    supabase=Depends(get_supabase)
):
    """
    Ricerca tipologie assicurazione per testo nel nome o nella descrizione
    """
    try:
        # Calcola offset per paginazione
        offset = (page - 1) * size
        
        # Costruisci query di ricerca
        search_query = supabase.table("tipologia_assicurazione").select("*")
        
        # Ricerca nel nome o nella descrizione
        search_query = search_query.or_(f"nome.ilike.%{query}%,descrizione.ilike.%{query}%")
        
        # Applica ordinamento per rilevanza (prima per nome, poi per data)
        search_query = search_query.order("nome")
        
        # Applica paginazione
        search_query = search_query.range(offset, offset + size - 1)
        
        # Esegui query
        result = search_query.execute()
        
        # Query per conteggio totale
        count_query = supabase.table("tipologia_assicurazione").select("*", count="exact")
        count_query = count_query.or_(f"nome.ilike.%{query}%,descrizione.ilike.%{query}%")
        count_result = count_query.execute()
        
        total = count_result.count or 0
        pages = (total + size - 1) // size if total > 0 else 0
        
        # Converti i dati per adattarli al modello Pydantic
        items = []
        for item in result.data:
            tipologia_data = {
                **item,
                "created_at": item.get("created_at") or datetime.utcnow().isoformat(),
                "updated_at": item.get("updated_at") or datetime.utcnow().isoformat()
            }
            items.append(tipologia_data)
        
        return TipologiaAssicurazioneList(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Errore nella ricerca tipologie assicurazione con query '{query}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/bulk", response_model=List[TipologiaAssicurazione])
async def bulk_create_tipologie_assicurazione(
    bulk_data: TipologiaAssicurazioneBulkCreate,
    supabase=Depends(get_supabase)
):
    """
    Crea multiple tipologie assicurazione in una sola operazione
    """
    try:
        # Verifica che non esistano già tipologie con gli stessi nomi
        existing_names = []
        for tipologia in bulk_data.tipologie:
            existing = supabase.table("tipologia_assicurazione").select("nome").eq("nome", tipologia.nome).execute()
            if existing.data:
                existing_names.append(tipologia.nome)
        
        if existing_names:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Esistono già tipologie con i seguenti nomi: {', '.join(existing_names)}"
            )
        
        # Prepara i dati per l'inserimento
        now = datetime.utcnow().isoformat()
        insert_data = []
        
        for tipologia in bulk_data.tipologie:
            insert_data.append({
                "nome": tipologia.nome,
                "descrizione": tipologia.descrizione,
                "created_at": now,
                "updated_at": now
            })
        
        # Esegui l'inserimento bulk
        result = supabase.table("tipologia_assicurazione").insert(insert_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nella creazione bulk delle tipologie assicurazione"
            )
        
        # Converti i risultati
        created_tipologie = []
        for item in result.data:
            tipologia_data = {
                **item,
                "created_at": item.get("created_at") or now,
                "updated_at": item.get("updated_at") or now
            }
            created_tipologie.append(TipologiaAssicurazione(**tipologia_data))
        
        return created_tipologie
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nella creazione bulk tipologie assicurazione: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.delete("/bulk", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_tipologie_assicurazione(
    bulk_data: TipologiaAssicurazioneBulkDelete,
    supabase=Depends(get_supabase)
):
    """
    Elimina multiple tipologie assicurazione in una sola operazione
    """
    try:
        # Verifica che tutte le tipologie esistano
        existing_ids = []
        for tipologia_id in bulk_data.ids:
            existing = supabase.table("tipologia_assicurazione").select("id").eq("id", tipologia_id).execute()
            if existing.data:
                existing_ids.append(tipologia_id)
        
        missing_ids = set(bulk_data.ids) - set(existing_ids)
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tipologie non trovate con ID: {', '.join(map(str, missing_ids))}"
            )
        
        # Esegui l'eliminazione bulk
        result = supabase.table("tipologia_assicurazione").delete().in_("id", bulk_data.ids).execute()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'eliminazione bulk tipologie assicurazione: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )
