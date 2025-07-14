"""
API router for Compagnia-Tipologia Assicurazione relationship endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from typing import List, Optional
import logging
import time

from app.models.compagnia_tipologia import (
    CompagniaTipologia,
    CompagniaTipologiaCreate,
    CompagniaTipologiaUpdate,
    CompagniaTipologiaWithDetails,
    CompagniaTipologiaList,
    CompagniaTipologiaFilter,
    CompagniaTipologiaStats,
    CompagniaTipologiaSearch,
    CompagniaTipologiaSearchResponse,
    FileUploadResponse,
    TextExtractionResult,
    CompagniaTipologiaBulkCreate,
    CompagniaTipologiaBulkUpdate,
    CompagniaTipologiaBulkDelete
)
from app.config.database import get_supabase
from app.utils.exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check(supabase=Depends(get_supabase)):
    """
    Verifica la connessione al database per le relazioni compagnia-tipologia
    """
    try:
        # Test connessione con una query semplice
        result = supabase.table("compagnia_tipologia_assicurazione").select("id").limit(1).execute()
        
        # Conta il numero totale di relazioni
        count_result = supabase.table("compagnia_tipologia_assicurazione").select("*", count="exact").execute()
        total_relazioni = count_result.count or 0
        
        return {
            "status": "ok",
            "database": "connected",
            "total_relazioni": total_relazioni,
            "message": "Database connesso correttamente"
        }
    except Exception as e:
        logger.error(f"Health check fallito: {e}")
        return {
            "status": "error",
            "database": "disconnected",
            "total_relazioni": 0,
            "error": str(e),
            "message": "Errore di connessione al database"
        }


@router.get("/", response_model=CompagniaTipologiaList)
async def get_compagnia_tipologie(
    compagnia_id: Optional[int] = Query(None, description="Filtra per ID compagnia"),
    tipologia_assicurazione_id: Optional[int] = Query(None, description="Filtra per ID tipologia"),
    attiva: Optional[bool] = Query(None, description="Filtra per stato attivo"),
    has_file: Optional[bool] = Query(None, description="Filtra per presenza file"),
    has_text: Optional[bool] = Query(None, description="Filtra per presenza testo"),
    search: Optional[str] = Query(None, description="Ricerca nel testo della polizza"),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    sort_by: Optional[str] = Query("created_at", description="Campo per ordinamento"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$", description="Ordine di ordinamento"),
    supabase=Depends(get_supabase)
):
    """
    Recupera lista paginata di relazioni compagnia-tipologia con filtri opzionali
    """
    try:
        # Calcola offset per paginazione
        offset = (page - 1) * size
        
        # Usa la vista per ottenere i dati con i dettagli
        query = supabase.table("v_compagnie_tipologie").select("*")
        
        # Applica filtri
        if compagnia_id is not None:
            query = query.eq("compagnia_id", compagnia_id)
        
        if tipologia_assicurazione_id is not None:
            query = query.eq("tipologia_id", tipologia_assicurazione_id)
        
        if attiva is not None:
            query = query.eq("attiva", attiva)
        
        if has_file is not None:
            if has_file:
                query = query.not_.is_("polizza_filename", "null")
            else:
                query = query.is_("polizza_filename", "null")
        
        if has_text is not None:
            if has_text:
                query = query.not_.is_("polizza_text", "null")
            else:
                query = query.is_("polizza_text", "null")
        
        if search:
            # Ricerca full-text nel testo della polizza
            query = query.textSearch("polizza_text", search, config="italian")
        
        # Applica ordinamento
        if sort_order == "desc":
            query = query.order(sort_by, desc=True)
        else:
            query = query.order(sort_by)
        
        # Applica paginazione
        query = query.range(offset, offset + size - 1)
        
        # Esegui query
        result = query.execute()
        
        # Query per conteggio totale con gli stessi filtri
        count_query = supabase.table("v_compagnie_tipologie").select("*", count="exact")
        
        if compagnia_id is not None:
            count_query = count_query.eq("compagnia_id", compagnia_id)
        if tipologia_assicurazione_id is not None:
            count_query = count_query.eq("tipologia_id", tipologia_assicurazione_id)
        if attiva is not None:
            count_query = count_query.eq("attiva", attiva)
        if has_file is not None:
            if has_file:
                count_query = count_query.not_.is_("polizza_filename", "null")
            else:
                count_query = count_query.is_("polizza_filename", "null")
        if has_text is not None:
            if has_text:
                count_query = count_query.not_.is_("polizza_text", "null")
            else:
                count_query = count_query.is_("polizza_text", "null")
        if search:
            count_query = count_query.textSearch("polizza_text", search, config="italian")
        
        count_result = count_query.execute()
        
        total = count_result.count or 0
        pages = (total + size - 1) // size if total > 0 else 0
        
        # Converti i dati per adattarli al modello Pydantic
        items = []
        for item in result.data:
            if item.get("relazione_id"):  # Solo se esiste una relazione
                compagnia_tipologia_data = {
                    "id": item["relazione_id"],
                    "compagnia_id": item["compagnia_id"],
                    "tipologia_assicurazione_id": item["tipologia_id"],
                    "polizza_filename": item.get("polizza_filename"),
                    "polizza_path": item.get("polizza_path"),
                    "polizza_text": item.get("polizza_text"),
                    "attiva": item.get("attiva", True),
                    "created_at": item.get("polizza_created_at") or "2024-01-01T00:00:00Z",
                    "updated_at": item.get("polizza_updated_at") or "2024-01-01T00:00:00Z",
                    "compagnia_nome": item.get("compagnia_nome", ""),
                    "tipologia_nome": item.get("tipologia_nome", ""),
                    "tipologia_descrizione": item.get("tipologia_descrizione")
                }
                items.append(compagnia_tipologia_data)
        
        return CompagniaTipologiaList(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Errore nel recupero relazioni compagnia-tipologia: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/stats", response_model=CompagniaTipologiaStats)
async def get_compagnia_tipologia_stats(supabase=Depends(get_supabase)):
    """
    Recupera statistiche delle relazioni compagnia-tipologia
    """
    try:
        # Query per tutte le relazioni
        result = supabase.table("compagnia_tipologia_assicurazione").select("*").execute()
        relazioni = result.data
        
        total_relazioni = len(relazioni)
        relazioni_attive = sum(1 for r in relazioni if r.get("attiva", True))
        relazioni_inattive = total_relazioni - relazioni_attive
        relazioni_con_file = sum(1 for r in relazioni if r.get("polizza_filename"))
        relazioni_senza_file = total_relazioni - relazioni_con_file
        relazioni_con_testo = sum(1 for r in relazioni if r.get("polizza_text"))
        relazioni_senza_testo = total_relazioni - relazioni_con_testo
        
        # Conta compagnie e tipologie coinvolte
        compagnie_coinvolte = len(set(r["compagnia_id"] for r in relazioni))
        tipologie_coinvolte = len(set(r["tipologia_assicurazione_id"] for r in relazioni))
        
        # Calcola statistiche sui file
        file_types = {}
        total_file_size = 0
        text_lengths = []
        
        for relazione in relazioni:
            # Estrai tipo file dal filename
            filename = relazione.get("polizza_filename")
            if filename:
                ext = filename.split(".")[-1].lower() if "." in filename else "unknown"
                file_types[ext] = file_types.get(ext, 0) + 1
            
            # Calcola lunghezza testo
            text = relazione.get("polizza_text", "")
            if text:
                text_lengths.append(len(text))
        
        average_text_length = sum(text_lengths) / len(text_lengths) if text_lengths else None
        
        # Date di creazione e modifica
        created_dates = [r.get("created_at") for r in relazioni if r.get("created_at")]
        updated_dates = [r.get("updated_at") for r in relazioni if r.get("updated_at")]
        
        ultima_creazione = max(created_dates) if created_dates else None
        ultima_modifica = max(updated_dates) if updated_dates else None
        
        return CompagniaTipologiaStats(
            total_relazioni=total_relazioni,
            relazioni_attive=relazioni_attive,
            relazioni_inattive=relazioni_inattive,
            relazioni_con_file=relazioni_con_file,
            relazioni_senza_file=relazioni_senza_file,
            relazioni_con_testo=relazioni_con_testo,
            relazioni_senza_testo=relazioni_senza_testo,
            compagnie_coinvolte=compagnie_coinvolte,
            tipologie_coinvolte=tipologie_coinvolte,
            file_types=file_types,
            total_file_size=total_file_size,
            average_text_length=average_text_length,
            ultima_creazione=ultima_creazione,
            ultima_modifica=ultima_modifica
        )
        
    except Exception as e:
        logger.error(f"Errore nel recupero statistiche: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/{relazione_id}", response_model=CompagniaTipologiaWithDetails)
async def get_compagnia_tipologia(
    relazione_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera una relazione compagnia-tipologia specifica per ID
    """
    try:
        # Usa la vista per ottenere i dati con i dettagli
        result = supabase.table("v_compagnie_tipologie").select("*").eq("relazione_id", relazione_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relazione compagnia-tipologia con ID {relazione_id} non trovata"
            )
        
        item = result.data[0]
        
        # Converti i dati per adattarli al modello Pydantic
        compagnia_tipologia_data = {
            "id": item["relazione_id"],
            "compagnia_id": item["compagnia_id"],
            "tipologia_assicurazione_id": item["tipologia_id"],
            "polizza_filename": item.get("polizza_filename"),
            "polizza_path": item.get("polizza_path"),
            "polizza_text": item.get("polizza_text"),
            "attiva": item.get("attiva", True),
            "created_at": item.get("polizza_created_at") or "2024-01-01T00:00:00Z",
            "updated_at": item.get("polizza_updated_at") or "2024-01-01T00:00:00Z",
            "compagnia_nome": item.get("compagnia_nome", ""),
            "tipologia_nome": item.get("tipologia_nome", ""),
            "tipologia_descrizione": item.get("tipologia_descrizione")
        }
        
        return CompagniaTipologiaWithDetails(**compagnia_tipologia_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero relazione {relazione_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/", response_model=CompagniaTipologia, status_code=status.HTTP_201_CREATED)
async def create_compagnia_tipologia(
    relazione_data: CompagniaTipologiaCreate,
    supabase=Depends(get_supabase)
):
    """
    Crea una nuova relazione compagnia-tipologia
    """
    try:
        # Verifica se la compagnia esiste
        compagnia_check = supabase.table("compagnie").select("id").eq("id", relazione_data.compagnia_id).execute()
        if not compagnia_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Compagnia con ID {relazione_data.compagnia_id} non trovata"
            )
        
        # Verifica se la tipologia esiste
        tipologia_check = supabase.table("tipologia_assicurazione").select("id").eq("id", relazione_data.tipologia_assicurazione_id).execute()
        if not tipologia_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipologia assicurazione con ID {relazione_data.tipologia_assicurazione_id} non trovata"
            )
        
        # Verifica se esiste già una relazione tra questa compagnia e tipologia
        existing = supabase.table("compagnia_tipologia_assicurazione").select("id").eq("compagnia_id", relazione_data.compagnia_id).eq("tipologia_assicurazione_id", relazione_data.tipologia_assicurazione_id).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Esiste già una relazione tra la compagnia {relazione_data.compagnia_id} e la tipologia {relazione_data.tipologia_assicurazione_id}"
            )
        
        # Crea la nuova relazione
        from datetime import datetime
        now = datetime.utcnow().isoformat()
        
        insert_data = {
            "compagnia_id": relazione_data.compagnia_id,
            "tipologia_assicurazione_id": relazione_data.tipologia_assicurazione_id,
            "polizza_filename": relazione_data.polizza_filename,
            "polizza_path": relazione_data.polizza_path,
            "polizza_text": relazione_data.polizza_text,
            "attiva": relazione_data.attiva,
            "created_at": now,
            "updated_at": now
        }
        
        result = supabase.table("compagnia_tipologia_assicurazione").insert(insert_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nella creazione della relazione"
            )
        
        item = result.data[0]
        
        return CompagniaTipologia(**item)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nella creazione relazione: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.put("/{relazione_id}", response_model=CompagniaTipologia)
async def update_compagnia_tipologia(
    relazione_id: int,
    relazione_data: CompagniaTipologiaUpdate,
    supabase=Depends(get_supabase)
):
    """
    Aggiorna una relazione compagnia-tipologia esistente
    """
    try:
        # Verifica se la relazione esiste
        existing = supabase.table("compagnia_tipologia_assicurazione").select("*").eq("id", relazione_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relazione con ID {relazione_id} non trovata"
            )
        
        # Prepara i dati per l'aggiornamento
        update_data = {}
        
        if relazione_data.polizza_filename is not None:
            update_data["polizza_filename"] = relazione_data.polizza_filename
        
        if relazione_data.polizza_path is not None:
            update_data["polizza_path"] = relazione_data.polizza_path
        
        if relazione_data.polizza_text is not None:
            update_data["polizza_text"] = relazione_data.polizza_text
        
        if relazione_data.attiva is not None:
            update_data["attiva"] = relazione_data.attiva
        
        # Aggiungi timestamp di aggiornamento
        from datetime import datetime
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Esegui l'aggiornamento
        result = supabase.table("compagnia_tipologia_assicurazione").update(update_data).eq("id", relazione_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nell'aggiornamento della relazione"
            )
        
        item = result.data[0]
        
        return CompagniaTipologia(**item)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'aggiornamento relazione {relazione_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.delete("/{relazione_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_compagnia_tipologia(
    relazione_id: int,
    delete_files: bool = Query(False, description="Elimina anche i file associati"),
    supabase=Depends(get_supabase)
):
    """
    Elimina una relazione compagnia-tipologia
    """
    try:
        # Verifica se la relazione esiste
        existing = supabase.table("compagnia_tipologia_assicurazione").select("*").eq("id", relazione_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relazione con ID {relazione_id} non trovata"
            )
        
        # TODO: Se delete_files è True, eliminare anche i file fisici
        
        # Elimina la relazione
        result = supabase.table("compagnia_tipologia_assicurazione").delete().eq("id", relazione_id).execute()
        
        # Non restituire nulla per status 204
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'eliminazione relazione {relazione_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/{relazione_id}/upload", response_model=FileUploadResponse)
async def upload_file_to_relazione(
    relazione_id: int,
    file: UploadFile = File(...),
    supabase=Depends(get_supabase)
):
    """
    Upload file polizza per una relazione compagnia-tipologia
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.post("/{relazione_id}/extract-text", response_model=TextExtractionResult)
async def extract_text_from_relazione(
    relazione_id: int,
    supabase=Depends(get_supabase)
):
    """
    Estrai testo dal file polizza di una relazione
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.post("/search", response_model=CompagniaTipologiaSearchResponse)
async def search_compagnia_tipologie(
    search_data: CompagniaTipologiaSearch,
    supabase=Depends(get_supabase)
):
    """
    Ricerca full-text nelle polizze delle relazioni compagnia-tipologia
    """
    try:
        start_time = time.time()
        
        # Costruisci query di ricerca
        query = supabase.table("v_compagnie_tipologie").select("*")
        
        # Applica filtri
        if search_data.compagnia_ids:
            query = query.in_("compagnia_id", search_data.compagnia_ids)
        
        if search_data.tipologia_ids:
            query = query.in_("tipologia_id", search_data.tipologia_ids)
        
        if search_data.attiva_only:
            query = query.eq("attiva", True)
        
        # Ricerca full-text
        query = query.textSearch("polizza_text", search_data.query, config="italian")
        
        # Limita i risultati
        query = query.limit(search_data.max_results)
        
        # Esegui query
        result = query.execute()
        
        search_time = time.time() - start_time
        
        # Processa i risultati
        results = []
        for item in result.data:
            if item.get("relazione_id"):
                # Simula il calcolo del relevance score (in un'implementazione reale useresti il ranking di PostgreSQL)
                relevance_score = 1.0
                
                # Simula i matches (in un'implementazione reale useresti ts_headline)
                matches = []
                if item.get("polizza_text") and search_data.query.lower() in item["polizza_text"].lower():
                    matches.append({
                        "text": item["polizza_text"][:200] + "..." if len(item["polizza_text"]) > 200 else item["polizza_text"],
                        "highlighted": True
                    })
                
                search_result = {
                    "compagnia_tipologia_id": item["relazione_id"],
                    "compagnia_id": item["compagnia_id"],
                    "compagnia_nome": item.get("compagnia_nome", ""),
                    "tipologia_id": item["tipologia_id"],
                    "tipologia_nome": item.get("tipologia_nome", ""),
                    "polizza_filename": item.get("polizza_filename"),
                    "matches": matches,
                    "total_matches": len(matches),
                    "relevance_score": relevance_score
                }
                results.append(search_result)
        
        return CompagniaTipologiaSearchResponse(
            query=search_data.query,
            results=results,
            total_results=len(results),
            search_time=search_time
        )
        
    except Exception as e:
        logger.error(f"Errore nella ricerca: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/compagnia/{compagnia_id}/tipologie")
async def get_tipologie_by_compagnia(
    compagnia_id: int,
    attiva: Optional[bool] = Query(None, description="Filtra per stato attivo"),
    supabase=Depends(get_supabase)
):
    """
    Recupera tutte le tipologie associate a una compagnia
    """
    try:
        # Verifica se la compagnia esiste
        compagnia_check = supabase.table("compagnie").select("id, nome").eq("id", compagnia_id).execute()
        if not compagnia_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compagnia con ID {compagnia_id} non trovata"
            )
        
        compagnia = compagnia_check.data[0]
        
        # Query per le tipologie
        query = supabase.table("v_compagnie_tipologie").select("*").eq("compagnia_id", compagnia_id)
        
        if attiva is not None:
            query = query.eq("attiva", attiva)
        
        result = query.execute()
        
        tipologie = []
        for item in result.data:
            if item.get("relazione_id"):
                tipologia_data = {
                    "relazione_id": item["relazione_id"],
                    "tipologia_id": item["tipologia_id"],
                    "tipologia_nome": item.get("tipologia_nome", ""),
                    "tipologia_descrizione": item.get("tipologia_descrizione"),
                    "polizza_filename": item.get("polizza_filename"),
                    "polizza_path": item.get("polizza_path"),
                    "has_text": bool(item.get("polizza_text")),
                    "attiva": item.get("attiva", True),
                    "created_at": item.get("polizza_created_at"),
                    "updated_at": item.get("polizza_updated_at")
                }
                tipologie.append(tipologia_data)
        
        return {
            "compagnia_id": compagnia_id,
            "compagnia_nome": compagnia["nome"],
            "tipologie": tipologie,
            "total_tipologie": len(tipologie)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero tipologie per compagnia {compagnia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/tipologia/{tipologia_id}/compagnie")
async def get_compagnie_by_tipologia(
    tipologia_id: int,
    attiva: Optional[bool] = Query(None, description="Filtra per stato attivo"),
    supabase=Depends(get_supabase)
):
    """
    Recupera tutte le compagnie associate a una tipologia
    """
    try:
        # Verifica se la tipologia esiste
        tipologia_check = supabase.table("tipologia_assicurazione").select("id, nome, descrizione").eq("id", tipologia_id).execute()
        if not tipologia_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tipologia assicurazione con ID {tipologia_id} non trovata"
            )
        
        tipologia = tipologia_check.data[0]
        
        # Query per le compagnie
        query = supabase.table("v_compagnie_tipologie").select("*").eq("tipologia_id", tipologia_id)
        
        if attiva is not None:
            query = query.eq("attiva", attiva)
        
        result = query.execute()
        
        compagnie = []
        for item in result.data:
            if item.get("relazione_id"):
                compagnia_data = {
                    "relazione_id": item["relazione_id"],
                    "compagnia_id": item["compagnia_id"],
                    "compagnia_nome": item.get("compagnia_nome", ""),
                    "polizza_filename": item.get("polizza_filename"),
                    "polizza_path": item.get("polizza_path"),
                    "has_text": bool(item.get("polizza_text")),
                    "attiva": item.get("attiva", True),
                    "created_at": item.get("polizza_created_at"),
                    "updated_at": item.get("polizza_updated_at")
                }
                compagnie.append(compagnia_data)
        
        return {
            "tipologia_id": tipologia_id,
            "tipologia_nome": tipologia["nome"],
            "tipologia_descrizione": tipologia.get("descrizione"),
            "compagnie": compagnie,
            "total_compagnie": len(compagnie)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero compagnie per tipologia {tipologia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/bulk", response_model=List[CompagniaTipologia])
async def bulk_create_compagnia_tipologie(
    bulk_data: CompagniaTipologiaBulkCreate,
    supabase=Depends(get_supabase)
):
    """
    Crea multiple relazioni compagnia-tipologia in batch
    """
    try:
        created_relations = []
        errors = []
        
        for relazione_data in bulk_data.relazioni:
            try:
                # Verifica se la compagnia esiste
                compagnia_check = supabase.table("compagnie").select("id").eq("id", relazione_data.compagnia_id).execute()
                if not compagnia_check.data:
                    errors.append(f"Compagnia con ID {relazione_data.compagnia_id} non trovata")
                    continue
                
                # Verifica se la tipologia esiste
                tipologia_check = supabase.table("tipologia_assicurazione").select("id").eq("id", relazione_data.tipologia_assicurazione_id).execute()
                if not tipologia_check.data:
                    errors.append(f"Tipologia assicurazione con ID {relazione_data.tipologia_assicurazione_id} non trovata")
                    continue
                
                # Verifica se esiste già una relazione
                existing = supabase.table("compagnia_tipologia_assicurazione").select("id").eq("compagnia_id", relazione_data.compagnia_id).eq("tipologia_assicurazione_id", relazione_data.tipologia_assicurazione_id).execute()
                if existing.data:
                    errors.append(f"Relazione già esistente tra compagnia {relazione_data.compagnia_id} e tipologia {relazione_data.tipologia_assicurazione_id}")
                    continue
                
                # Crea la relazione
                from datetime import datetime
                now = datetime.utcnow().isoformat()
                
                insert_data = {
                    "compagnia_id": relazione_data.compagnia_id,
                    "tipologia_assicurazione_id": relazione_data.tipologia_assicurazione_id,
                    "polizza_filename": relazione_data.polizza_filename,
                    "polizza_path": relazione_data.polizza_path,
                    "polizza_text": relazione_data.polizza_text,
                    "attiva": relazione_data.attiva,
                    "created_at": now,
                    "updated_at": now
                }
                
                result = supabase.table("compagnia_tipologia_assicurazione").insert(insert_data).execute()
                
                if result.data:
                    created_relations.append(CompagniaTipologia(**result.data[0]))
                else:
                    errors.append(f"Errore nella creazione della relazione compagnia {relazione_data.compagnia_id} - tipologia {relazione_data.tipologia_assicurazione_id}")
                    
            except Exception as e:
                errors.append(f"Errore nella creazione relazione: {str(e)}")
        
        if errors and not created_relations:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nessuna relazione creata. Errori: {'; '.join(errors)}"
            )
        
        return created_relations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nella creazione bulk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.put("/bulk", response_model=List[CompagniaTipologia])
async def bulk_update_compagnia_tipologie(
    bulk_data: CompagniaTipologiaBulkUpdate,
    supabase=Depends(get_supabase)
):
    """
    Aggiorna multiple relazioni compagnia-tipologia in batch
    """
    try:
        updated_relations = []
        errors = []
        
        for update_item in bulk_data.updates:
            try:
                relazione_id = update_item.get("id")
                if not relazione_id:
                    errors.append("ID mancante nell'aggiornamento")
                    continue
                
                # Verifica se la relazione esiste
                existing = supabase.table("compagnia_tipologia_assicurazione").select("*").eq("id", relazione_id).execute()
                if not existing.data:
                    errors.append(f"Relazione con ID {relazione_id} non trovata")
                    continue
                
                # Prepara i dati per l'aggiornamento
                update_data = {}
                
                if "polizza_filename" in update_item:
                    update_data["polizza_filename"] = update_item["polizza_filename"]
                
                if "polizza_path" in update_item:
                    update_data["polizza_path"] = update_item["polizza_path"]
                
                if "polizza_text" in update_item:
                    update_data["polizza_text"] = update_item["polizza_text"]
                
                if "attiva" in update_item:
                    update_data["attiva"] = update_item["attiva"]
                
                # Aggiungi timestamp di aggiornamento
                from datetime import datetime
                update_data["updated_at"] = datetime.utcnow().isoformat()
                
                # Esegui l'aggiornamento
                result = supabase.table("compagnia_tipologia_assicurazione").update(update_data).eq("id", relazione_id).execute()
                
                if result.data:
                    updated_relations.append(CompagniaTipologia(**result.data[0]))
                else:
                    errors.append(f"Errore nell'aggiornamento della relazione {relazione_id}")
                    
            except Exception as e:
                errors.append(f"Errore nell'aggiornamento relazione: {str(e)}")
        
        if errors and not updated_relations:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nessuna relazione aggiornata. Errori: {'; '.join(errors)}"
            )
        
        return updated_relations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'aggiornamento bulk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.delete("/bulk", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_compagnia_tipologie(
    bulk_data: CompagniaTipologiaBulkDelete,
    supabase=Depends(get_supabase)
):
    """
    Elimina multiple relazioni compagnia-tipologia in batch
    """
    try:
        deleted_count = 0
        errors = []
        
        for relazione_id in bulk_data.ids:
            try:
                # Verifica se la relazione esiste
                existing = supabase.table("compagnia_tipologia_assicurazione").select("*").eq("id", relazione_id).execute()
                if not existing.data:
                    errors.append(f"Relazione con ID {relazione_id} non trovata")
                    continue
                
                # TODO: Se delete_files è True, eliminare anche i file fisici
                
                # Elimina la relazione
                result = supabase.table("compagnia_tipologia_assicurazione").delete().eq("id", relazione_id).execute()
                deleted_count += 1
                
            except Exception as e:
                errors.append(f"Errore nell'eliminazione relazione {relazione_id}: {str(e)}")
        
        if errors and deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Nessuna relazione eliminata. Errori: {'; '.join(errors)}"
            )
        
        # Non restituire nulla per status 204
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'eliminazione bulk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )
