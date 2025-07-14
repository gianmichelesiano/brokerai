"""
API router for Mapping (Garanzia-Compagnia relationships) endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from typing import List, Optional
import logging

from app.models.mapping import (
    MappingRelation,
    MappingRelationCreate,
    MappingRelationUpdate,
    CoverageMatrixResponse,
    MappingStats,
    AnalysisRequest,
    AnalysisResult,
    TestGaranziaRequest,
    TestGaranziaResult
)
from app.config.database import get_supabase, Tables # Import Tables
from app.utils.exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/matrix", response_model=CoverageMatrixResponse)
async def get_mapping_matrix(
    compagnia_ids: Optional[List[int]] = Query(None, description="IDs compagnie da includere"),
    garanzia_ids: Optional[List[int]] = Query(None, description="IDs garanzie da includere"),
    sezione: Optional[str] = Query(None, description="Filtra per sezione garanzie"),
    supabase=Depends(get_supabase)
):
    """
    Recupera la matrice di mapping garanzie-compagnie
    """
    # Mock response for now
    return CoverageMatrixResponse(
        garanzie=[],
        compagnie=[],
        totale_garanzie=0,
        totale_compagnie=0,
        coperture_totali=0,
        percentuale_copertura=0.0
    )


@router.get("/stats", response_model=MappingStats)
async def get_mapping_stats(supabase=Depends(get_supabase)):
    """
    Recupera statistiche dei mapping
    """
    # Mock response for now
    return MappingStats(
        total_relations=0,
        relations_by_method={},
        relations_by_confidence={},
        garanzie_with_coverage=0,
        garanzie_without_coverage=0,
        compagnie_with_analysis=0,
        compagnie_without_analysis=0,
        average_confidence=None,
        coverage_percentage=0.0,
        last_analysis=None
    )


@router.post("/analyze/{compagnia_id}", response_model=AnalysisResult)
async def analyze_compagnia(
    compagnia_id: int,
    analysis_request: AnalysisRequest,
    supabase=Depends(get_supabase)
):
    """
    Esegui analisi AI per mappare garanzie di una compagnia
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.post("/test", response_model=TestGaranziaResult)
async def test_mapping(
    test_request: TestGaranziaRequest,
    supabase=Depends(get_supabase)
):
    """
    Testa il mapping di una singola garanzia su un testo
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.get("/", response_model=List[MappingRelation])
async def get_mappings(
    compagnia_id: Optional[int] = Query(None, description="Filtra per compagnia"),
    garanzia_id: Optional[int] = Query(None, description="Filtra per garanzia"),
    found_only: Optional[bool] = Query(None, description="Solo mapping trovati"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Confidence minima"),
    page: int = Query(1, ge=1, description="Numero pagina"),
    size: int = Query(20, ge=1, le=100, description="Dimensione pagina"),
    supabase=Depends(get_supabase)
):
    """
    Recupera lista di mapping con filtri
    """
    return []


@router.get("/{mapping_id}", response_model=MappingRelation)
async def get_mapping(
    mapping_id: int,
    supabase=Depends(get_supabase)
):
    """
    Recupera un mapping specifico per ID
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Mapping con ID {mapping_id} non trovato"
    )


@router.post("/", response_model=MappingRelation, status_code=status.HTTP_201_CREATED)
async def create_mapping(
    mapping_data: MappingRelationCreate,
    supabase=Depends(get_supabase)
):
    """
    Crea un nuovo mapping manuale
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.put("/{mapping_id}", response_model=MappingRelation)
async def update_mapping(
    mapping_id: int,
    mapping_data: MappingRelationUpdate,
    supabase=Depends(get_supabase)
):
    """
    Aggiorna un mapping esistente
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.delete("/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mapping(
    mapping_id: int,
    supabase=Depends(get_supabase)
):
    """
    Elimina un mapping
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.post("/bulk-analyze")
async def bulk_analyze(
    compagnia_ids: List[int],
    garanzia_ids: Optional[List[int]] = None,
    force_reanalyze: bool = False,
    supabase=Depends(get_supabase)
):
    """
    Esegui analisi AI in batch per multiple compagnie
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.get("/export/csv")
async def export_mappings_csv(
    compagnia_ids: Optional[List[int]] = Query(None),
    garanzia_ids: Optional[List[int]] = Query(None),
    found_only: Optional[bool] = Query(False),
    supabase=Depends(get_supabase)
):
    """
    Esporta mapping in formato CSV
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.post("/import/csv")
async def import_mappings_csv(
    file: bytes,
    overwrite: bool = False,
    supabase=Depends(get_supabase)
):
    """
    Importa mapping da file CSV
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint non ancora implementato"
    )


@router.post("/matrix/analisi", response_model=dict)
async def get_matrix_analisi(
    tipologia_id: int = Body(..., description="ID della tipologia"),
    compagnia_ids: List[int] = Body(..., description="Lista degli ID delle compagnie"),
    supabase=Depends(get_supabase)
):
    """
    Recupera la matrice completa delle analisi per una tipologia e un set di compagnie.
    """
    try:
        # 1. Recupera le garanzie per la tipologia
        garanzie_response = supabase.table('garanzie')\
            .select('id, titolo, descrizione, sezione_id, sezioni(nome)')\
            .eq('tipologia', tipologia_id)\
            .order('sezione_id', desc=False)\
            .order('titolo', desc=False)\
            .execute()
        
        garanzie = []
        for g in garanzie_response.data:
            garanzie.append({
                'id': g['id'],
                'titolo': g['titolo'],
                'descrizione': g['descrizione'],
                'sezione_nome': g['sezioni']['nome'] if g.get('sezioni') else 'N/A'
            })
        
        # 2. Recupera le compagnie
        compagnie_response = supabase.table('compagnie')\
            .select('id, nome')\
            .in_('id', compagnia_ids)\
            .execute()
        
        compagnie = compagnie_response.data
        
        # 3. Recupera tutte le analisi dalla tabella corretta
        garanzia_ids = [g['id'] for g in garanzie]
        
        analisi_response = supabase.table('analisi_ai_polizze')\
            .select('*')\
            .in_('compagnia_id', compagnia_ids)\
            .in_('garanzia_id', garanzia_ids)\
            .execute()
        
        # 4. Costruisci la mappa delle analisi
        analisi_map = {}
        for analisi in analisi_response.data:
            key = f"{analisi['compagnia_id']}-{analisi['garanzia_id']}"
            analisi_map[key] = {
                'compagnia_id': analisi['compagnia_id'],
                'garanzia_id': analisi['garanzia_id'],
                'found': analisi.get('ai_available', False),
                'ai_riferimenti_articoli': analisi.get('ai_riferimenti_articoli'),
                'ai_testo_estratto': analisi.get('ai_testo_estratto'),
                'ai_titolo': analisi.get('ai_titolo'),
                'ai_available': analisi.get('ai_available', False),
                'ai_processed': analisi.get('ai_processed', False)
            }
        
        # 5. Costruisci l'array completo includendo anche le combinazioni non trovate
        analisi_list = []
        for compagnia in compagnie:
            for garanzia in garanzie:
                key = f"{compagnia['id']}-{garanzia['id']}"
                if key in analisi_map:
                    analisi_list.append(analisi_map[key])
                else:
                    analisi_list.append({
                        'compagnia_id': compagnia['id'],
                        'garanzia_id': garanzia['id'],
                        'found': False,
                        'ai_available': False,
                        'ai_processed': False
                    })
        
        # 6. Calcola statistiche
        total_cells = len(compagnie) * len(garanzie)
        found_count = sum(1 for a in analisi_list if a.get('found', False))
        
        return {
            'tipologia': {
                'id': tipologia_id
            },
            'compagnie': compagnie,
            'garanzie': garanzie,
            'analisi': analisi_list,
            'stats': {
                'total_cells': total_cells,
                'found_count': found_count,
                'coverage_percentage': (found_count / total_cells * 100) if total_cells > 0 else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Errore nel recupero della matrice analisi: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nel recupero dei dati: {str(e)}"
        )