"""
Pydantic models for Sezioni (Insurance Sections)
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class SezioneBase(BaseModel):
    """Base model for Sezione"""
    nome: str = Field(..., min_length=1, max_length=100, description="Nome della sezione")
    descrizione: Optional[str] = Field(None, description="Descrizione della sezione")
    
    @validator('nome')
    def validate_nome(cls, v):
        if v:
            v = v.strip().upper()
        return v
    
    @validator('descrizione')
    def validate_descrizione(cls, v):
        if v:
            v = v.strip()
        return v


class SezioneCreate(SezioneBase):
    """Model for creating a new Sezione"""
    pass


class SezioneUpdate(BaseModel):
    """Model for updating an existing Sezione"""
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    descrizione: Optional[str] = Field(None)
    
    @validator('nome')
    def validate_nome(cls, v):
        if v:
            v = v.strip().upper()
        return v
    
    @validator('descrizione')
    def validate_descrizione(cls, v):
        if v:
            v = v.strip()
        return v


class Sezione(SezioneBase):
    """Complete Sezione model with database fields"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SezioneWithStats(Sezione):
    """Sezione model with additional statistics"""
    garanzie_count: int = Field(default=0, description="Numero di garanzie in questa sezione")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SezioneList(BaseModel):
    """Model for paginated list of Sezioni"""
    items: List[Sezione]
    total: int
    page: int
    size: int
    pages: int
    
    class Config:
        from_attributes = True


class SezioneListWithStats(BaseModel):
    """Model for paginated list of Sezioni with statistics"""
    items: List[SezioneWithStats]
    total: int
    page: int
    size: int
    pages: int
    
    class Config:
        from_attributes = True


class SezioneFilter(BaseModel):
    """Model for filtering Sezioni"""
    search: Optional[str] = Field(None, description="Ricerca nel nome e descrizione")
    page: int = Field(default=1, ge=1, description="Numero pagina")
    size: int = Field(default=20, ge=1, le=100, description="Dimensione pagina")
    sort_by: Optional[str] = Field(default="nome", description="Campo per ordinamento")
    sort_order: Optional[str] = Field(default="asc", pattern="^(asc|desc)$", description="Ordine di ordinamento")
    
    @validator('search')
    def validate_search(cls, v):
        if v:
            v = v.strip()
        return v


class SezioneStats(BaseModel):
    """Model for Sezione statistics"""
    total_sezioni: int
    sezioni_con_garanzie: int
    sezioni_senza_garanzie: int
    media_garanzie_per_sezione: float
    sezione_piu_popolata: Optional[str]
    ultima_creazione: Optional[datetime]
    ultima_modifica: Optional[datetime]
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class SezioneBulkCreate(BaseModel):
    """Model for bulk creating Sezioni"""
    sezioni: List[SezioneCreate] = Field(..., min_items=1, max_items=50)
    
    @validator('sezioni')
    def validate_unique_names(cls, v):
        names = [s.nome for s in v]
        if len(names) != len(set(names)):
            raise ValueError("I nomi delle sezioni devono essere unici")
        return v


class SezioneBulkUpdate(BaseModel):
    """Model for bulk updating Sezioni"""
    updates: List[dict] = Field(..., min_items=1, max_items=50)
    
    @validator('updates')
    def validate_updates(cls, v):
        for update in v:
            if 'id' not in update:
                raise ValueError("Ogni aggiornamento deve contenere un ID")
        return v


class SezioneBulkDelete(BaseModel):
    """Model for bulk deleting Sezioni"""
    ids: List[int] = Field(..., min_items=1, max_items=50)
    
    @validator('ids')
    def validate_unique_ids(cls, v):
        if len(v) != len(set(v)):
            raise ValueError("Gli ID devono essere unici")
        return v


class SezioneImport(BaseModel):
    """Model for importing Sezioni from file"""
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


class SezioneExport(BaseModel):
    """Model for exporting Sezioni"""
    format: str = Field(..., pattern="^(csv|xlsx|json|pdf)$")
    filters: Optional[SezioneFilter] = None
    include_stats: bool = Field(default=False)
    include_garanzie_count: bool = Field(default=True)


# Compatibility models for garanzie responses
class SezioneInfo(BaseModel):
    """Simplified model for sezione information in garanzie responses"""
    id: int
    nome: str
    descrizione: Optional[str] = None
    
    class Config:
        from_attributes = True
