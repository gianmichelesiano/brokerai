"""
Pydantic models for Garanzie (Insurance Guarantees)
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


# Import SezioneInfo from sezioni models
class SezioneInfoSimple(BaseModel):
    """Simplified model for sezione information in garanzie responses"""
    id: int
    nome: str
    descrizione: Optional[str] = None
    
    class Config:
        from_attributes = True


class GaranziaBase(BaseModel):
    """Base model for Garanzia"""
    sezione_id: int = Field(..., description="ID della sezione della garanzia")
    titolo: str = Field(..., min_length=1, max_length=255, description="Titolo della garanzia")
    descrizione: str = Field(..., min_length=1, description="Descrizione dettagliata della garanzia")
    tipologia: Optional[int] = Field(None, description="ID della tipologia assicurativa")
    
    @validator('titolo')
    def validate_titolo(cls, v):
        if v:
            v = v.strip()
        return v
    
    @validator('descrizione')
    def validate_descrizione(cls, v):
        if v:
            v = v.strip()
        return v


class GaranziaCreate(GaranziaBase):
    """Model for creating a new Garanzia"""
    pass


class GaranziaUpdate(BaseModel):
    """Model for updating an existing Garanzia"""
    sezione_id: Optional[int] = Field(None, description="ID della sezione della garanzia")
    titolo: Optional[str] = Field(None, min_length=1, max_length=255)
    descrizione: Optional[str] = Field(None, min_length=1)
    tipologia: Optional[int] = Field(None, description="ID della tipologia assicurativa")
    
    @validator('titolo')
    def validate_titolo(cls, v):
        if v:
            v = v.strip()
        return v
    
    @validator('descrizione')
    def validate_descrizione(cls, v):
        if v:
            v = v.strip()
        return v


class Garanzia(GaranziaBase):
    """Complete Garanzia model with database fields"""
    id: int
    created_at: datetime
    updated_at: datetime
    sezione_nome: Optional[str] = Field(None, description="Nome della sezione (from join)")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class GaranziaWithSezione(Garanzia):
    """Garanzia model with sezione information"""
    sezione: Optional[SezioneInfoSimple] = Field(None, description="Informazioni della sezione")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class GaranziaWithStats(Garanzia):
    """Garanzia model with additional statistics"""
    compagnie_count: int = Field(default=0, description="Numero di compagnie che coprono questa garanzia")
    coperture_trovate: int = Field(default=0, description="Numero di coperture trovate tramite AI")
    ultima_analisi: Optional[datetime] = Field(None, description="Data ultima analisi AI")
    confidence_media: Optional[float] = Field(None, description="Confidence media delle analisi AI")
    sezione: Optional[SezioneInfoSimple] = Field(None, description="Informazioni della sezione")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class GaranziaList(BaseModel):
    """Model for paginated list of Garanzie"""
    items: List[Garanzia]
    total: int
    page: int
    size: int
    pages: int
    
    class Config:
        from_attributes = True


class GaranziaListWithStats(BaseModel):
    """Model for paginated list of Garanzie with statistics"""
    items: List[GaranziaWithStats]
    total: int
    page: int
    size: int
    pages: int
    
    class Config:
        from_attributes = True


class GaranziaFilter(BaseModel):
    """Model for filtering Garanzie"""
    sezione: Optional[str] = Field(None, description="Filtra per sezione")
    search: Optional[str] = Field(None, description="Ricerca nel titolo e descrizione")
    tipologia_id: Optional[int] = Field(None, description="Filtra per tipologia assicurativa")
    page: int = Field(default=1, ge=1, description="Numero pagina")
    size: int = Field(default=20, ge=1, le=100, description="Dimensione pagina")
    sort_by: Optional[str] = Field(default="created_at", description="Campo per ordinamento")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$", description="Ordine di ordinamento")
    
    @validator('sezione')
    def validate_sezione(cls, v):
        if v:
            v = v.strip().upper()
        return v
    
    @validator('search')
    def validate_search(cls, v):
        if v:
            v = v.strip()
        return v


class SezioneInfo(BaseModel):
    """Model for section information"""
    sezione: str
    count: int
    descrizione: Optional[str] = None
    
    class Config:
        from_attributes = True


class GaranziaStats(BaseModel):
    """Model for Garanzia statistics"""
    total_garanzie: int
    sezioni_count: int
    sezioni: List[SezioneInfo]
    garanzie_con_coperture: int
    garanzie_senza_coperture: int
    ultima_creazione: Optional[datetime]
    ultima_modifica: Optional[datetime]
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class GaranziaBulkCreate(BaseModel):
    """Model for bulk creating Garanzie"""
    garanzie: List[GaranziaCreate] = Field(..., min_items=1, max_items=100)
    
    @validator('garanzie')
    def validate_unique_titles(cls, v):
        titles = [g.titolo for g in v]
        if len(titles) != len(set(titles)):
            raise ValueError("I titoli delle garanzie devono essere unici")
        return v


class GaranziaBulkUpdate(BaseModel):
    """Model for bulk updating Garanzie"""
    updates: List[dict] = Field(..., min_items=1, max_items=100)
    
    @validator('updates')
    def validate_updates(cls, v):
        for update in v:
            if 'id' not in update:
                raise ValueError("Ogni aggiornamento deve contenere un ID")
        return v


class GaranziaBulkDelete(BaseModel):
    """Model for bulk deleting Garanzie"""
    ids: List[int] = Field(..., min_items=1, max_items=100)
    
    @validator('ids')
    def validate_unique_ids(cls, v):
        if len(v) != len(set(v)):
            raise ValueError("Gli ID devono essere unici")
        return v


class GaranziaImport(BaseModel):
    """Model for importing Garanzie from file"""
    file_type: str = Field(..., pattern="^(csv|xlsx|json)$")
    data: List[dict]
    overwrite_existing: bool = Field(default=False)
    
    @validator('data')
    def validate_import_data(cls, v):
        required_fields = ['sezione', 'titolo', 'descrizione']
        for item in v:
            for field in required_fields:
                if field not in item:
                    raise ValueError(f"Campo obbligatorio mancante: {field}")
        return v


class GaranziaExport(BaseModel):
    """Model for exporting Garanzie"""
    format: str = Field(..., pattern="^(csv|xlsx|json|pdf)$")
    filters: Optional[GaranziaFilter] = None
    include_stats: bool = Field(default=False)
    include_coperture: bool = Field(default=False)


class TipologiaInfo(BaseModel):
    """Model for tipologia information"""
    id: int
    nome: str
    descrizione: Optional[str] = None
    
    class Config:
        from_attributes = True


class GaranzieByTipologiaResponse(BaseModel):
    """Model for garanzie by tipologia response"""
    tipologia: TipologiaInfo
    garanzie: GaranziaList
    
    class Config:
        from_attributes = True


# Models for AI generation
class GeneraGaranzieRequest(BaseModel):
    """Model for generating guarantees request"""
    custom_requirements: Optional[str] = Field(None, description="Optional custom requirements for generation")
    save_duplicates: bool = Field(default=False, description="Whether to save duplicate guarantees")
    
    class Config:
        from_attributes = True


class GeneratedGuaranteeItem(BaseModel):
    """Model for a generated guarantee item"""
    name: str = Field(..., description="Name of the guarantee")
    description: str = Field(..., description="Detailed description of the guarantee")
    section: str = Field(..., description="Section category of the guarantee")
    is_duplicate: bool = Field(default=False, description="Whether this guarantee is a duplicate")
    is_new: bool = Field(default=True, description="Whether this is a new guarantee")
    
    class Config:
        from_attributes = True


class GeneraGaranzieResponse(BaseModel):
    """Model for generating guarantees response"""
    tipologia_assicurazione_id: int = Field(..., description="ID of the insurance type")
    insurance_type: str = Field(..., description="Name of the insurance type")
    field_description: str = Field(..., description="Field of application description")
    summary: str = Field(..., description="Summary of the analysis")
    total_generated: int = Field(..., description="Total number of guarantees generated")
    new_guarantees: int = Field(..., description="Number of new guarantees")
    duplicate_guarantees: int = Field(..., description="Number of duplicate guarantees")
    saved_to_database: int = Field(..., description="Number of guarantees saved to database")
    generated_guarantees: List[GeneratedGuaranteeItem] = Field(default_factory=list, description="List of generated guarantees")
    saved_guarantees: List[dict] = Field(default_factory=list, description="List of saved guarantee records")
    existing_guarantees_found: List[str] = Field(default_factory=list, description="Existing guarantees found")
    new_guarantees_added: List[str] = Field(default_factory=list, description="New guarantees added")
    
    class Config:
        from_attributes = True
