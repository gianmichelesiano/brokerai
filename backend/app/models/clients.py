"""
Client models for the application
"""

from typing import Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from uuid import UUID
from enum import Enum


class ClientType(str, Enum):
    """Client type enumeration"""
    INDIVIDUAL = "individual"
    COMPANY = "company"


class IndividualProfileBase(BaseModel):
    """Base individual profile model"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[datetime] = None
    fiscal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    province: Optional[str] = None


class IndividualProfileCreate(IndividualProfileBase):
    """Individual profile creation model"""
    first_name: str = Field(..., min_length=1, description="First name of the individual")
    last_name: str = Field(..., min_length=1, description="Last name of the individual")
    birth_date: Optional[datetime] = Field(None, description="Birth date of the individual")
    fiscal_code: str = Field(..., min_length=16, max_length=16, description="Italian fiscal code")
    phone: Optional[str] = Field(None, description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    address: Optional[str] = Field(None, description="Address")
    city: Optional[str] = Field(None, description="City")
    postal_code: Optional[str] = Field(None, description="Postal code")
    province: Optional[str] = Field(None, description="Province")


class IndividualProfileUpdate(BaseModel):
    """Individual profile update model"""
    first_name: Optional[str] = Field(None, description="First name of the individual")
    last_name: Optional[str] = Field(None, description="Last name of the individual")
    birth_date: Optional[datetime] = Field(None, description="Birth date of the individual")
    fiscal_code: Optional[str] = Field(None, min_length=16, max_length=16, description="Italian fiscal code")
    phone: Optional[str] = Field(None, description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    address: Optional[str] = Field(None, description="Address")
    city: Optional[str] = Field(None, description="City")
    postal_code: Optional[str] = Field(None, description="Postal code")
    province: Optional[str] = Field(None, description="Province")


class CompanyProfileBase(BaseModel):
    """Base company profile model"""
    company_name: Optional[str] = None
    vat_number: Optional[str] = None
    fiscal_code: Optional[str] = None
    legal_address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    province: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None


class CompanyProfileCreate(CompanyProfileBase):
    """Company profile creation model"""
    company_name: str = Field(..., min_length=1, description="Company name")
    vat_number: str = Field(..., min_length=11, max_length=20, description="VAT number")
    fiscal_code: Optional[str] = Field(None, min_length=16, max_length=16, description="Italian fiscal code")
    legal_address: str = Field(..., min_length=1, description="Legal address")
    city: str = Field(..., min_length=1, description="City")
    postal_code: str = Field(..., min_length=1, description="Postal code")
    province: str = Field(..., min_length=2, max_length=2, description="Province (2 letters)")
    phone: Optional[str] = Field(None, description="Company phone number")
    email: Optional[str] = Field(None, description="Company email address")
    contact_person: Optional[str] = Field(None, description="Contact person name")
    contact_phone: Optional[str] = Field(None, description="Contact person phone")
    contact_email: Optional[str] = Field(None, description="Contact person email")


class CompanyProfileUpdate(BaseModel):
    """Company profile update model"""
    company_name: Optional[str] = Field(None, description="Company name")
    vat_number: Optional[str] = Field(None, min_length=11, max_length=20, description="VAT number")
    fiscal_code: Optional[str] = Field(None, min_length=16, max_length=16, description="Italian fiscal code")
    legal_address: Optional[str] = Field(None, description="Legal address")
    city: Optional[str] = Field(None, description="City")
    postal_code: Optional[str] = Field(None, description="Postal code")
    province: Optional[str] = Field(None, min_length=2, max_length=2, description="Province (2 letters)")
    phone: Optional[str] = Field(None, description="Company phone number")
    email: Optional[str] = Field(None, description="Company email address")
    contact_person: Optional[str] = Field(None, description="Contact person name")
    contact_phone: Optional[str] = Field(None, description="Contact person phone")
    contact_email: Optional[str] = Field(None, description="Contact person email")


class ClientCreateFlat(BaseModel):
    """
    Flat client creation model - Compatible with frontend format
    
    Accepts the format:
    {
      "tipo": "privato",
      "nome": "yxcyxc",
      "cognome": "yxcyx",
      "ragione_sociale": "",
      "email": "capo@dass.it",
      "telefono": "+39 22456781",
      "indirizzo": "via roma 33",
      "citta": "Milano",
      "provincia": "MI",
      "cap": "20100",
      "partita_iva": "",
      "codice_fiscale": "SNIGMC75E01I438K"
    }
    """
    tipo: str = Field(..., description="Type: 'privato' or 'azienda'")
    nome: Optional[str] = Field(None, description="First name (for individuals)")
    cognome: Optional[str] = Field(None, description="Last name (for individuals)")
    ragione_sociale: Optional[str] = Field(None, description="Company name (for companies)")
    email: Optional[str] = Field(None, description="Email address")
    telefono: Optional[str] = Field(None, description="Phone number")
    indirizzo: Optional[str] = Field(None, description="Address")
    citta: Optional[str] = Field(None, description="City")
    provincia: Optional[str] = Field(None, description="Province")
    cap: Optional[str] = Field(None, description="Postal code")
    partita_iva: Optional[str] = Field(None, description="VAT number (for companies)")
    codice_fiscale: Optional[str] = Field(None, description="Fiscal code")
    
    @validator('tipo')
    def validate_tipo(cls, v):
        valid_types = ['privato', 'azienda', 'individual', 'company']
        if v.lower() not in valid_types:
            raise ValueError(f'Tipo must be one of: {valid_types}')
        return v.lower()
    
    @validator('codice_fiscale')
    def validate_fiscal_code(cls, v):
        if v and len(v) != 16:
            raise ValueError('Codice fiscale must be exactly 16 characters')
        return v
    
    @validator('partita_iva')
    def validate_vat_number(cls, v, values):
        if values.get('tipo') in ['azienda', 'company'] and not v:
            raise ValueError('Partita IVA is required for companies')
        return v
    
    @validator('nome', 'cognome')
    def validate_individual_fields(cls, v, values):
        if values.get('tipo') in ['privato', 'individual']:
            if not v:
                raise ValueError('Nome and cognome are required for individuals')
        return v
    
    @validator('ragione_sociale')
    def validate_company_fields(cls, v, values):
        if values.get('tipo') in ['azienda', 'company'] and not v:
            raise ValueError('Ragione sociale is required for companies')
        return v


class ClientBase(BaseModel):
    """Base client model"""
    broker_id: Optional[UUID] = None
    client_type: ClientType
    is_active: bool = Field(default=True, description="Whether the client is active")
    notes: Optional[str] = Field(None, description="Additional notes about the client")


class ClientCreate(BaseModel):
    """Client creation model"""
    client_type: ClientType = Field(..., description="Type of client (individual or company)")
    is_active: bool = Field(default=True, description="Whether the client is active")
    notes: Optional[str] = Field(None, description="Additional notes about the client")
    
    # Profile data based on client type
    individual_profile: Optional[IndividualProfileCreate] = Field(None, description="Individual profile data")
    company_profile: Optional[CompanyProfileCreate] = Field(None, description="Company profile data")
    
    @validator('individual_profile')
    def validate_individual_profile(cls, v, values):
        if values.get('client_type') == ClientType.INDIVIDUAL and not v:
            raise ValueError('Individual profile is required for individual clients')
        if values.get('client_type') == ClientType.COMPANY and v:
            raise ValueError('Individual profile should not be provided for company clients')
        return v
    
    @validator('company_profile')
    def validate_company_profile(cls, v, values):
        if values.get('client_type') == ClientType.COMPANY and not v:
            raise ValueError('Company profile is required for company clients')
        if values.get('client_type') == ClientType.INDIVIDUAL and v:
            raise ValueError('Company profile should not be provided for individual clients')
        return v


class ClientUpdate(BaseModel):
    """Client update model"""
    is_active: Optional[bool] = Field(None, description="Whether the client is active")
    notes: Optional[str] = Field(None, description="Additional notes about the client")
    individual_profile: Optional[IndividualProfileUpdate] = Field(None, description="Individual profile update data")
    company_profile: Optional[CompanyProfileUpdate] = Field(None, description="Company profile update data")


class IndividualProfile(IndividualProfileBase):
    """Individual profile model for API responses"""
    id: UUID
    first_name: str
    last_name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @property
    def full_name(self) -> str:
        """Get full name"""
        return f"{self.first_name} {self.last_name}"


class CompanyProfile(CompanyProfileBase):
    """Company profile model for API responses"""
    id: UUID
    company_name: str
    vat_number: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class Client(BaseModel):
    """Client model for API responses"""
    id: UUID
    broker_id: UUID
    client_type: ClientType
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None
    individual_profile: Optional[IndividualProfile] = None
    company_profile: Optional[CompanyProfile] = None


class ClientResponse(BaseModel):
    """Client response model"""
    success: bool
    message: str
    client: Optional[Client] = None
    error: Optional[str] = None


class ClientListResponse(BaseModel):
    """Client list response model"""
    success: bool
    message: str
    clients: list[Client] = []
    total: int = 0
    error: Optional[str] = None
