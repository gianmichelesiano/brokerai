"""
Pydantic models for Tipologia Assicurazione (Insurance Types)
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class TipologiaAssicurazioneBase(BaseModel):
    """Base model for Tipologia Assicurazione"""
    nome: str = Field(..., min_length=1, max_length=255, description="Nome della tipologia assicurativa")
    descrizione: Optional[str] = Field(None, max_length=1000, description="Descrizione della tipologia")
    
    @validator('nome')
    def validate_nome(cls, v):
        if v:
            v = v.strip()
        return v
    
    @validator('descrizione')
    def validate_descrizione(cls, v):
        if v:
            v = v.strip()
        return v


class TipologiaAssicurazioneCreate(TipologiaAssicurazioneBase):
    """Model for creating a new Tipologia Assicurazione"""
    pass


class TipologiaAssicurazioneUpdate(BaseModel):
    """Model for updating an existing Tipologia Assicurazione"""
    nome: Optional[str] = Field(None, min_length=1, max_length=255)
    descrizione: Optional[str] = Field(None, max_length=1000)
    
    @validator('nome')
    def validate_nome(cls, v):
        if v:
            v = v.strip()
        return v
    
    @validator('descrizione')
    def validate_descrizione(cls, v):
        if v:
            v = v.strip()
        return v


class TipologiaAssicurazione(TipologiaAssicurazioneBase):
    """Complete Tipologia Assicurazione model with database fields"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TipologiaAssicurazioneList(BaseModel):
    """Model for paginated list of Tipologie Assicurazione"""
    items: List[TipologiaAssicurazione]
    total: int
    page: int
    size: int
    pages: int
    
    class Config:
        from_attributes = True


class TipologiaAssicurazioneFilter(BaseModel):
    """Model for filtering Tipologie Assicurazione"""
    search: Optional[str] = Field(None, description="Ricerca nel nome o descrizione")
    page: int = Field(default=1, ge=1, description="Numero pagina")
    size: int = Field(default=20, ge=1, le=100, description="Dimensione pagina")
    sort_by: Optional[str] = Field(default="created_at", description="Campo per ordinamento")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$", description="Ordine di ordinamento")
    
    @validator('search')
    def validate_search(cls, v):
        if v:
            v = v.strip()
        return v


class TipologiaAssicurazioneStats(BaseModel):
    """Model for Tipologia Assicurazione statistics"""
    total_tipologie: int
    tipologie_con_descrizione: int
    tipologie_senza_descrizione: int
    ultima_creazione: Optional[datetime]
    ultima_modifica: Optional[datetime]
    nomi_piu_lunghi: List[Dict[str, Any]] = Field(default_factory=list)
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class TipologiaAssicurazioneBulkCreate(BaseModel):
    """Model for bulk creating Tipologie Assicurazione"""
    tipologie: List[TipologiaAssicurazioneCreate] = Field(..., min_items=1, max_items=50)
    
    @validator('tipologie')
    def validate_unique_names(cls, v):
        names = [t.nome for t in v]
        if len(names) != len(set(names)):
            raise ValueError("I nomi delle tipologie devono essere unici")
        return v


class TipologiaAssicurazioneBulkUpdate(BaseModel):
    """Model for bulk updating Tipologie Assicurazione"""
    updates: List[dict] = Field(..., min_items=1, max_items=50)
    
    @validator('updates')
    def validate_updates(cls, v):
        for update in v:
            if 'id' not in update:
                raise ValueError("Ogni aggiornamento deve contenere un ID")
        return v


class TipologiaAssicurazioneBulkDelete(BaseModel):
    """Model for bulk deleting Tipologie Assicurazione"""
    ids: List[int] = Field(..., min_items=1, max_items=50)
    
    @validator('ids')
    def validate_unique_ids(cls, v):
        if len(v) != len(set(v)):
            raise ValueError("Gli ID devono essere unici")
        return v


class TipologiaAssicurazioneSearch(BaseModel):
    """Model for full-text search in tipologie assicurazione"""
    query: str = Field(..., min_length=1, description="Query di ricerca")
    highlight: bool = Field(default=True, description="Evidenzia i risultati")
    max_results: int = Field(default=10, ge=1, le=100, description="Numero massimo di risultati")
    
    @validator('query')
    def validate_query(cls, v):
        if v:
            v = v.strip()
        return v


class TipologiaAssicurazioneSearchResult(BaseModel):
    """Model for search result"""
    tipologia_id: int
    tipologia_nome: str
    matches: List[Dict[str, Any]]
    total_matches: int
    relevance_score: float
    
    class Config:
        from_attributes = True


class TipologiaAssicurazioneSearchResponse(BaseModel):
    """Model for search response"""
    query: str
    results: List[TipologiaAssicurazioneSearchResult]
    total_results: int
    search_time: float
    
    class Config:
        from_attributes = True


class TipologiaAssicurazioneImport(BaseModel):
    """Model for importing Tipologie Assicurazione from file"""
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


class TipologiaAssicurazioneExport(BaseModel):
    """Model for exporting Tipologie Assicurazione"""
    format: str = Field(..., pattern="^(csv|xlsx|json|pdf)$")
    filters: Optional[TipologiaAssicurazioneFilter] = None
    include_stats: bool = Field(default=False)
    include_timestamps: bool = Field(default=True)


class TipologiaAssicurazioneValidation(BaseModel):
    """Model for validation result"""
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    
    class Config:
        from_attributes = True
