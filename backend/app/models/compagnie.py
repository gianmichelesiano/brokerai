"""
Pydantic models for Compagnie (Insurance Companies)
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class CompagniaBase(BaseModel):
    """Base model for Compagnia"""
    nome: str = Field(..., min_length=1, max_length=255, description="Nome della compagnia assicurativa")
    
    @validator('nome')
    def validate_nome(cls, v):
        if v:
            v = v.strip()
        return v


class CompagniaCreate(CompagniaBase):
    """Model for creating a new Compagnia"""
    pass


class CompagniaUpdate(BaseModel):
    """Model for updating an existing Compagnia"""
    nome: Optional[str] = Field(None, min_length=1, max_length=255)
    
    @validator('nome')
    def validate_nome(cls, v):
        if v:
            v = v.strip()
        return v


class Compagnia(CompagniaBase):
    """Complete Compagnia model with database fields"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class CompagniaWithStats(Compagnia):
    """Compagnia model with additional statistics"""
    garanzie_analizzate: int = Field(default=0, description="Numero di garanzie analizzate")
    garanzie_trovate: int = Field(default=0, description="Numero di garanzie trovate")
    garanzie_non_trovate: int = Field(default=0, description="Numero di garanzie non trovate")
    confidence_media: Optional[float] = Field(None, description="Confidence media delle analisi")
    ultima_analisi: Optional[datetime] = Field(None, description="Data ultima analisi AI")
    confronti_count: int = Field(default=0, description="Numero di confronti effettuati")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class CompagniaList(BaseModel):
    """Model for paginated list of Compagnie"""
    items: List[Compagnia]
    total: int
    page: int
    size: int
    pages: int
    
    class Config:
        from_attributes = True


class CompagniaListWithStats(BaseModel):
    """Model for paginated list of Compagnie with statistics"""
    items: List[CompagniaWithStats]
    total: int
    page: int
    size: int
    pages: int
    
    class Config:
        from_attributes = True


class CompagniaFilter(BaseModel):
    """Model for filtering Compagnie"""
    search: Optional[str] = Field(None, description="Ricerca nel nome")
    has_file: Optional[bool] = Field(None, description="Filtra per presenza file")
    has_text: Optional[bool] = Field(None, description="Filtra per presenza testo estratto")
    file_type: Optional[str] = Field(None, description="Filtra per tipo file")
    page: int = Field(default=1, ge=1, description="Numero pagina")
    size: int = Field(default=20, ge=1, le=100, description="Dimensione pagina")
    sort_by: Optional[str] = Field(default="created_at", description="Campo per ordinamento")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$", description="Ordine di ordinamento")
    
    @validator('search')
    def validate_search(cls, v):
        if v:
            v = v.strip()
        return v


class FileUploadResponse(BaseModel):
    """Model for file upload response"""
    success: bool
    filename: str
    file_path: str
    file_size: int
    file_type: str
    text_extracted: bool
    text_length: int
    message: str
    errors: Optional[List[str]] = None
    
    class Config:
        from_attributes = True


class FileValidationResult(BaseModel):
    """Model for file validation result"""
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    file_size: int
    file_extension: str
    text_extractable: bool
    text_preview: Optional[str] = None
    estimated_pages: Optional[int] = None
    
    class Config:
        from_attributes = True


class TextExtractionResult(BaseModel):
    """Model for text extraction result"""
    success: bool
    text: Optional[str] = None
    text_length: int = 0
    pages_processed: Optional[int] = None
    extraction_time: Optional[float] = None
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None
    
    class Config:
        from_attributes = True


class CompagniaStats(BaseModel):
    """Model for Compagnia statistics"""
    total_compagnie: int
    compagnie_con_file: int
    compagnie_senza_file: int
    compagnie_con_testo: int
    compagnie_senza_testo: int
    file_types: Dict[str, int]
    total_file_size: int
    average_text_length: Optional[float]
    ultima_creazione: Optional[datetime]
    ultima_modifica: Optional[datetime]
    ultima_analisi: Optional[datetime]
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class CompagniaBulkCreate(BaseModel):
    """Model for bulk creating Compagnie"""
    compagnie: List[CompagniaCreate] = Field(..., min_items=1, max_items=50)
    
    @validator('compagnie')
    def validate_unique_names(cls, v):
        names = [c.nome for c in v]
        if len(names) != len(set(names)):
            raise ValueError("I nomi delle compagnie devono essere unici")
        return v


class CompagniaBulkUpdate(BaseModel):
    """Model for bulk updating Compagnie"""
    updates: List[dict] = Field(..., min_items=1, max_items=50)
    
    @validator('updates')
    def validate_updates(cls, v):
        for update in v:
            if 'id' not in update:
                raise ValueError("Ogni aggiornamento deve contenere un ID")
        return v


class CompagniaBulkDelete(BaseModel):
    """Model for bulk deleting Compagnie"""
    ids: List[int] = Field(..., min_items=1, max_items=50)
    delete_files: bool = Field(default=False, description="Elimina anche i file associati")
    
    @validator('ids')
    def validate_unique_ids(cls, v):
        if len(v) != len(set(v)):
            raise ValueError("Gli ID devono essere unici")
        return v


class CompagniaSearch(BaseModel):
    """Model for full-text search in company policies"""
    query: str = Field(..., min_length=1, description="Query di ricerca")
    compagnia_ids: Optional[List[int]] = Field(None, description="IDs delle compagnie da includere")
    highlight: bool = Field(default=True, description="Evidenzia i risultati")
    max_results: int = Field(default=10, ge=1, le=100, description="Numero massimo di risultati")
    
    @validator('query')
    def validate_query(cls, v):
        if v:
            v = v.strip()
        return v


class CompagniaSearchResult(BaseModel):
    """Model for search result"""
    compagnia_id: int
    compagnia_nome: str
    matches: List[Dict[str, Any]]
    total_matches: int
    relevance_score: float
    
    class Config:
        from_attributes = True


class CompagniaSearchResponse(BaseModel):
    """Model for search response"""
    query: str
    results: List[CompagniaSearchResult]
    total_results: int
    search_time: float
    
    class Config:
        from_attributes = True


class CompagniaImport(BaseModel):
    """Model for importing Compagnie from file"""
    file_type: str = Field(..., pattern="^(csv|xlsx|json)$")
    data: List[dict]
    overwrite_existing: bool = Field(default=False)
    
    @validator('data')
    def validate_import_data(cls, v):
        required_fields = ['nome']
        for item in v:
            for field in required_fields:
                if field not in item:
                    raise ValueError(f"Campo obbligatorio mancante: {field}")
        return v


class CompagniaExport(BaseModel):
    """Model for exporting Compagnie"""
    format: str = Field(..., pattern="^(csv|xlsx|json|pdf)$")
    filters: Optional[CompagniaFilter] = None
    include_stats: bool = Field(default=False)
    include_text: bool = Field(default=False)
    include_file_info: bool = Field(default=True)


class FileUploadProgress(BaseModel):
    """Model for file upload progress"""
    task_id: str
    status: str = Field(..., pattern="^(pending|processing|completed|failed)$")
    progress: float = Field(ge=0.0, le=100.0)
    message: str
    result: Optional[FileUploadResponse] = None
    error: Optional[str] = None
    
    class Config:
        from_attributes = True


class CompagniaAnalysisRequest(BaseModel):
    """Model for requesting AI analysis of a company"""
    compagnia_id: int
    garanzie_ids: Optional[List[int]] = Field(None, description="IDs specifiche garanzie da analizzare")
    force_reanalysis: bool = Field(default=False, description="Forza ri-analisi anche se già presente")
    save_results: bool = Field(default=True, description="Salva i risultati nel database")
    
    @validator('garanzie_ids')
    def validate_garanzie_ids(cls, v):
        if v and len(v) != len(set(v)):
            raise ValueError("Gli ID delle garanzie devono essere unici")
        return v


class CompagniaAnalysisProgress(BaseModel):
    """Model for analysis progress"""
    task_id: str
    compagnia_id: int
    compagnia_nome: str
    status: str = Field(..., pattern="^(pending|processing|completed|failed)$")
    progress: float = Field(ge=0.0, le=100.0)
    current_garanzia: Optional[str] = None
    processed: int = 0
    total: int = 0
    found: int = 0
    not_found: int = 0
    errors: int = 0
    start_time: datetime
    estimated_completion: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AnalizzaPolizzaRequest(BaseModel):
    """Model for analizza polizza request"""
    compagnia_id: int = Field(..., description="ID della compagnia assicurativa")
    garanzia_id: int = Field(..., description="ID della garanzia da analizzare")


class AnalizzaPolizzaResponse(BaseModel):
    """Model for analizza polizza response - versione semplificata"""
    analisi_ai_polizza_id: Optional[int] = Field(None, description="ID del record nella tabella analisi_ai_polizze")
    ai_titolo: Optional[str] = Field(None, description="Titolo estratto dall'AI")
    ai_testo_estratto: Optional[str] = Field(None, description="Testo estratto dall'AI")
    ai_riferimenti_articoli: Optional[str] = Field(None, description="Riferimenti articoli trovati dall'AI")
    ai_processed: bool = Field(False, description="Indica se l'AI ha processato il documento")
    ai_available: bool = Field(False, description="Indica se il servizio AI è disponibile")
    
    class Config:
        from_attributes = True


class AnalisiUpdateRequest(BaseModel):
    """Model for updating AI analysis text"""
    ai_testo_estratto: str = Field(..., description="Nuovo testo estratto AI modificato dall'utente")
    
    @validator('ai_testo_estratto')
    def validate_ai_testo_estratto(cls, v):
        if v is not None:
            v = v.strip()
        return v


class AnalisiUpdateResponse(BaseModel):
    """Model for AI analysis update response"""
    success: bool = Field(..., description="Indica se l'aggiornamento è avvenuto con successo")
    message: str = Field(..., description="Messaggio di conferma")
    ai_testo_estratto: str = Field(..., description="Testo estratto aggiornato")
    updated_at: datetime = Field(..., description="Timestamp dell'aggiornamento")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
