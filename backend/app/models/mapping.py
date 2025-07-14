"""
Pydantic models for Mapping (Garanzia-Compagnia relationships)
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from .garanzie import Garanzia
from .compagnie import Compagnia


class MappingRelationBase(BaseModel):
    """Base model for Mapping Relation"""
    garanzia_id: int = Field(..., description="ID della garanzia")
    compagnia_id: int = Field(..., description="ID della compagnia")
    text_extract: Optional[str] = Field(None, description="Testo estratto dalla polizza")
    ref_number: Optional[str] = Field(None, max_length=100, description="Numero di riferimento/articolo")
    title: Optional[str] = Field(None, max_length=255, description="Titolo trovato nel documento")
    ai_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence dell'analisi AI")
    
    @validator('text_extract')
    def validate_text_extract(cls, v):
        if v:
            v = v.strip()
        return v
    
    @validator('ref_number')
    def validate_ref_number(cls, v):
        if v:
            v = v.strip()
        return v
    
    @validator('title')
    def validate_title(cls, v):
        if v:
            v = v.strip()
        return v


class MappingRelationCreate(MappingRelationBase):
    """Model for creating a new Mapping Relation"""
    analysis_method: str = Field(default="manual", description="Metodo di analisi (manual, openai)")
    
    @validator('analysis_method')
    def validate_analysis_method(cls, v):
        allowed_methods = ["manual", "openai", "automated"]
        if v not in allowed_methods:
            raise ValueError(f"Metodo di analisi deve essere uno di: {allowed_methods}")
        return v


class MappingRelationUpdate(BaseModel):
    """Model for updating an existing Mapping Relation"""
    text_extract: Optional[str] = Field(None, description="Testo estratto dalla polizza")
    ref_number: Optional[str] = Field(None, max_length=100)
    title: Optional[str] = Field(None, max_length=255)
    ai_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    
    @validator('text_extract')
    def validate_text_extract(cls, v):
        if v:
            v = v.strip()
        return v
    
    @validator('ref_number')
    def validate_ref_number(cls, v):
        if v:
            v = v.strip()
        return v
    
    @validator('title')
    def validate_title(cls, v):
        if v:
            v = v.strip()
        return v


class MappingRelation(MappingRelationBase):
    """Complete Mapping Relation model with database fields"""
    id: int
    analysis_method: str
    created_at: datetime
    updated_at: datetime
    garanzia: Garanzia
    compagnia: Compagnia
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MappingRelationSimple(MappingRelationBase):
    """Simplified Mapping Relation without nested objects"""
    id: int
    analysis_method: str
    created_at: datetime
    updated_at: datetime
    garanzia_titolo: str
    garanzia_sezione: str
    compagnia_nome: str
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MappingRelationList(BaseModel):
    """Model for paginated list of Mapping Relations"""
    items: List[MappingRelationSimple]
    total: int
    page: int
    size: int
    pages: int
    
    class Config:
        from_attributes = True


class MappingRelationFilter(BaseModel):
    """Model for filtering Mapping Relations"""
    garanzia_id: Optional[int] = Field(None, description="Filtra per garanzia")
    compagnia_id: Optional[int] = Field(None, description="Filtra per compagnia")
    sezione: Optional[str] = Field(None, description="Filtra per sezione garanzia")
    analysis_method: Optional[str] = Field(None, description="Filtra per metodo analisi")
    min_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence minima")
    max_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence massima")
    has_text: Optional[bool] = Field(None, description="Filtra per presenza testo")
    page: int = Field(default=1, ge=1, description="Numero pagina")
    size: int = Field(default=20, ge=1, le=100, description="Dimensione pagina")
    sort_by: Optional[str] = Field(default="created_at", description="Campo per ordinamento")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$", description="Ordine di ordinamento")
    
    @validator('sezione')
    def validate_sezione(cls, v):
        if v:
            v = v.strip().upper()
        return v


class CoverageMatrix(BaseModel):
    """Model for coverage matrix"""
    garanzia_id: int
    garanzia_titolo: str
    garanzia_sezione: str
    compagnie_coperture: Dict[str, Dict[str, Any]]
    
    class Config:
        from_attributes = True


class CoverageMatrixResponse(BaseModel):
    """Model for coverage matrix response"""
    garanzie: List[CoverageMatrix]
    compagnie: List[str]
    totale_garanzie: int
    totale_compagnie: int
    coperture_totali: int
    percentuale_copertura: float
    
    class Config:
        from_attributes = True


class AnalysisRequest(BaseModel):
    """Model for AI analysis request"""
    compagnia_id: int
    garanzie_ids: Optional[List[int]] = Field(None, description="IDs specifiche garanzie da analizzare")
    force_reanalysis: bool = Field(default=False, description="Forza ri-analisi")
    batch_size: int = Field(default=5, ge=1, le=20, description="Dimensione batch per analisi")
    
    @validator('garanzie_ids')
    def validate_garanzie_ids(cls, v):
        if v and len(v) != len(set(v)):
            raise ValueError("Gli ID delle garanzie devono essere unici")
        return v


class AnalysisResult(BaseModel):
    """Model for AI analysis result"""
    compagnia_id: int
    compagnia_nome: str
    totale_garanzie: int
    analizzate: int
    trovate: int
    non_trovate: int
    errori: int
    tempo_esecuzione: float
    confidence_media: Optional[float]
    dettagli: List[Dict[str, Any]]
    
    class Config:
        from_attributes = True


class AnalysisProgress(BaseModel):
    """Model for analysis progress tracking"""
    task_id: str
    compagnia_id: int
    status: str = Field(..., pattern="^(pending|processing|completed|failed)$")
    progress: float = Field(ge=0.0, le=100.0)
    current_step: str
    processed: int = 0
    total: int = 0
    found: int = 0
    not_found: int = 0
    errors: int = 0
    start_time: datetime
    estimated_completion: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TestGaranziaRequest(BaseModel):
    """Model for testing single guarantee"""
    garanzia_id: int
    compagnia_id: int
    custom_text: Optional[str] = Field(None, description="Testo personalizzato per test")
    
    @validator('custom_text')
    def validate_custom_text(cls, v):
        if v:
            v = v.strip()
        return v


class TestGaranziaResult(BaseModel):
    """Model for single guarantee test result"""
    garanzia_id: int
    garanzia_titolo: str
    compagnia_id: int
    compagnia_nome: str
    found: bool
    confidence: float
    ref_number: Optional[str]
    title: Optional[str]
    text_extract: Optional[str]
    analysis_time: float
    ai_response: Dict[str, Any]
    
    class Config:
        from_attributes = True


class MappingStats(BaseModel):
    """Model for mapping statistics"""
    total_relations: int
    relations_by_method: Dict[str, int]
    relations_by_confidence: Dict[str, int]  # ranges: 0-0.3, 0.3-0.7, 0.7-1.0
    garanzie_with_coverage: int
    garanzie_without_coverage: int
    compagnie_with_analysis: int
    compagnie_without_analysis: int
    average_confidence: Optional[float]
    coverage_percentage: float
    last_analysis: Optional[datetime]
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class MappingBulkCreate(BaseModel):
    """Model for bulk creating mapping relations"""
    relations: List[MappingRelationCreate] = Field(..., min_items=1, max_items=100)
    
    @validator('relations')
    def validate_unique_relations(cls, v):
        pairs = [(r.garanzia_id, r.compagnia_id) for r in v]
        if len(pairs) != len(set(pairs)):
            raise ValueError("Le coppie garanzia-compagnia devono essere uniche")
        return v


class MappingBulkUpdate(BaseModel):
    """Model for bulk updating mapping relations"""
    updates: List[dict] = Field(..., min_items=1, max_items=100)
    
    @validator('updates')
    def validate_updates(cls, v):
        for update in v:
            if 'id' not in update:
                raise ValueError("Ogni aggiornamento deve contenere un ID")
        return v


class MappingBulkDelete(BaseModel):
    """Model for bulk deleting mapping relations"""
    ids: List[int] = Field(..., min_items=1, max_items=100)
    
    @validator('ids')
    def validate_unique_ids(cls, v):
        if len(v) != len(set(v)):
            raise ValueError("Gli ID devono essere unici")
        return v


class MappingImport(BaseModel):
    """Model for importing mapping relations"""
    file_type: str = Field(..., pattern="^(csv|xlsx|json)$")
    data: List[dict]
    overwrite_existing: bool = Field(default=False)
    
    @validator('data')
    def validate_import_data(cls, v):
        required_fields = ['garanzia_id', 'compagnia_id']
        for item in v:
            for field in required_fields:
                if field not in item:
                    raise ValueError(f"Campo obbligatorio mancante: {field}")
        return v


class MappingExport(BaseModel):
    """Model for exporting mapping relations"""
    format: str = Field(..., pattern="^(csv|xlsx|json|pdf)$")
    filters: Optional[MappingRelationFilter] = None
    include_full_text: bool = Field(default=False)
    include_confidence: bool = Field(default=True)
    include_timestamps: bool = Field(default=True)


class CompanyAnalysisComparison(BaseModel):
    """Model for comparing analysis results between companies"""
    garanzia_id: int
    garanzia_titolo: str
    companies_comparison: List[Dict[str, Any]]
    common_elements: List[str]
    differences: List[Dict[str, Any]]
    analysis_summary: str
    
    class Config:
        from_attributes = True


class AnalysisQualityMetrics(BaseModel):
    """Model for analysis quality metrics"""
    total_analyses: int
    high_confidence_count: int  # >= 0.8
    medium_confidence_count: int  # 0.5-0.8
    low_confidence_count: int  # < 0.5
    manual_verifications: int
    accuracy_rate: Optional[float]
    false_positives: int
    false_negatives: int
    avg_processing_time: float
    
    class Config:
        from_attributes = True
