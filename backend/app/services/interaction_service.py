"""
Interaction service for managing client interactions
"""

import logging
from typing import Dict, Any, Optional
from uuid import UUID
from supabase import Client
from app.config.database import get_supabase, get_supabase_service
from app.models.interactions import (
    InteractionCreate, InteractionUpdate, Interaction, 
    InteractionResponse, InteractionListResponse, InteractionType
)

logger = logging.getLogger(__name__)


class InteractionService:
    """Interaction service for managing client interactions"""
    
    def __init__(self):
        self.supabase: Client = get_supabase()
        self.supabase_service: Client = get_supabase_service()
    
    async def create_interaction(
        self, 
        client_id: UUID, 
        broker_id: UUID, 
        interaction_data: InteractionCreate
    ) -> InteractionResponse:
        """Create a new interaction for a client"""
        try:
            # Verify that the client exists and belongs to the broker
            client_result = self.supabase.table("clients").select("id").eq("id", str(client_id)).eq("broker_id", str(broker_id)).execute()
            
            if not client_result.data or len(client_result.data) == 0:
                return InteractionResponse(
                    success=False,
                    message="Cliente non trovato o non autorizzato",
                    error="Client not found or not authorized"
                )
            
            # Create the interaction
            interaction_insert_data = {
                "client_id": str(client_id),
                "broker_id": str(broker_id),
                "interaction_type": interaction_data.interaction_type.value,
                "subject": interaction_data.subject,
                "details": interaction_data.details
            }
            
            result = self.supabase_service.table("interactions").insert(interaction_insert_data).execute()
            
            if not result.data or len(result.data) == 0:
                return InteractionResponse(
                    success=False,
                    message="Errore nella creazione dell'interazione",
                    error="Failed to create interaction"
                )
            
            # Get the created interaction
            created_interaction = await self.get_interaction_by_id(UUID(result.data[0]["id"]))
            
            if created_interaction.success:
                logger.info(f"✅ Interaction created successfully: {interaction_data.interaction_type.value}")
                return InteractionResponse(
                    success=True,
                    message="Interazione creata con successo",
                    interaction=created_interaction.interaction
                )
            else:
                return InteractionResponse(
                    success=False,
                    message="Interazione creata ma errore nel recupero dei dati",
                    error=created_interaction.error
                )
                
        except Exception as e:
            logger.error(f"❌ Error creating interaction: {e}")
            return InteractionResponse(
                success=False,
                message="Errore nella creazione dell'interazione",
                error=str(e)
            )
    
    async def get_interactions_by_client(
        self, 
        client_id: UUID, 
        broker_id: UUID, 
        limit: int = 100, 
        offset: int = 0
    ) -> InteractionListResponse:
        """Get all interactions for a specific client"""
        try:
            # Verify that the client exists and belongs to the broker
            client_result = self.supabase.table("clients").select("id").eq("id", str(client_id)).eq("broker_id", str(broker_id)).execute()
            
            if not client_result.data or len(client_result.data) == 0:
                return InteractionListResponse(
                    success=False,
                    message="Cliente non trovato o non autorizzato",
                    error="Client not found or not authorized"
                )
            
            # Get interactions ordered by timestamp (most recent first)
            result = self.supabase.table("interactions").select("*").eq("client_id", str(client_id)).order("timestamp", desc=True).range(offset, offset + limit - 1).execute()
            
            interactions = []
            if result.data:
                for interaction_data in result.data:
                    interaction = self._format_interaction(interaction_data)
                    interactions.append(interaction)
            
            # Get total count
            count_result = self.supabase.table("interactions").select("*", count="exact").eq("client_id", str(client_id)).execute()
            total = count_result.count or 0
            
            return InteractionListResponse(
                success=True,
                message=f"Trovate {len(interactions)} interazioni",
                interactions=interactions,
                total=total
            )
                
        except Exception as e:
            logger.error(f"❌ Error getting interactions for client {client_id}: {e}")
            return InteractionListResponse(
                success=False,
                message="Errore nel recupero delle interazioni",
                error=str(e)
            )
    
    async def get_interaction_by_id(self, interaction_id: UUID) -> InteractionResponse:
        """Get interaction by ID"""
        try:
            result = self.supabase.table("interactions").select("*").eq("id", str(interaction_id)).execute()
            
            if result.data and len(result.data) > 0:
                interaction_data = result.data[0]
                interaction = self._format_interaction(interaction_data)
                
                return InteractionResponse(
                    success=True,
                    message="Interazione trovata con successo",
                    interaction=interaction
                )
            else:
                return InteractionResponse(
                    success=False,
                    message="Interazione non trovata",
                    error="Interaction not found"
                )
                
        except Exception as e:
            logger.error(f"❌ Error getting interaction {interaction_id}: {e}")
            return InteractionResponse(
                success=False,
                message="Errore nel recupero dell'interazione",
                error=str(e)
            )
    
    async def update_interaction(
        self, 
        interaction_id: UUID, 
        broker_id: UUID, 
        update_data: InteractionUpdate
    ) -> InteractionResponse:
        """Update an interaction"""
        try:
            # Verify that the interaction exists and belongs to the broker
            existing_result = self.supabase.table("interactions").select("id").eq("id", str(interaction_id)).eq("broker_id", str(broker_id)).execute()
            
            if not existing_result.data or len(existing_result.data) == 0:
                return InteractionResponse(
                    success=False,
                    message="Interazione non trovata o non autorizzata",
                    error="Interaction not found or not authorized"
                )
            
            # Prepare update data
            update_dict = {}
            if update_data.interaction_type is not None:
                update_dict["interaction_type"] = update_data.interaction_type.value
            if update_data.subject is not None:
                update_dict["subject"] = update_data.subject
            if update_data.details is not None:
                update_dict["details"] = update_data.details
            
            if not update_dict:
                return InteractionResponse(
                    success=False,
                    message="Nessun dato da aggiornare",
                    error="No data to update"
                )
            
            # Update the interaction
            result = self.supabase_service.table("interactions").update(update_dict).eq("id", str(interaction_id)).execute()
            
            if not result.data or len(result.data) == 0:
                return InteractionResponse(
                    success=False,
                    message="Errore nell'aggiornamento dell'interazione",
                    error="Failed to update interaction"
                )
            
            # Get the updated interaction
            updated_interaction = await self.get_interaction_by_id(interaction_id)
            
            if updated_interaction.success:
                logger.info(f"✅ Interaction updated successfully: {interaction_id}")
                return InteractionResponse(
                    success=True,
                    message="Interazione aggiornata con successo",
                    interaction=updated_interaction.interaction
                )
            else:
                return InteractionResponse(
                    success=False,
                    message="Interazione aggiornata ma errore nel recupero dei dati",
                    error=updated_interaction.error
                )
                
        except Exception as e:
            logger.error(f"❌ Error updating interaction {interaction_id}: {e}")
            return InteractionResponse(
                success=False,
                message="Errore nell'aggiornamento dell'interazione",
                error=str(e)
            )
    
    async def delete_interaction(self, interaction_id: UUID, broker_id: UUID) -> InteractionResponse:
        """Delete an interaction"""
        try:
            # Verify that the interaction exists and belongs to the broker
            existing_result = self.supabase.table("interactions").select("id").eq("id", str(interaction_id)).eq("broker_id", str(broker_id)).execute()
            
            if not existing_result.data or len(existing_result.data) == 0:
                return InteractionResponse(
                    success=False,
                    message="Interazione non trovata o non autorizzata",
                    error="Interaction not found or not authorized"
                )
            
            # Delete the interaction
            result = self.supabase_service.table("interactions").delete().eq("id", str(interaction_id)).execute()
            
            if result.data and len(result.data) > 0:
                logger.info(f"✅ Interaction deleted successfully: {interaction_id}")
                return InteractionResponse(
                    success=True,
                    message="Interazione eliminata con successo"
                )
            else:
                return InteractionResponse(
                    success=False,
                    message="Errore nell'eliminazione dell'interazione",
                    error="Failed to delete interaction"
                )
                
        except Exception as e:
            logger.error(f"❌ Error deleting interaction {interaction_id}: {e}")
            return InteractionResponse(
                success=False,
                message="Errore nell'eliminazione dell'interazione",
                error=str(e)
            )
    
    def _format_interaction(self, interaction_data: Dict[str, Any]) -> Interaction:
        """Format interaction data from database to Pydantic model"""
        return Interaction(
            id=UUID(interaction_data["id"]),
            client_id=UUID(interaction_data["client_id"]),
            broker_id=UUID(interaction_data["broker_id"]),
            interaction_type=InteractionType(interaction_data["interaction_type"]),
            timestamp=interaction_data["timestamp"],
            subject=interaction_data.get("subject"),
            details=interaction_data.get("details")
        )


def get_interaction_service() -> InteractionService:
    """Get interaction service instance"""
    return InteractionService() 