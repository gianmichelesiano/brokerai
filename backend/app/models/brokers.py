"""
Broker models for the application
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator
from uuid import UUID


class BrokerBase(BaseModel):
    """Base broker model"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    rui_number: Optional[str] = None
    role: str = Field(default="BROKER", description="Role can be ADMIN, BROKER, or ASSISTANT")
    is_active: bool = Field(default=True, description="Whether the broker account is active")


class BrokerCreate(BaseModel):
    """Broker creation model"""
    id: UUID = Field(..., description="User ID (same as auth.users.id)")
    first_name: str = Field(..., min_length=1, description="First name of the broker")
    last_name: str = Field(..., min_length=1, description="Last name of the broker")
    rui_number: str = Field(..., min_length=1, description="RUI number (Registro Unico degli Intermediari)")
    role: str = Field(default="BROKER", description="Role can be ADMIN, BROKER, or ASSISTANT")
    is_active: bool = Field(default=True, description="Whether the broker account is active")
    
    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['ADMIN', 'BROKER', 'ASSISTANT']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {allowed_roles}')
        return v


class BrokerUpdate(BaseModel):
    """Broker update model"""
    first_name: Optional[str] = Field(None, description="First name of the broker")
    last_name: Optional[str] = Field(None, description="Last name of the broker")
    rui_number: Optional[str] = Field(None, description="RUI number (Registro Unico degli Intermediari)")
    role: Optional[str] = Field(None, description="Role can be ADMIN, BROKER, or ASSISTANT")
    is_active: Optional[bool] = Field(None, description="Whether the broker account is active")


class BrokerInDB(BrokerBase):
    """Broker model as stored in database"""
    id: UUID
    first_name: str
    last_name: str
    rui_number: str
    role: str
    is_active: bool


class Broker(BrokerInDB):
    """Broker model for API responses"""
    pass


class BrokerProfile(BaseModel):
    """Broker profile model for API responses"""
    id: UUID
    first_name: str
    last_name: str
    rui_number: str
    role: str
    is_active: bool
    full_name: str = Field(description="Combined first and last name")


class BrokerResponse(BaseModel):
    """Broker response model"""
    success: bool
    message: str
    broker: Optional[BrokerProfile] = None
    error: Optional[str] = None


class BrokerListResponse(BaseModel):
    """Broker list response model"""
    success: bool
    message: str
    brokers: list[BrokerProfile] = []
    total: int = 0
    error: Optional[str] = None 