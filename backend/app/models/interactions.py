"""
Interaction models for the application
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator
from uuid import UUID
from enum import Enum


class InteractionType(str, Enum):
    """Interaction type enumeration"""
    EMAIL = "EMAIL"
    CALL = "CALL"
    MEETING = "MEETING"
    NOTE = "NOTE"


class InteractionBase(BaseModel):
    """Base interaction model"""
    interaction_type: InteractionType = Field(..., description="Type of interaction")
    subject: Optional[str] = Field(None, description="Subject/title of the interaction")
    details: Optional[str] = Field(None, description="Details/body of the interaction")


class InteractionCreate(InteractionBase):
    """Interaction creation model"""
    interaction_type: InteractionType = Field(..., description="Type of interaction")
    subject: Optional[str] = Field(None, description="Subject/title of the interaction")
    details: Optional[str] = Field(None, description="Details/body of the interaction")
    
    @validator('subject')
    def validate_subject(cls, v, values):
        if values.get('interaction_type') in [InteractionType.EMAIL, InteractionType.MEETING] and not v:
            raise ValueError('Subject is required for EMAIL and MEETING interactions')
        return v
    
    @validator('details')
    def validate_details(cls, v, values):
        if values.get('interaction_type') == InteractionType.NOTE and not v:
            raise ValueError('Details are required for NOTE interactions')
        return v


class InteractionUpdate(BaseModel):
    """Interaction update model"""
    interaction_type: Optional[InteractionType] = Field(None, description="Type of interaction")
    subject: Optional[str] = Field(None, description="Subject/title of the interaction")
    details: Optional[str] = Field(None, description="Details/body of the interaction")


class Interaction(BaseModel):
    """Interaction model for API responses"""
    id: UUID
    client_id: UUID
    broker_id: UUID
    interaction_type: InteractionType
    timestamp: datetime
    subject: Optional[str]
    details: Optional[str]
    
    class Config:
        from_attributes = True


class InteractionResponse(BaseModel):
    """Interaction response model"""
    success: bool
    message: str
    interaction: Optional[Interaction] = None
    error: Optional[str] = None


class InteractionListResponse(BaseModel):
    """Interaction list response model"""
    success: bool
    message: str
    interactions: list[Interaction] = []
    total: int = 0 