"""
API router for Compagnie (Insurance Companies) endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from typing import List, Optional
import logging

from app.models.compagnie import (
    Compagnia,
    CompagniaCreate,
    CompagniaUpdate,
    CompagniaList,
    CompagniaFilter,
    CompagniaStats,
    FileUploadResponse,
    TextExtractionResult,
    AnalizzaPolizzaRequest,
    AnalizzaPolizzaResponse,
    AnalisiUpdateRequest,
    AnalisiUpdateResponse
)
from app.config.database import get_supabase
from app.utils.exceptions import NotFoundError, ValidationError
from app.services.ai_extractor import estrai_sezione_ai_sync, is_ai_available

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check(supabase=Depends(get_supabase)):
    """
    Verifica la connessione al database e restituisce informazioni di stato
    """
    try:
        # Test connessione con una query semplice
        result = supabase.table("compagnie").select("id").limit(1).execute()
        
        # Conta il numero totale di compagnie
        count_result = supabase.table("compagnie").select("*", count="exact").execute()
        total_compagnie = count_result.count or 0
        
        return {
            "status": "ok",
            "database": "connected",
            "total_compagnie": total_compagnie,
            "message": "Database connesso correttamente"
        }
    except Exception as e:
        logger.error(f"Health check fallito: {e}")
        return {
            "status": "error",
            "database": "disconnected",
            "total_compagnie": 0,
            "error": str(e),
            "message": "Errore di connessione al database"
        }


@router.get("/", response_model=CompagniaList)
async def get_compagnie(
    search: Optional[str] = Query(None, description="Ricerca nel nome"),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    sort_by: Optional[str] = Query("created_at", description="Campo per ordinamento"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$", description="Ordine di ordinamento"),
    supabase=Depends(get_supabase)
):
    """
    Recupera lista paginata di compagnie con filtri opzionali
    """
    try:
        # Calcola offset per paginazione
        offset = (page - 1) * size
        
        # Costruisci query base
        query = supabase.table("compagnie").select("*")
        
        # Applica filtro di ricerca se presente
        if search:
            query = query.ilike("nome", f"%{search}%")
        
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
        count_query = supabase.table("compagnie").select("*", count="exact")
        if search:
            count_query = count_query.ilike("nome", f"%{search}%")
        count_result = count_query.execute()
        
        total = count_result.count or 0
        pages = (total + size - 1) // size if total > 0 else 0
        
        # Converti i dati per adattarli al modello Pydantic
        items = []
        for item in result.data:
            # Aggiungi campi mancanti con valori di default
            compagnia_data = {
                **item,
                "created_at": item.get("created_at") or "2024-01-01T00:00:00Z",
                "updated_at": item.get("updated_at") or "2024-01-01T00:00:00Z"
            }
            items.append(compagnia_data)
        
        return CompagniaList(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Errore nel recupero compagnie: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/stats", response_model=CompagniaStats)
async def get_compagnie_stats(supabase=Depends(get_supabase)):
    """
    Recupera statistiche delle compagnie
    """
    try:
        # Query per tutte le compagnie
        result = supabase.table("compagnie").select("*").execute()
        compagnie = result.data
        
        total_compagnie = len(compagnie)
        
        # Query per le relazioni compagnia-tipologia per ottenere statistiche sui file
        relazioni_result = supabase.table("compagnia_tipologia_assicurazione").select("*").execute()
        relazioni = relazioni_result.data
        
        # Calcola compagnie con file e testo dalle relazioni
        compagnie_con_file_ids = set()
        compagnie_con_testo_ids = set()
        
        # Calcola statistiche sui file
        file_types = {}
        total_file_size = 0
        text_lengths = []
        
        for relazione in relazioni:
            compagnia_id = relazione.get("compagnia_id")
            
            # Estrai tipo file dal filename
            filename = relazione.get("polizza_filename")
            if filename:
                compagnie_con_file_ids.add(compagnia_id)
                ext = filename.split(".")[-1].lower() if "." in filename else "unknown"
                file_types[ext] = file_types.get(ext, 0) + 1
            
            # Calcola lunghezza testo
            text = relazione.get("polizza_text", "")
            if text:
                compagnie_con_testo_ids.add(compagnia_id)
                text_lengths.append(len(text))
        
        compagnie_con_file = len(compagnie_con_file_ids)
        compagnie_senza_file = total_compagnie - compagnie_con_file
        compagnie_con_testo = len(compagnie_con_testo_ids)
        compagnie_senza_testo = total_compagnie - compagnie_con_testo
        
        average_text_length = sum(text_lengths) / len(text_lengths) if text_lengths else None
        
        # Date di creazione e modifica
        created_dates = [c.get("created_at") for c in compagnie if c.get("created_at")]
        updated_dates = [c.get("updated_at") for c in compagnie if c.get("updated_at")]
        
        ultima_creazione = max(created_dates) if created_dates else None
        ultima_modifica = max(updated_dates) if updated_dates else None
        
        return CompagniaStats(
            total_compagnie=total_compagnie,
            compagnie_con_file=compagnie_con_file,
            compagnie_senza_file=compagnie_senza_file,
            compagnie_con_testo=compagnie_con_testo,
            compagnie_senza_testo=compagnie_senza_testo,
            file_types=file_types,
            total_file_size=total_file_size,
            average_text_length=average_text_length,
            ultima_creazione=ultima_creazione,
            ultima_modifica=ultima_modifica,
            ultima_analisi=None  # Non abbiamo ancora questa informazione
        )
        
    except Exception as e:
        logger.error(f"Errore nel recupero statistiche: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/{compagnia_id}", response_model=Compagnia)
async def get_compagnia(
    compagnia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera una compagnia specifica per ID
    """
    try:
        result = supabase.table("compagnie").select("*").eq("id", compagnia_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compagnia con ID {compagnia_id} non trovata"
            )
        
        item = result.data[0]
        
        # Converti i dati per adattarli al modello Pydantic
        compagnia_data = {
            **item,
            "created_at": item.get("created_at") or "2024-01-01T00:00:00Z",
            "updated_at": item.get("updated_at") or "2024-01-01T00:00:00Z"
        }
        
        return Compagnia(**compagnia_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero compagnia {compagnia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/", response_model=Compagnia, status_code=status.HTTP_201_CREATED)
async def create_compagnia(
    compagnia_data: CompagniaCreate,
    supabase=Depends(get_supabase)
):
    """
    Crea una nuova compagnia
    """
    try:
        # Verifica se esiste già una compagnia con lo stesso nome
        existing = supabase.table("compagnie").select("id").eq("nome", compagnia_data.nome).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Esiste già una compagnia con il nome '{compagnia_data.nome}'"
            )
        
        # Crea la nuova compagnia
        from datetime import datetime
        now = datetime.utcnow().isoformat()
        
        insert_data = {
            "nome": compagnia_data.nome,
            "created_at": now,
            "updated_at": now
        }
        
        result = supabase.table("compagnie").insert(insert_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nella creazione della compagnia"
            )
        
        item = result.data[0]
        
        # Converti i dati per adattarli al modello Pydantic
        compagnia_data = {
            **item,
            "created_at": item.get("created_at") or now,
            "updated_at": item.get("updated_at") or now
        }
        
        return Compagnia(**compagnia_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nella creazione compagnia: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.put("/{compagnia_id}", response_model=Compagnia)
async def update_compagnia(
    compagnia_id: int,
    compagnia_data: CompagniaUpdate,
    supabase=Depends(get_supabase)
):
    """
    Aggiorna una compagnia esistente
    """
    try:
        # Verifica se la compagnia esiste
        existing = supabase.table("compagnie").select("*").eq("id", compagnia_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compagnia con ID {compagnia_id} non trovata"
            )
        
        # Prepara i dati per l'aggiornamento
        update_data = {}
        if compagnia_data.nome is not None:
            # Verifica se esiste già una compagnia con lo stesso nome (diversa da quella corrente)
            name_check = supabase.table("compagnie").select("id").eq("nome", compagnia_data.nome).neq("id", compagnia_id).execute()
            if name_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Esiste già un'altra compagnia con il nome '{compagnia_data.nome}'"
                )
            update_data["nome"] = compagnia_data.nome
        
        # Aggiungi timestamp di aggiornamento
        from datetime import datetime
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Esegui l'aggiornamento
        result = supabase.table("compagnie").update(update_data).eq("id", compagnia_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nell'aggiornamento della compagnia"
            )
        
        item = result.data[0]
        
        # Converti i dati per adattarli al modello Pydantic
        compagnia_data = {
            **item,
            "created_at": item.get("created_at") or "2024-01-01T00:00:00Z",
            "updated_at": item.get("updated_at") or "2024-01-01T00:00:00Z"
        }
        
        return Compagnia(**compagnia_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'aggiornamento compagnia {compagnia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.delete("/{compagnia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_compagnia(
    compagnia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Elimina una compagnia
    """
    try:
        # Verifica se la compagnia esiste
        existing = supabase.table("compagnie").select("id").eq("id", compagnia_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compagnia con ID {compagnia_id} non trovata"
            )
        
        # Elimina la compagnia
        result = supabase.table("compagnie").delete().eq("id", compagnia_id).execute()
        
        # Non restituire nulla per status 204
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'eliminazione compagnia {compagnia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/{compagnia_id}/upload", response_model=FileUploadResponse)
async def upload_file(
    compagnia_id: int,
    file: UploadFile = File(...),
    supabase=Depends(get_supabase)
):
    """
    Upload file polizza per una compagnia
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.post("/{compagnia_id}/extract-text", response_model=TextExtractionResult)
async def extract_text(
    compagnia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Estrai testo dal file polizza di una compagnia
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.get("/search/{query}", response_model=CompagniaList)
async def search_compagnie(
    query: str,
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    supabase=Depends(get_supabase)
):
    """
    Ricerca compagnie per testo nel nome
    """
    try:
        # Calcola offset per paginazione
        offset = (page - 1) * size
        
        # Costruisci query di ricerca
        search_query = supabase.table("compagnie").select("*")
        
        # Ricerca nel nome
        search_query = search_query.ilike("nome", f"%{query}%")
        
        # Applica ordinamento per rilevanza (prima per nome, poi per data)
        search_query = search_query.order("nome")
        
        # Applica paginazione
        search_query = search_query.range(offset, offset + size - 1)
        
        # Esegui query
        result = search_query.execute()
        
        # Query per conteggio totale
        count_query = supabase.table("compagnie").select("*", count="exact")
        count_query = count_query.ilike("nome", f"%{query}%")
        count_result = count_query.execute()
        
        total = count_result.count or 0
        pages = (total + size - 1) // size if total > 0 else 0
        
        # Converti i dati per adattarli al modello Pydantic
        items = []
        for item in result.data:
            # Aggiungi campi mancanti con valori di default
            compagnia_data = {
                **item,
                "created_at": item.get("created_at") or "2024-01-01T00:00:00Z",
                "updated_at": item.get("updated_at") or "2024-01-01T00:00:00Z"
            }
            items.append(compagnia_data)
        
        return CompagniaList(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Errore nella ricerca compagnie con query '{query}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/{compagnia_id}/files")
async def get_compagnia_files(
    compagnia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera i file associati a una compagnia dalle relazioni compagnia-tipologia
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
        
        # Recupera i file dalle relazioni compagnia-tipologia
        relazioni_result = supabase.table("v_compagnie_tipologie").select("*").eq("compagnia_id", compagnia_id).execute()
        
        files = []
        for relazione in relazioni_result.data:
            if relazione.get("polizza_filename") and relazione.get("relazione_id"):
                files.append({
                    "relazione_id": relazione["relazione_id"],
                    "tipologia_id": relazione.get("tipologia_id"),
                    "tipologia_nome": relazione.get("tipologia_nome"),
                    "filename": relazione["polizza_filename"],
                    "path": relazione.get("polizza_path"),
                    "type": "polizza",
                    "size": None,  # Non abbiamo questa informazione nella tabella
                    "uploaded_at": relazione.get("polizza_created_at"),
                    "has_text": bool(relazione.get("polizza_text")),
                    "attiva": relazione.get("attiva", True)
                })
        
        return {
            "compagnia_id": compagnia_id,
            "compagnia_nome": compagnia["nome"],
            "files": files,
            "total_files": len(files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero file per compagnia {compagnia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )




@router.get("/{compagnia_id}/analisi/{garanzia_id}/exists")
async def check_analisi_exists(
    compagnia_id: int,
    garanzia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Verifica se esiste già un'analisi AI per una specifica combinazione compagnia-garanzia
    """
    try:
        # Verifica se esiste un record nella tabella analisi_ai_polizze
        result = supabase.table("analisi_ai_polizze").select("id").eq("compagnia_id", compagnia_id).eq("garanzia_id", garanzia_id).execute()
        
        exists = len(result.data) > 0
        
        return {"exists": exists}
        
    except Exception as e:
        logger.error(f"Errore nella verifica esistenza analisi per compagnia {compagnia_id}, garanzia {garanzia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.get("/{compagnia_id}/analisi/{garanzia_id}")
async def get_analisi_esistente(
    compagnia_id: int,
    garanzia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera un'analisi AI esistente per una specifica combinazione compagnia-garanzia
    """
    try:
        # Verifica che la compagnia esista
        compagnia_result = supabase.table("compagnie").select("id, nome").eq("id", compagnia_id).execute()
        if not compagnia_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compagnia con ID {compagnia_id} non trovata"
            )
        
        compagnia = compagnia_result.data[0]
        
        # Verifica che la garanzia esista e recupera informazioni sezione
        garanzia_result = supabase.table("garanzie").select("id, sezione_id, titolo, descrizione, sezioni(nome)").eq("id", garanzia_id).execute()
        if not garanzia_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Garanzia con ID {garanzia_id} non trovata"
            )
        
        garanzia = garanzia_result.data[0]
        # Estrai il nome della sezione dal join
        sezione_nome = garanzia.get("sezioni", {}).get("nome") if garanzia.get("sezioni") else None
        
        # Recupera l'analisi esistente
        analisi_result = supabase.table("analisi_ai_polizze").select("*").eq("compagnia_id", compagnia_id).eq("garanzia_id", garanzia_id).execute()
        
        if not analisi_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analisi non trovata per compagnia {compagnia_id} e garanzia {garanzia_id}"
            )
        
        analisi = analisi_result.data[0]
        
        # Recupera informazioni aggiuntive per la risposta completa
        polizza_result = supabase.table("compagnia_tipologia_assicurazione").select("polizza_text, polizza_filename").eq("compagnia_id", compagnia_id).execute()
        
        polizza_text = None
        polizza_filename = None
        
        if polizza_result.data:
            for polizza in polizza_result.data:
                if polizza.get("polizza_text"):
                    polizza_text = polizza["polizza_text"]
                    polizza_filename = polizza.get("polizza_filename")
                    break
        
        # L'estratto manuale non è più disponibile (garanzia_compagnia rimossa)
        text_extract = None
        
        # Assembla la risposta nel formato compatibile con AnalisiResult del frontend
        response = {
            "compagnia_id": compagnia_id,
            "compagnia_nome": compagnia["nome"],
            "garanzia_id": garanzia_id,
            "garanzia_sezione": sezione_nome,
            "garanzia_titolo": garanzia["titolo"],
            "garanzia_descrizione": garanzia["descrizione"],
            "polizza_text": polizza_text,
            "text_extract": text_extract,
            "polizza_filename": polizza_filename,
            "ai_titolo": analisi.get("ai_titolo"),
            "ai_testo_estratto": analisi.get("ai_testo_estratto"),
            "ai_riferimenti_articoli": analisi.get("ai_riferimenti_articoli"),
            "ai_processed": analisi.get("ai_processed", False),
            "ai_available": analisi.get("ai_available", False)
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nel recupero analisi esistente per compagnia {compagnia_id}, garanzia {garanzia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.post("/analizza-polizza", response_model=AnalizzaPolizzaResponse)
async def analizza_polizza(
    request: AnalizzaPolizzaRequest,
    supabase=Depends(get_supabase)
):
    """
    Analizza una polizza per una specifica compagnia e garanzia.
    Restituisce il testo completo della polizza e l'estratto specifico per la garanzia.
    """
    try:
        compagnia_id = request.compagnia_id
        garanzia_id = request.garanzia_id
        
        # 1. Verifica che la compagnia esista
        compagnia_result = supabase.table("compagnie").select("id, nome").eq("id", compagnia_id).execute()
        if not compagnia_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compagnia con ID {compagnia_id} non trovata"
            )
        
        compagnia = compagnia_result.data[0]
        
        # 2. Verifica che la garanzia esista e recupera informazioni sezione
        garanzia_result = supabase.table("garanzie").select("id, sezione_id, titolo, descrizione, sezioni(nome)").eq("id", garanzia_id).execute()
        if not garanzia_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Garanzia con ID {garanzia_id} non trovata"
            )
        
        garanzia = garanzia_result.data[0]
        # Estrai il nome della sezione dal join
        sezione_nome = garanzia.get("sezioni", {}).get("nome") if garanzia.get("sezioni") else None
        
        # 3. Recupera il testo completo della polizza e gli ID necessari
        polizza_result = supabase.table("compagnia_tipologia_assicurazione").select("id, polizza_text, polizza_filename, tipologia_assicurazione_id").eq("compagnia_id", compagnia_id).execute()
        
        polizza_text = None
        polizza_filename = None
        compagnia_tipologia_assicurazione_id = None
        tipologia_assicurazione_id = None
        
        if polizza_result.data:
            # Prendi la prima polizza trovata con testo
            for polizza in polizza_result.data:
                if polizza.get("polizza_text"):
                    polizza_text = polizza["polizza_text"]
                    polizza_filename = polizza.get("polizza_filename")
                    compagnia_tipologia_assicurazione_id = polizza.get("id")
                    tipologia_assicurazione_id = polizza.get("tipologia_assicurazione_id")
                    break
        
        # 4. L'estratto specifico non è più disponibile (garanzia_compagnia rimossa)
        text_extract = None
        
        # 5. Elaborazione AI
        ai_available = is_ai_available()
        ai_titolo = None
        ai_testo_estratto = None
        ai_riferimenti_articoli = None
        ai_processed = False
        
        if ai_available and polizza_text:
            logger.info(f"Avvio elaborazione AI per compagnia {compagnia_id}, garanzia {garanzia_id}")
            try:
                risultato_ai = estrai_sezione_ai_sync(
                    polizza_text,
                    sezione_nome,
                    garanzia["titolo"],
                    garanzia["descrizione"]
                )
                
                if risultato_ai:
                    ai_titolo = risultato_ai.titolo
                    ai_testo_estratto = risultato_ai.testo_estratto
                    # Ora il campo riferimenti_articoli è già una stringa singola
                    ai_riferimenti_articoli = risultato_ai.riferimenti_articoli
                    ai_processed = True
                    logger.info(f"Elaborazione AI completata con successo - Titolo: {ai_titolo}")
                else:
                    logger.warning("Elaborazione AI fallita - risultato None")
                    
            except Exception as e:
                logger.error(f"Errore durante elaborazione AI: {e}")
        else:
            if not ai_available:
                logger.info("Servizio AI non disponibile (OPENAI_API_KEY mancante)")
            if not polizza_text:
                logger.info("Testo polizza non disponibile per elaborazione AI")
        
        # 6. Salva i risultati dell'AI nella tabella analisi_ai_polizze
        analisi_ai_polizza_id = None
        if ai_processed or ai_available:  # Salva anche se l'AI è disponibile ma non ha processato
            try:
                from datetime import datetime
                now = datetime.utcnow().isoformat()
                
                # Prepara i dati per l'inserimento/aggiornamento
                analisi_data = {
                    "compagnia_tipologia_assicurazione_id": compagnia_tipologia_assicurazione_id,
                    "compagnia_id": compagnia_id,
                    "garanzia_id": garanzia_id,
                    "tipologia_assicurazione_id": tipologia_assicurazione_id,
                    "ai_titolo": ai_titolo,
                    "ai_testo_estratto": ai_testo_estratto,
                    "ai_riferimenti_articoli": ai_riferimenti_articoli,
                    "ai_processed": ai_processed,
                    "ai_available": ai_available,
                    "updated_at": now
                }
                
                # Verifica se esiste già un record per questa combinazione compagnia-garanzia
                existing_analisi = supabase.table("analisi_ai_polizze").select("id").eq("compagnia_id", compagnia_id).eq("garanzia_id", garanzia_id).execute()
                
                if existing_analisi.data:
                    # Aggiorna il record esistente
                    update_result = supabase.table("analisi_ai_polizze").update(analisi_data).eq("compagnia_id", compagnia_id).eq("garanzia_id", garanzia_id).execute()
                    if update_result.data:
                        analisi_ai_polizza_id = update_result.data[0]["id"]
                    logger.info(f"Aggiornato record analisi AI per compagnia {compagnia_id}, garanzia {garanzia_id}")
                else:
                    # Inserisci nuovo record
                    analisi_data["created_at"] = now
                    insert_result = supabase.table("analisi_ai_polizze").insert(analisi_data).execute()
                    if insert_result.data:
                        analisi_ai_polizza_id = insert_result.data[0]["id"]
                    logger.info(f"Creato nuovo record analisi AI per compagnia {compagnia_id}, garanzia {garanzia_id}")
                    
            except Exception as e:
                logger.error(f"Errore nel salvataggio analisi AI: {e}")
                # Non bloccare la risposta se il salvataggio fallisce
        
        # 7. Assembla la risposta semplificata
        response = AnalizzaPolizzaResponse(
            analisi_ai_polizza_id=analisi_ai_polizza_id,
            ai_titolo=ai_titolo,
            ai_testo_estratto=ai_testo_estratto,
            ai_riferimenti_articoli=ai_riferimenti_articoli,
            ai_processed=ai_processed,
            ai_available=ai_available
        )
        
        logger.info(f"Analisi polizza completata per compagnia {compagnia_id} e garanzia {garanzia_id}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'analisi polizza per compagnia {request.compagnia_id} e garanzia {request.garanzia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )


@router.put("/{compagnia_id}/analisi/{garanzia_id}", response_model=AnalisiUpdateResponse)
async def update_analisi_testo_estratto(
    compagnia_id: int,
    garanzia_id: int,
    request: AnalisiUpdateRequest,
    supabase=Depends(get_supabase)
):
    """
    Aggiorna il testo estratto AI per una specifica combinazione compagnia-garanzia
    """
    try:
        # Verifica che la compagnia esista
        compagnia_result = supabase.table("compagnie").select("id, nome").eq("id", compagnia_id).execute()
        if not compagnia_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compagnia con ID {compagnia_id} non trovata"
            )
        
        # Verifica che la garanzia esista
        garanzia_result = supabase.table("garanzie").select("id, titolo").eq("id", garanzia_id).execute()
        if not garanzia_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Garanzia con ID {garanzia_id} non trovata"
            )
        
        # Verifica che l'analisi esista
        analisi_result = supabase.table("analisi_ai_polizze").select("id").eq("compagnia_id", compagnia_id).eq("garanzia_id", garanzia_id).execute()
        
        if not analisi_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analisi non trovata per compagnia {compagnia_id} e garanzia {garanzia_id}"
            )
        
        # Aggiorna il testo estratto AI
        from datetime import datetime
        now = datetime.utcnow().isoformat()
        
        update_data = {
            "ai_testo_estratto": request.ai_testo_estratto,
            "updated_at": now
        }
        
        update_result = supabase.table("analisi_ai_polizze").update(update_data).eq("compagnia_id", compagnia_id).eq("garanzia_id", garanzia_id).execute()
        
        if not update_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Errore nell'aggiornamento del testo estratto AI"
            )
        
        logger.info(f"Aggiornato testo estratto AI per compagnia {compagnia_id}, garanzia {garanzia_id}")
        
        # Prepara la risposta
        response = AnalisiUpdateResponse(
            success=True,
            message="Testo estratto AI aggiornato con successo",
            ai_testo_estratto=request.ai_testo_estratto,
            updated_at=datetime.fromisoformat(now.replace('Z', '+00:00'))
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore nell'aggiornamento testo estratto AI per compagnia {compagnia_id}, garanzia {garanzia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore interno del server: {str(e)}"
        )
