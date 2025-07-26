"""
API router for Garanzie (Insurance Guarantees) endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
import logging

from app.models.garanzie import (
    Garanzia,
    GaranziaCreate,
    GaranziaUpdate,
    GaranziaList,
    GaranziaFilter,
    GaranziaStats,
    SezioneInfo,
    GaranzieByTipologiaResponse,
    GeneraGaranzieRequest,
    GeneraGaranzieResponse
)
from app.services.garanzie_service import garanzie_service
from app.utils.exceptions import NotFoundError, ValidationError
from app.config.database import get_supabase
from app.dependencies.auth import (
    require_garanzie_access, get_user_company_filter, add_company_id_to_data
)
from app.models.companies import UserContext

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=GaranziaList)
async def get_garanzie(
    sezione: Optional[str] = Query(None, description="Filtra per sezione"),
    search: Optional[str] = Query(None, description="Ricerca nel titolo e descrizione"),
    tipologia_id: Optional[int] = Query(None, description="Filtra per tipologia assicurativa"),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    sort_by: Optional[str] = Query("created_at", description="Campo per ordinamento"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$", description="Ordine di ordinamento"),
    user_context: UserContext = Depends(require_garanzie_access),
    supabase=Depends(get_supabase)
):
    """
    Recupera lista paginata di garanzie con filtri opzionali
    """
    try:
        filters = GaranziaFilter(
            sezione=sezione,
            search=search,
            tipologia_id=tipologia_id,
            page=page,
            size=size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        result = await garanzie_service.get_garanzie_list(filters, supabase)
        
        logger.info(f"Retrieved {len(result.items)} garanzie (page {page}, total: {result.total})")
        
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving garanzie: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle garanzie: {str(e)}"
        )


@router.get("/stats", response_model=GaranziaStats)
async def get_garanzie_stats(
    user_context: UserContext = Depends(require_garanzie_access),
    supabase=Depends(get_supabase)
):
    """
    Recupera statistiche delle garanzie
    """
    try:
        stats = await garanzie_service.get_garanzie_stats(supabase)
        
        logger.info(f"Retrieved garanzie stats: {stats.total_garanzie} total")
        
        return stats
        
    except Exception as e:
        logger.error(f"Error retrieving garanzie stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle statistiche: {str(e)}"
        )


@router.get("/sezioni", response_model=List[SezioneInfo])
async def get_sezioni(supabase=Depends(get_supabase)):
    """
    Recupera lista delle sezioni disponibili
    """
    try:
        sezioni = await garanzie_service.get_sezioni_list(supabase)
        
        logger.info(f"Retrieved {len(sezioni)} sezioni")
        
        return sezioni
        
    except Exception as e:
        logger.error(f"Error retrieving sezioni: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle sezioni: {str(e)}"
        )


@router.get("/by-tipologia/{tipologia_id}", response_model=GaranzieByTipologiaResponse)
async def get_garanzie_by_tipologia_id(
    tipologia_id: int,
    sezione: Optional[str] = Query(None, description="Filtra per sezione"),
    search: Optional[str] = Query(None, description="Ricerca nel titolo e descrizione"),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    sort_by: Optional[str] = Query("created_at", description="Campo per ordinamento"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$", description="Ordine di ordinamento"),
    supabase=Depends(get_supabase)
):
    """
    Recupera tutte le garanzie per una specifica tipologia assicurativa (per ID)
    """
    try:
        filters = GaranziaFilter(
            sezione=sezione,
            search=search,
            page=page,
            size=size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        result = await garanzie_service.get_garanzie_by_tipologia_id(tipologia_id, filters, supabase)
        
        logger.info(f"Retrieved {len(result.garanzie.items)} garanzie for tipologia {tipologia_id} (page {page}, total: {result.garanzie.total})")
        
        return result
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tipologia con ID {tipologia_id} non trovata"
        )
    except Exception as e:
        logger.error(f"Error retrieving garanzie for tipologia {tipologia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle garanzie per tipologia: {str(e)}"
        )


@router.get("/by-tipologia", response_model=GaranzieByTipologiaResponse)
async def get_garanzie_by_tipologia_nome(
    nome: str = Query(..., description="Nome della tipologia assicurativa"),
    sezione: Optional[str] = Query(None, description="Filtra per sezione"),
    search: Optional[str] = Query(None, description="Ricerca nel titolo e descrizione"),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    sort_by: Optional[str] = Query("created_at", description="Campo per ordinamento"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$", description="Ordine di ordinamento"),
    supabase=Depends(get_supabase)
):
    """
    Recupera tutte le garanzie per una specifica tipologia assicurativa (per nome)
    """
    try:
        if len(nome.strip()) < 1:
            raise ValidationError(
                "Il nome della tipologia non può essere vuoto",
                "Inserire un nome valido"
            )
        
        filters = GaranziaFilter(
            sezione=sezione,
            search=search,
            page=page,
            size=size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        result = await garanzie_service.get_garanzie_by_tipologia_nome(nome, filters, supabase)
        
        logger.info(f"Retrieved {len(result.garanzie.items)} garanzie for tipologia '{nome}' (page {page}, total: {result.garanzie.total})")
        
        return result
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tipologia con nome '{nome}' non trovata"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error retrieving garanzie for tipologia '{nome}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle garanzie per tipologia: {str(e)}"
        )


@router.get("/{garanzia_id}", response_model=Garanzia)
async def get_garanzia(
    garanzia_id: int,
    user_context: UserContext = Depends(require_garanzie_access),
    supabase=Depends(get_supabase)
):
    """
    Recupera una garanzia specifica per ID
    """
    try:
        garanzia = await garanzie_service.get_garanzia_by_id(garanzia_id, supabase)
        
        if not garanzia:
            raise NotFoundError("Garanzia", garanzia_id)
        
        logger.info(f"Retrieved garanzia {garanzia_id}: {garanzia.titolo}")
        
        return garanzia
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Garanzia con ID {garanzia_id} non trovata"
        )
    except Exception as e:
        logger.error(f"Error retrieving garanzia {garanzia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero della garanzia: {str(e)}"
        )


@router.post("/", response_model=Garanzia, status_code=status.HTTP_201_CREATED)
async def create_garanzia(
    garanzia_data: GaranziaCreate,
    user_context: UserContext = Depends(require_garanzie_access),
    supabase=Depends(get_supabase)
):
    """
    Crea una nuova garanzia
    """
    try:
        # Check if garanzia with same title already exists (within the same company)
        existing = await garanzie_service.get_garanzia_by_title(garanzia_data.titolo, user_context.company_id, supabase)
        if existing:
            raise ValidationError(
                f"Esiste già una garanzia con il titolo '{garanzia_data.titolo}'",
                "Utilizzare un titolo diverso"
            )
        
        garanzia = await garanzie_service.create_garanzia(garanzia_data, user_context.company_id, supabase)
        
        logger.info(f"Created garanzia {garanzia.id}: {garanzia.titolo}")
        
        return garanzia
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error creating garanzia: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella creazione della garanzia: {str(e)}"
        )


@router.put("/{garanzia_id}", response_model=Garanzia)
async def update_garanzia(
    garanzia_id: int,
    garanzia_data: GaranziaUpdate,
    user_context: UserContext = Depends(require_garanzie_access),
    supabase=Depends(get_supabase)
):
    """
    Aggiorna una garanzia esistente
    """
    try:
        # Check if garanzia exists
        existing = await garanzie_service.get_garanzia_by_id(garanzia_id, supabase)
        if not existing:
            raise NotFoundError("Garanzia", garanzia_id)
        
        # Check if new title conflicts with existing garanzia
        if garanzia_data.titolo and garanzia_data.titolo != existing.titolo:
            title_conflict = await garanzie_service.get_garanzia_by_title(garanzia_data.titolo, user_context.company_id, supabase)
            if title_conflict and title_conflict.id != garanzia_id:
                raise ValidationError(
                    f"Esiste già una garanzia con il titolo '{garanzia_data.titolo}'",
                    "Utilizzare un titolo diverso"
                )
        
        garanzia = await garanzie_service.update_garanzia(garanzia_id, garanzia_data, supabase)
        
        logger.info(f"Updated garanzia {garanzia_id}: {garanzia.titolo}")
        
        return garanzia
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Garanzia con ID {garanzia_id} non trovata"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error updating garanzia {garanzia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nell'aggiornamento della garanzia: {str(e)}"
        )


@router.delete("/{garanzia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_garanzia(
    garanzia_id: int,
    user_context: UserContext = Depends(require_garanzie_access),
    supabase=Depends(get_supabase)
):
    """
    Elimina una garanzia
    """
    try:
        # Check if garanzia exists
        existing = await garanzie_service.get_garanzia_by_id(garanzia_id, supabase)
        if not existing:
            raise NotFoundError("Garanzia", garanzia_id)
        
        # Check if garanzia is used in mappings
        mappings_count = await garanzie_service.count_garanzia_mappings(garanzia_id, supabase)
        if mappings_count > 0:
            raise ValidationError(
                f"Impossibile eliminare la garanzia: è utilizzata in {mappings_count} mapping",
                "Eliminare prima i mapping associati"
            )
        
        await garanzie_service.delete_garanzia(garanzia_id, supabase)
        
        logger.info(f"Deleted garanzia {garanzia_id}: {existing.titolo}")
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Garanzia con ID {garanzia_id} non trovata"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error deleting garanzia {garanzia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nell'eliminazione della garanzia: {str(e)}"
        )


@router.get("/search/{query}", response_model=GaranziaList)
async def search_garanzie(
    query: str,
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    sezione: Optional[str] = Query(None, description="Filtra per sezione"),
    supabase=Depends(get_supabase)
):
    """
    Ricerca garanzie per testo
    """
    try:
        if len(query.strip()) < 2:
            raise ValidationError(
                "La query di ricerca deve contenere almeno 2 caratteri",
                "Inserire una query più lunga"
            )
        
        filters = GaranziaFilter(
            search=query,
            sezione=sezione,
            page=page,
            size=size
        )
        
        result = await garanzie_service.search_garanzie(filters, supabase)
        
        logger.info(f"Search '{query}' returned {len(result.items)} results")
        
        return result
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error searching garanzie with query '{query}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella ricerca: {str(e)}"
        )


@router.get("/{garanzia_id}/mappings")
async def get_garanzia_mappings(
    garanzia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera i mapping associati a una garanzia
    """
    try:
        # Check if garanzia exists
        garanzia = await garanzie_service.get_garanzia_by_id(garanzia_id, supabase)
        if not garanzia:
            raise NotFoundError("Garanzia", garanzia_id)
        
        mappings = await garanzie_service.get_garanzia_mappings(garanzia_id, supabase)
        
        logger.info(f"Retrieved {len(mappings)} mappings for garanzia {garanzia_id}")
        
        return {
            "garanzia_id": garanzia_id,
            "garanzia_titolo": garanzia.titolo,
            "mappings": mappings,
            "total_mappings": len(mappings)
        }
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Garanzia con ID {garanzia_id} non trovata"
        )
    except Exception as e:
        logger.error(f"Error retrieving mappings for garanzia {garanzia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero dei mapping: {str(e)}"
        )


@router.get("/{garanzia_id}/coverage-stats")
async def get_garanzia_coverage_stats(
    garanzia_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera statistiche di copertura per una garanzia
    """
    try:
        # Check if garanzia exists
        garanzia = await garanzie_service.get_garanzia_by_id(garanzia_id, supabase)
        if not garanzia:
            raise NotFoundError("Garanzia", garanzia_id)
        
        stats = await garanzie_service.get_garanzia_coverage_stats(garanzia_id, supabase)
        
        logger.info(f"Retrieved coverage stats for garanzia {garanzia_id}")
        
        # Get section name by joining with sezioni table
        garanzia_with_sezione = supabase.table("garanzie").select("*, sezioni(nome)").eq("id", garanzia_id).execute()
        sezione_nome = None
        if garanzia_with_sezione.data:
            sezione_info = garanzia_with_sezione.data[0].get("sezioni")
            if sezione_info:
                sezione_nome = sezione_info.get("nome")
        
        return {
            "garanzia_id": garanzia_id,
            "garanzia_titolo": garanzia.titolo,
            "garanzia_sezione": sezione_nome,
            **stats
        }
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Garanzia con ID {garanzia_id} non trovata"
        )
    except Exception as e:
        logger.error(f"Error retrieving coverage stats for garanzia {garanzia_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero delle statistiche: {str(e)}"
        )


@router.post("/genera/{tipologia_assicurazione_id}", response_model=GeneraGaranzieResponse, status_code=status.HTTP_201_CREATED)
async def genera_garanzie(
    tipologia_assicurazione_id: int,
    request: GeneraGaranzieRequest,
    supabase=Depends(get_supabase)
):
    """
    Genera garanzie per una tipologia assicurativa usando AI e le salva nel database
    """
    try:
        # Import here to avoid circular imports
        from app.utils.genera_garanzie import InsuranceGuaranteesService
        
        # Check if tipologia exists
        tipologia_result = supabase.table("tipologia_assicurazione").select("*").eq("id", tipologia_assicurazione_id).execute()
        
        if not tipologia_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tipologia assicurativa con ID {tipologia_assicurazione_id} non trovata"
            )
        
        tipologia = tipologia_result.data[0]
        
        # Initialize the AI service
        ai_service = InsuranceGuaranteesService()
        
        # Generate and save guarantees
        result = await ai_service.generate_and_save_guarantees(
            tipologia_assicurazione_id=tipologia_assicurazione_id,
            insurance_type_name=tipologia["nome"],
            field_description=tipologia.get("descrizione", ""),
            custom_requirements=request.custom_requirements,
            save_duplicates=request.save_duplicates
        )
        
        # Convert to response model
        response = GeneraGaranzieResponse(
            tipologia_assicurazione_id=result["tipologia_assicurazione_id"],
            insurance_type=result["insurance_type"],
            field_description=result["field_description"],
            summary=result["summary"],
            total_generated=result["total_generated"],
            new_guarantees=result["new_guarantees"],
            duplicate_guarantees=result["duplicate_guarantees"],
            saved_to_database=result["saved_to_database"],
            generated_guarantees=[
                {
                    "name": g["name"],
                    "description": g["description"],
                    "section": g["section"],
                    "is_duplicate": g["is_duplicate"],
                    "is_new": g["is_new"]
                }
                for g in result["generated_guarantees"]
            ],
            saved_guarantees=result["saved_guarantees"],
            existing_guarantees_found=result["existing_guarantees_found"],
            new_guarantees_added=result["new_guarantees_added"]
        )
        
        logger.info(
            f"Generated and saved guarantees for tipologia {tipologia_assicurazione_id}: "
            f"{result['total_generated']} generated, {result['saved_to_database']} saved"
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating guarantees for tipologia {tipologia_assicurazione_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella generazione delle garanzie: {str(e)}"
        )
