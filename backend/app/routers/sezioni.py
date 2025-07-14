"""
API router for Sezioni (Insurance Sections) endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
import logging

from app.models.sezioni import (
    Sezione,
    SezioneCreate,
    SezioneUpdate,
    SezioneList,
    SezioneListWithStats,
    SezioneFilter,
    SezioneStats,
    SezioneBulkCreate,
    SezioneBulkUpdate,
    SezioneBulkDelete
)
from app.services.sezioni_service import sezioni_service
from app.utils.exceptions import NotFoundError, ValidationError
from app.config.database import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=SezioneList)
async def get_sezioni(
    search: Optional[str] = Query(None, description="Ricerca nel nome e descrizione"),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    sort_by: Optional[str] = Query("nome", description="Campo per ordinamento"),
    sort_order: Optional[str] = Query("asc", pattern="^(asc|desc)$", description="Ordine di ordinamento"),
    supabase=Depends(get_supabase)
):
    """
    Recupera lista paginata di sezioni con filtri opzionali
    """
    try:
        filters = SezioneFilter(
            search=search,
            page=page,
            size=size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        result = await sezioni_service.get_sezioni_list(filters, supabase)
        
        logger.info(f"Retrieved {len(result.items)} sezioni (page {page}, total: {result.total})")
        
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving sezioni: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle sezioni: {str(e)}"
        )


@router.get("/with-stats", response_model=SezioneListWithStats)
async def get_sezioni_with_stats(
    search: Optional[str] = Query(None, description="Ricerca nel nome e descrizione"),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    sort_by: Optional[str] = Query("nome", description="Campo per ordinamento"),
    sort_order: Optional[str] = Query("asc", pattern="^(asc|desc)$", description="Ordine di ordinamento"),
    supabase=Depends(get_supabase)
):
    """
    Recupera lista paginata di sezioni con statistiche garanzie
    """
    try:
        filters = SezioneFilter(
            search=search,
            page=page,
            size=size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        result = await sezioni_service.get_sezioni_list_with_stats(filters, supabase)
        
        logger.info(f"Retrieved {len(result.items)} sezioni with stats (page {page}, total: {result.total})")
        
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving sezioni with stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle sezioni con statistiche: {str(e)}"
        )


@router.get("/all", response_model=List[Sezione])
async def get_all_sezioni(supabase=Depends(get_supabase)):
    """
    Recupera tutte le sezioni senza paginazione (per dropdown, etc.)
    """
    try:
        sezioni = await sezioni_service.get_all_sezioni_simple(supabase)
        
        logger.info(f"Retrieved {len(sezioni)} sezioni (all)")
        
        return sezioni
        
    except Exception as e:
        logger.error(f"Error retrieving all sezioni: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero di tutte le sezioni: {str(e)}"
        )


@router.get("/stats", response_model=SezioneStats)
async def get_sezioni_stats(supabase=Depends(get_supabase)):
    """
    Recupera statistiche delle sezioni
    """
    try:
        stats = await sezioni_service.get_sezioni_stats(supabase)
        
        logger.info(f"Retrieved sezioni stats: {stats.total_sezioni} total")
        
        return stats
        
    except Exception as e:
        logger.error(f"Error retrieving sezioni stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle statistiche: {str(e)}"
        )


@router.get("/{sezione_id}", response_model=Sezione)
async def get_sezione(
    sezione_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera una sezione specifica per ID
    """
    try:
        sezione = await sezioni_service.get_sezione_by_id(sezione_id, supabase)
        
        if not sezione:
            raise NotFoundError("Sezione", sezione_id)
        
        logger.info(f"Retrieved sezione {sezione_id}: {sezione.nome}")
        
        return sezione
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sezione con ID {sezione_id} non trovata"
        )
    except Exception as e:
        logger.error(f"Error retrieving sezione {sezione_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero della sezione: {str(e)}"
        )


@router.get("/by-nome/{nome}", response_model=Sezione)
async def get_sezione_by_nome(
    nome: str,
    supabase=Depends(get_supabase)
):
    """
    Recupera una sezione specifica per nome
    """
    try:
        if len(nome.strip()) < 1:
            raise ValidationError(
                "Il nome della sezione non può essere vuoto",
                "Inserire un nome valido"
            )
        
        sezione = await sezioni_service.get_sezione_by_nome(nome, supabase)
        
        if not sezione:
            raise NotFoundError("Sezione", nome)
        
        logger.info(f"Retrieved sezione by nome '{nome}': {sezione.id}")
        
        return sezione
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sezione con nome '{nome}' non trovata"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error retrieving sezione by nome '{nome}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero della sezione: {str(e)}"
        )


@router.post("/", response_model=Sezione, status_code=status.HTTP_201_CREATED)
async def create_sezione(
    sezione_data: SezioneCreate,
    supabase=Depends(get_supabase)
):
    """
    Crea una nuova sezione
    """
    try:
        # Check if sezione with same nome already exists
        existing = await sezioni_service.get_sezione_by_nome(sezione_data.nome, supabase)
        if existing:
            raise ValidationError(
                f"Esiste già una sezione con il nome '{sezione_data.nome}'",
                "Utilizzare un nome diverso"
            )
        
        sezione = await sezioni_service.create_sezione(sezione_data, supabase)
        
        logger.info(f"Created sezione {sezione.id}: {sezione.nome}")
        
        return sezione
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error creating sezione: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella creazione della sezione: {str(e)}"
        )


@router.put("/{sezione_id}", response_model=Sezione)
async def update_sezione(
    sezione_id: int,
    sezione_data: SezioneUpdate,
    supabase=Depends(get_supabase)
):
    """
    Aggiorna una sezione esistente
    """
    try:
        # Check if sezione exists
        existing = await sezioni_service.get_sezione_by_id(sezione_id, supabase)
        if not existing:
            raise NotFoundError("Sezione", sezione_id)
        
        # Check if new nome conflicts with existing sezione
        if sezione_data.nome and sezione_data.nome != existing.nome:
            nome_conflict = await sezioni_service.get_sezione_by_nome(sezione_data.nome, supabase)
            if nome_conflict and nome_conflict.id != sezione_id:
                raise ValidationError(
                    f"Esiste già una sezione con il nome '{sezione_data.nome}'",
                    "Utilizzare un nome diverso"
                )
        
        sezione = await sezioni_service.update_sezione(sezione_id, sezione_data, supabase)
        
        logger.info(f"Updated sezione {sezione_id}: {sezione.nome}")
        
        return sezione
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sezione con ID {sezione_id} non trovata"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error updating sezione {sezione_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nell'aggiornamento della sezione: {str(e)}"
        )


@router.delete("/{sezione_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sezione(
    sezione_id: int,
    supabase=Depends(get_supabase)
):
    """
    Elimina una sezione
    """
    try:
        # Check if sezione exists
        existing = await sezioni_service.get_sezione_by_id(sezione_id, supabase)
        if not existing:
            raise NotFoundError("Sezione", sezione_id)
        
        await sezioni_service.delete_sezione(sezione_id, supabase)
        
        logger.info(f"Deleted sezione {sezione_id}: {existing.nome}")
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sezione con ID {sezione_id} non trovata"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error deleting sezione {sezione_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nell'eliminazione della sezione: {str(e)}"
        )


@router.get("/search/{query}", response_model=SezioneList)
async def search_sezioni(
    query: str,
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    supabase=Depends(get_supabase)
):
    """
    Ricerca sezioni per testo
    """
    try:
        if len(query.strip()) < 2:
            raise ValidationError(
                "La query di ricerca deve contenere almeno 2 caratteri",
                "Inserire una query più lunga"
            )
        
        filters = SezioneFilter(
            search=query,
            page=page,
            size=size
        )
        
        result = await sezioni_service.search_sezioni(filters, supabase)
        
        logger.info(f"Search '{query}' returned {len(result.items)} results")
        
        return result
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error searching sezioni with query '{query}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella ricerca: {str(e)}"
        )


@router.get("/{sezione_id}/garanzie-count")
async def get_sezione_garanzie_count(
    sezione_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera il numero di garanzie associate a una sezione
    """
    try:
        # Check if sezione exists
        sezione = await sezioni_service.get_sezione_by_id(sezione_id, supabase)
        if not sezione:
            raise NotFoundError("Sezione", sezione_id)
        
        count = await sezioni_service.count_sezione_garanzie(sezione_id, supabase)
        
        logger.info(f"Retrieved garanzie count for sezione {sezione_id}: {count}")
        
        return {
            "sezione_id": sezione_id,
            "sezione_nome": sezione.nome,
            "garanzie_count": count
        }
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sezione con ID {sezione_id} non trovata"
        )
    except Exception as e:
        logger.error(f"Error retrieving garanzie count for sezione {sezione_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero del conteggio garanzie: {str(e)}"
        )


@router.post("/bulk", response_model=List[Sezione], status_code=status.HTTP_201_CREATED)
async def bulk_create_sezioni(
    bulk_data: SezioneBulkCreate,
    supabase=Depends(get_supabase)
):
    """
    Crea multiple sezioni in una sola operazione
    """
    try:
        sezioni = await sezioni_service.bulk_create_sezioni(bulk_data.sezioni, supabase)
        
        logger.info(f"Bulk created {len(sezioni)} sezioni")
        
        return sezioni
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error bulk creating sezioni: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella creazione bulk delle sezioni: {str(e)}"
        )


@router.delete("/bulk", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_sezioni(
    bulk_data: SezioneBulkDelete,
    supabase=Depends(get_supabase)
):
    """
    Elimina multiple sezioni in una sola operazione
    """
    try:
        deleted_count = 0
        errors = []
        
        for sezione_id in bulk_data.ids:
            try:
                # Check if sezione exists
                existing = await sezioni_service.get_sezione_by_id(sezione_id, supabase)
                if not existing:
                    errors.append(f"Sezione {sezione_id} non trovata")
                    continue
                
                await sezioni_service.delete_sezione(sezione_id, supabase)
                deleted_count += 1
                
            except ValidationError as e:
                errors.append(f"Sezione {sezione_id}: {e.message}")
            except Exception as e:
                errors.append(f"Sezione {sezione_id}: {str(e)}")
        
        if errors:
            logger.warning(f"Bulk delete completed with errors: {errors}")
            raise HTTPException(
                status_code=status.HTTP_207_MULTI_STATUS,
                detail={
                    "deleted_count": deleted_count,
                    "errors": errors,
                    "message": f"Eliminate {deleted_count} sezioni con {len(errors)} errori"
                }
            )
        
        logger.info(f"Bulk deleted {deleted_count} sezioni")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bulk deleting sezioni: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nell'eliminazione bulk delle sezioni: {str(e)}"
        )
