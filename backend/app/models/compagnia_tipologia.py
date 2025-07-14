"""
Pydantic models for Compagnia-Tipologia Assicurazione relationship
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class CompagniaTipologiaBase(BaseModel):
    """Base model for Compagnia-Tipologia relationship"""
    compagnia_id: int = Field(..., description="ID della compagnia")
    tipologia_assicurazione_id: int = Field(..., description="ID della tipologia assicurazione")
    polizza_filename: Optional[str] = Field(None, max_length=255, description="Nome del file polizza")
    polizza_path: Optional[str] = Field(None, max_length=500, description="Percorso del file polizza")
    polizza_text: Optional[str] = Field(None, description="Testo estratto dalla polizza")
    attiva: bool = Field(default=True, description="Indica se la relazione è attiva")


class CompagniaTipologiaCreate(CompagniaTipologiaBase):
    """Model for creating a new Compagnia-Tipologia relationship"""
    pass


class CompagniaTipologiaUpdate(BaseModel):
    """Model for updating an existing Compagnia-Tipologia relationship"""
    polizza_filename: Optional[str] = Field(None, max_length=255)
    polizza_path: Optional[str] = Field(None, max_length=500)
    polizza_text: Optional[str] = None
    attiva: Optional[bool] = None


class CompagniaTipologia(CompagniaTipologiaBase):
    """Complete Compagnia-Tipologia model with database fields"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class CompagniaTipologiaWithDetails(CompagniaTipologia):
    """Compagnia-Tipologia model with company and insurance type details"""
    compagnia_nome: str = Field(..., description="Nome della compagnia")
    tipologia_nome: str = Field(..., description="Nome della tipologia")
    tipologia_descrizione: Optional[str] = Field(None, description="Descrizione della tipologia")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class CompagniaTipologiaList(BaseModel):
    """Model for paginated list of Compagnia-Tipologia relationships"""
    items: List[CompagniaTipologiaWithDetails]
    total: int
    page: int
    size: int
    pages: int
    
    class Config:
        from_attributes = True


class CompagniaTipologiaFilter(BaseModel):
    """Model for filtering Compagnia-Tipologia relationships"""
    compagnia_id: Optional[int] = Field(None, description="Filtra per ID compagnia")
    tipologia_assicurazione_id: Optional[int] = Field(None, description="Filtra per ID tipologia")
    attiva: Optional[bool] = Field(None, description="Filtra per stato attivo")
    has_file: Optional[bool] = Field(None, description="Filtra per presenza file")
    has_text: Optional[bool] = Field(None, description="Filtra per presenza testo")
    search: Optional[str] = Field(None, description="Ricerca nel testo della polizza")
    page: int = Field(default=1, ge=1, description="Numero pagina")
    size: int = Field(default=20, ge=1, le=100, description="Dimensione pagina")
    sort_by: Optional[str] = Field(default="created_at", description="Campo per ordinamento")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$", description="Ordine di ordinamento")


class FileUploadToCompagniaTipologia(BaseModel):
    """Model for file upload to Compagnia-Tipologia relationship"""
    compagnia_id: int
    tipologia_assicurazione_id: int
    file_data: bytes = Field(..., description="Dati del file")
    filename: str = Field(..., description="Nome del file")
    content_type: str = Field(..., description="Tipo di contenuto")


class FileUploadResponse(BaseModel):
    """Model for file upload response"""
    success: bool
    compagnia_tipologia_id: int
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


class CompagniaTipologiaSearch(BaseModel):
    """Model for full-text search in policies"""
    query: str = Field(..., min_length=1, description="Query di ricerca")
    compagnia_ids: Optional[List[int]] = Field(None, description="IDs delle compagnie da includere")
    tipologia_ids: Optional[List[int]] = Field(None, description="IDs delle tipologie da includere")
    attiva_only: bool = Field(default=True, description="Cerca solo nelle relazioni attive")
    highlight: bool = Field(default=True, description="Evidenzia i risultati")
    max_results: int = Field(default=10, ge=1, le=100, description="Numero massimo di risultati")
    
    @validator('query')
    def validate_query(cls, v):
        if v:
            v = v.strip()
        return v


class CompagniaTipologiaSearchResult(BaseModel):
    """Model for search result"""
    compagnia_tipologia_id: int
    compagnia_id: int
    compagnia_nome: str
    tipologia_id: int
    tipologia_nome: str
    polizza_filename: Optional[str]
    matches: List[dict]
    total_matches: int
    relevance_score: float
    
    class Config:
        from_attributes = True


class CompagniaTipologiaSearchResponse(BaseModel):
    """Model for search response"""
    query: str
    results: List[CompagniaTipologiaSearchResult]
    total_results: int
    search_time: float
    
    class Config:
        from_attributes = True


class CompagniaTipologiaStats(BaseModel):
    """Model for Compagnia-Tipologia statistics"""
    total_relazioni: int
    relazioni_attive: int
    relazioni_inattive: int
    relazioni_con_file: int
    relazioni_senza_file: int
    relazioni_con_testo: int
    relazioni_senza_testo: int
    compagnie_coinvolte: int
    tipologie_coinvolte: int
    file_types: dict
    total_file_size: int
    average_text_length: Optional[float]
    ultima_creazione: Optional[datetime]
    ultima_modifica: Optional[datetime]
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class CompagniaTipologiaBulkCreate(BaseModel):
    """Model for bulk creating Compagnia-Tipologia relationships"""
    relazioni: List[CompagniaTipologiaCreate] = Field(..., min_items=1, max_items=50)
    
    @validator('relazioni')
    def validate_unique_relations(cls, v):
        seen = set()
        for rel in v:
            key = (rel.compagnia_id, rel.tipologia_assicurazione_id)
            if key in seen:
                raise ValueError("Le relazioni compagnia-tipologia devono essere uniche")
            seen.add(key)
        return v


class CompagniaTipologiaBulkUpdate(BaseModel):
    """Model for bulk updating Compagnia-Tipologia relationships"""
    updates: List[dict] = Field(..., min_items=1, max_items=50)
    
    @validator('updates')
    def validate_updates(cls, v):
        for update in v:
            if 'id' not in update:
                raise ValueError("Ogni aggiornamento deve contenere un ID")
        return v


class CompagniaTipologiaBulkDelete(BaseModel):
    """Model for bulk deleting Compagnia-Tipologia relationships"""
    ids: List[int] = Field(..., min_items=1, max_items=50)
    delete_files: bool = Field(default=False, description="Elimina anche i file associati")
    
    @validator('ids')
    def validate_unique_ids(cls, v):
        if len(v) != len(set(v)):
            raise ValueError("Gli ID devono essere unici")
        return v


class TextExtractionResult(BaseModel):
    """Model for text extraction result"""
    success: bool
    compagnia_tipologia_id: int
    text: Optional[str] = None
    text_length: int = 0
    pages_processed: Optional[int] = None
    extraction_time: Optional[float] = None
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None
    
    class Config:
        from_attributes = True
