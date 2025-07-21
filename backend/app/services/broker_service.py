"""
Broker service for managing broker data
"""

import logging
from typing import Dict, Any, Optional
from uuid import UUID
from supabase import Client
from app.config.database import get_supabase, get_supabase_service
from app.models.brokers import (
    BrokerCreate, BrokerUpdate, BrokerProfile, BrokerResponse, BrokerListResponse
)

logger = logging.getLogger(__name__)


class BrokerService:
    """Broker service for managing broker data"""
    
    def __init__(self):
        self.supabase: Client = get_supabase()
        self.supabase_service: Client = get_supabase_service()
    
    async def get_broker_by_id(self, broker_id: UUID) -> BrokerResponse:
        """Get broker by ID"""
        try:
            result = self.supabase.table("brokers").select("*").eq("id", str(broker_id)).execute()
            
            if result.data and len(result.data) > 0:
                broker_data = result.data[0]
                broker_profile = self._format_broker_profile(broker_data)
                
                return BrokerResponse(
                    success=True,
                    message="Broker trovato con successo",
                    broker=broker_profile
                )
            else:
                return BrokerResponse(
                    success=False,
                    message="Broker non trovato",
                    error="Broker non trovato"
                )
                
        except Exception as e:
            logger.error(f"❌ Error getting broker {broker_id}: {e}")
            return BrokerResponse(
                success=False,
                message="Errore nel recupero del broker",
                error=str(e)
            )
    
    async def get_broker_by_auth_id(self, auth_id: str) -> BrokerResponse:
        """Get broker by auth.users ID"""
        try:
            result = self.supabase.table("brokers").select("*").eq("id", auth_id).execute()
            
            if result.data and len(result.data) > 0:
                broker_data = result.data[0]
                broker_profile = self._format_broker_profile(broker_data)
                
                return BrokerResponse(
                    success=True,
                    message="Broker trovato con successo",
                    broker=broker_profile
                )
            else:
                return BrokerResponse(
                    success=False,
                    message="Broker non trovato",
                    error="Broker non trovato"
                )
                
        except Exception as e:
            logger.error(f"❌ Error getting broker by auth ID {auth_id}: {e}")
            return BrokerResponse(
                success=False,
                message="Errore nel recupero del broker",
                error=str(e)
            )
    
    async def create_broker(self, broker_data: BrokerCreate) -> BrokerResponse:
        """Create a new broker"""
        try:
            # Check if broker already exists
            existing = self.supabase.table("brokers").select("id").eq("id", str(broker_data.id)).execute()
            if existing.data and len(existing.data) > 0:
                return BrokerResponse(
                    success=False,
                    message="Broker già esistente",
                    error="Un broker con questo ID esiste già"
                )
            
            # Check if RUI number is unique
            if broker_data.rui_number:
                rui_check = self.supabase.table("brokers").select("id").eq("rui_number", broker_data.rui_number).execute()
                if rui_check.data and len(rui_check.data) > 0:
                    return BrokerResponse(
                        success=False,
                        message="Numero RUI già in uso",
                        error="Un broker con questo numero RUI esiste già"
                    )
            
            # Insert new broker
            result = self.supabase.table("brokers").insert({
                "id": str(broker_data.id),
                "first_name": broker_data.first_name,
                "last_name": broker_data.last_name,
                "rui_number": broker_data.rui_number,
                "role": broker_data.role,
                "is_active": broker_data.is_active
            }).execute()
            
            if result.data and len(result.data) > 0:
                broker_profile = self._format_broker_profile(result.data[0])
                
                logger.info(f"✅ Broker created successfully: {broker_data.first_name} {broker_data.last_name}")
                return BrokerResponse(
                    success=True,
                    message="Broker creato con successo",
                    broker=broker_profile
                )
            else:
                return BrokerResponse(
                    success=False,
                    message="Errore nella creazione del broker",
                    error="Nessun dato restituito dall'inserimento"
                )
                
        except Exception as e:
            logger.error(f"❌ Error creating broker: {e}")
            return BrokerResponse(
                success=False,
                message="Errore nella creazione del broker",
                error=str(e)
            )
    
    async def update_broker(self, broker_id: UUID, update_data: BrokerUpdate) -> BrokerResponse:
        """Update broker data"""
        try:
            # Check if broker exists
            existing = self.supabase.table("brokers").select("*").eq("id", str(broker_id)).execute()
            if not existing.data or len(existing.data) == 0:
                return BrokerResponse(
                    success=False,
                    message="Broker non trovato",
                    error="Broker non trovato"
                )
            
            # Check if RUI number is unique (if being updated)
            if update_data.rui_number:
                rui_check = self.supabase.table("brokers").select("id").eq("rui_number", update_data.rui_number).neq("id", str(broker_id)).execute()
                if rui_check.data and len(rui_check.data) > 0:
                    return BrokerResponse(
                        success=False,
                        message="Numero RUI già in uso",
                        error="Un altro broker con questo numero RUI esiste già"
                    )
            
            # Prepare update data (only include non-None values)
            update_dict = {}
            if update_data.first_name is not None:
                update_dict["first_name"] = update_data.first_name
            if update_data.last_name is not None:
                update_dict["last_name"] = update_data.last_name
            if update_data.rui_number is not None:
                update_dict["rui_number"] = update_data.rui_number
            if update_data.role is not None:
                update_dict["role"] = update_data.role
            if update_data.is_active is not None:
                update_dict["is_active"] = update_data.is_active
            
            if not update_dict:
                return BrokerResponse(
                    success=False,
                    message="Nessun dato da aggiornare",
                    error="Nessun campo valido fornito per l'aggiornamento"
                )
            
            # Update broker
            result = self.supabase.table("brokers").update(update_dict).eq("id", str(broker_id)).execute()
            
            if result.data and len(result.data) > 0:
                broker_profile = self._format_broker_profile(result.data[0])
                
                logger.info(f"✅ Broker updated successfully: {broker_id}")
                return BrokerResponse(
                    success=True,
                    message="Broker aggiornato con successo",
                    broker=broker_profile
                )
            else:
                return BrokerResponse(
                    success=False,
                    message="Errore nell'aggiornamento del broker",
                    error="Nessun dato restituito dall'aggiornamento"
                )
                
        except Exception as e:
            logger.error(f"❌ Error updating broker {broker_id}: {e}")
            return BrokerResponse(
                success=False,
                message="Errore nell'aggiornamento del broker",
                error=str(e)
            )
    
    async def get_all_brokers(self, limit: int = 100, offset: int = 0) -> BrokerListResponse:
        """Get all brokers with pagination"""
        try:
            result = self.supabase.table("brokers").select("*", count="exact").range(offset, offset + limit - 1).execute()
            
            brokers = []
            if result.data:
                for broker_data in result.data:
                    broker_profile = self._format_broker_profile(broker_data)
                    brokers.append(broker_profile)
            
            return BrokerListResponse(
                success=True,
                message=f"Trovati {len(brokers)} broker",
                brokers=brokers,
                total=result.count or 0
            )
                
        except Exception as e:
            logger.error(f"❌ Error getting all brokers: {e}")
            return BrokerListResponse(
                success=False,
                message="Errore nel recupero dei broker",
                error=str(e)
            )
    
    def _format_broker_profile(self, broker_data: Dict[str, Any]) -> BrokerProfile:
        """Format broker data into BrokerProfile"""
        return BrokerProfile(
            id=UUID(broker_data["id"]),
            first_name=broker_data["first_name"],
            last_name=broker_data["last_name"],
            rui_number=broker_data["rui_number"],
            role=broker_data["role"],
            is_active=broker_data["is_active"],
            full_name=f"{broker_data['first_name']} {broker_data['last_name']}"
        )


def get_broker_service() -> BrokerService:
    """Dependency to get broker service"""
    return BrokerService() 