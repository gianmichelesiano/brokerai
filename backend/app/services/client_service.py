"""
Client service for managing client data
"""

import logging
from typing import Dict, Any, Optional
from uuid import UUID
from supabase import Client
from app.config.database import get_supabase, get_supabase_service
from app.models.clients import (
    ClientCreate, ClientUpdate, Client, ClientResponse, ClientListResponse,
    IndividualProfileCreate, IndividualProfileUpdate, IndividualProfile,
    CompanyProfileCreate, CompanyProfileUpdate, CompanyProfile,
    ClientType, ClientCreateFlat
)

logger = logging.getLogger(__name__)


class ClientService:
    """Client service for managing client data"""
    
    def __init__(self):
        self.supabase: Client = get_supabase()
        self.supabase_service: Client = get_supabase_service()
    
    async def create_client_flat(self, client_data: ClientCreateFlat, broker_id: UUID) -> ClientResponse:
        """Create a new client from flat format (frontend compatible)"""
        try:
            # Convert flat format to structured format
            if client_data.tipo in ['privato', 'individual']:
                # Create individual client
                structured_data = ClientCreate(
                    client_type=ClientType.INDIVIDUAL,
                    is_active=True,
                    notes=None,
                    individual_profile=IndividualProfileCreate(
                        first_name=client_data.nome,
                        last_name=client_data.cognome,
                        fiscal_code=client_data.codice_fiscale,
                        phone=client_data.telefono,
                        email=client_data.email,
                        address=client_data.indirizzo,
                        city=client_data.citta,
                        postal_code=client_data.cap,
                        province=client_data.provincia
                    )
                )
            else:
                # Create company client
                structured_data = ClientCreate(
                    client_type=ClientType.COMPANY,
                    is_active=True,
                    notes=None,
                    company_profile=CompanyProfileCreate(
                        company_name=client_data.ragione_sociale,
                        vat_number=client_data.partita_iva,
                        fiscal_code=client_data.codice_fiscale,
                        legal_address=client_data.indirizzo,
                        city=client_data.citta,
                        postal_code=client_data.cap,
                        province=client_data.provincia,
                        phone=client_data.telefono,
                        email=client_data.email
                    )
                )
            
            # Use the existing create_client method
            return await self.create_client(structured_data, broker_id)
            
        except Exception as e:
            logger.error(f"❌ Error creating client from flat format: {e}")
            return ClientResponse(
                success=False,
                message="Errore nella creazione del cliente",
                error=str(e)
            )

    async def create_client(self, client_data: ClientCreate, broker_id: UUID) -> ClientResponse:
        """Create a new client with profile in a transactional manner"""
        try:
            # Start transaction using service client for better control
            client = self.supabase_service
            
            # Step 1: Create the client record first (without profile)
            client_insert_data = {
                "broker_id": str(broker_id),
                "client_type": client_data.client_type.value,
                "is_active": client_data.is_active,
                "notes": client_data.notes
            }
            
            client_result = client.table("clients").insert(client_insert_data).execute()
            
            if not client_result.data or len(client_result.data) == 0:
                return ClientResponse(
                    success=False,
                    message="Errore nella creazione del cliente",
                    error="Failed to create client record"
                )
            
            client_id = client_result.data[0]["id"]
            
            # Step 2: Create the appropriate profile with client_id
            if client_data.client_type == ClientType.INDIVIDUAL:
                if not client_data.individual_profile:
                    return ClientResponse(
                        success=False,
                        message="Profilo individuale richiesto per clienti individuali",
                        error="Individual profile is required for individual clients"
                    )
                
                # Create individual profile with client_id
                profile_result = client.table("individual_profiles").insert({
                    "client_id": client_id,
                    "first_name": client_data.individual_profile.first_name,
                    "last_name": client_data.individual_profile.last_name,
                    "date_of_birth": client_data.individual_profile.birth_date.isoformat() if client_data.individual_profile.birth_date else None,
                    "fiscal_code": client_data.individual_profile.fiscal_code,
                    "phone": client_data.individual_profile.phone,
                    "email": client_data.individual_profile.email,
                    "address": client_data.individual_profile.address,
                    "city": client_data.individual_profile.city,
                    "postal_code": client_data.individual_profile.postal_code,
                    "province": client_data.individual_profile.province
                }).execute()
                
                if not profile_result.data or len(profile_result.data) == 0:
                    # Rollback client creation
                    client.table("clients").delete().eq("id", client_id).execute()
                    return ClientResponse(
                        success=False,
                        message="Errore nella creazione del profilo individuale",
                        error="Failed to create individual profile"
                    )
                
                # Update client with profile_id
                client.table("clients").update({
                    "individual_profile_id": profile_result.data[0]["client_id"]
                }).eq("id", client_id).execute()
                
            elif client_data.client_type == ClientType.COMPANY:
                if not client_data.company_profile:
                    return ClientResponse(
                        success=False,
                        message="Profilo aziendale richiesto per clienti aziendali",
                        error="Company profile is required for company clients"
                    )
                
                # Create company profile with client_id
                profile_result = client.table("company_profiles").insert({
                    "client_id": client_id,
                    "company_name": client_data.company_profile.company_name,
                    "vat_number": client_data.company_profile.vat_number,
                    "fiscal_code": client_data.company_profile.fiscal_code,
                    "legal_address": client_data.company_profile.legal_address,
                    "city": client_data.company_profile.city,
                    "postal_code": client_data.company_profile.postal_code,
                    "province": client_data.company_profile.province,
                    "phone": client_data.company_profile.phone,
                    "email": client_data.company_profile.email,
                    "contact_person": client_data.company_profile.contact_person,
                    "contact_phone": client_data.company_profile.contact_phone,
                    "contact_email": client_data.company_profile.contact_email
                }).execute()
                
                if not profile_result.data or len(profile_result.data) == 0:
                    # Rollback client creation
                    client.table("clients").delete().eq("id", client_id).execute()
                    return ClientResponse(
                        success=False,
                        message="Errore nella creazione del profilo aziendale",
                        error="Failed to create company profile"
                    )
                
                # Update client with profile_id
                client.table("clients").update({
                    "company_profile_id": profile_result.data[0]["client_id"]
                }).eq("id", client_id).execute()
            
            # Step 3: Get the complete client data with profile
            created_client = await self.get_client_by_id(UUID(client_id))
            
            if created_client.success:
                logger.info(f"✅ Client created successfully: {client_data.client_type.value}")
                return ClientResponse(
                    success=True,
                    message="Cliente creato con successo",
                    client=created_client.client
                )
            else:
                return ClientResponse(
                    success=False,
                    message="Cliente creato ma errore nel recupero dei dati",
                    error=created_client.error
                )
                
        except Exception as e:
            logger.error(f"❌ Error creating client: {e}")
            return ClientResponse(
                success=False,
                message="Errore nella creazione del cliente",
                error=str(e)
            )
    
    async def get_client_by_id(self, client_id: UUID) -> ClientResponse:
        """Get client by ID with profile data"""
        try:
            # First try to use the view
            try:
                result = self.supabase.table("client_details").select("*").eq("id", str(client_id)).execute()
                
                if result.data and len(result.data) > 0:
                    client_data = result.data[0]
                    client = self._format_client_from_view(client_data)
                    
                    return ClientResponse(
                        success=True,
                        message="Cliente trovato con successo",
                        client=client
                    )
                else:
                    return ClientResponse(
                        success=False,
                        message="Cliente non trovato",
                        error="Client not found"
                    )
                    
            except Exception as view_error:
                # If view doesn't exist, fallback to manual join
                logger.warning(f"View client_details not available, using fallback: {view_error}")
                
                # Get client data
                client_result = self.supabase.table("clients").select("*").eq("id", str(client_id)).execute()
                
                if not client_result.data or len(client_result.data) == 0:
                    return ClientResponse(
                        success=False,
                        message="Cliente non trovato",
                        error="Client not found"
                    )
                
                client_data = client_result.data[0]
                
                # Get profile data based on client type
                if client_data["client_type"] == "individual" and client_data.get("individual_profile_id"):
                    profile_result = self.supabase.table("individual_profiles").select("*").eq("client_id", client_data["individual_profile_id"]).execute()
                    if profile_result.data:
                        client_data.update(profile_result.data[0])
                        client_data["individual_profile_id"] = client_data["individual_profile_id"]
                
                elif client_data["client_type"] == "company" and client_data.get("company_profile_id"):
                    profile_result = self.supabase.table("company_profiles").select("*").eq("client_id", client_data["company_profile_id"]).execute()
                    if profile_result.data:
                        client_data.update(profile_result.data[0])
                        client_data["company_profile_id"] = client_data["company_profile_id"]
                
                client = self._format_client_from_view(client_data)
                
                return ClientResponse(
                    success=True,
                    message="Cliente trovato con successo",
                    client=client
                )
                
        except Exception as e:
            logger.error(f"❌ Error getting client {client_id}: {e}")
            return ClientResponse(
                success=False,
                message="Errore nel recupero del cliente",
                error=str(e)
            )
    
    async def get_clients_by_broker(self, broker_id: UUID, limit: int = 100, offset: int = 0) -> ClientListResponse:
        """Get all clients for a specific broker"""
        try:
            # First try to use the view
            try:
                result = self.supabase.table("client_details").select("*").eq("broker_id", str(broker_id)).range(offset, offset + limit - 1).execute()
                
                clients = []
                if result.data:
                    for client_data in result.data:
                        client = self._format_client_from_view(client_data)
                        clients.append(client)
                
                # Get total count
                count_result = self.supabase.table("clients").select("*", count="exact").eq("broker_id", str(broker_id)).execute()
                total = count_result.count or 0
                
                return ClientListResponse(
                    success=True,
                    message=f"Trovati {len(clients)} clienti",
                    clients=clients,
                    total=total
                )
                
            except Exception as view_error:
                # If view doesn't exist, fallback to manual join
                logger.warning(f"View client_details not available, using fallback: {view_error}")
                
                # Get clients data
                clients_result = self.supabase.table("clients").select("*").eq("broker_id", str(broker_id)).range(offset, offset + limit - 1).execute()
                
                clients = []
                if clients_result.data:
                    for client_data in clients_result.data:
                        # Get profile data based on client type
                        if client_data["client_type"] == "individual" and client_data.get("individual_profile_id"):
                            profile_result = self.supabase.table("individual_profiles").select("*").eq("client_id", client_data["individual_profile_id"]).execute()
                            if profile_result.data:
                                client_data.update(profile_result.data[0])
                                client_data["individual_profile_id"] = client_data["individual_profile_id"]
                        
                        elif client_data["client_type"] == "company" and client_data.get("company_profile_id"):
                            profile_result = self.supabase.table("company_profiles").select("*").eq("client_id", client_data["company_profile_id"]).execute()
                            if profile_result.data:
                                client_data.update(profile_result.data[0])
                                client_data["company_profile_id"] = client_data["company_profile_id"]
                        
                        client = self._format_client_from_view(client_data)
                        clients.append(client)
                
                # Get total count
                count_result = self.supabase.table("clients").select("*", count="exact").eq("broker_id", str(broker_id)).execute()
                total = count_result.count or 0
                
                return ClientListResponse(
                    success=True,
                    message=f"Trovati {len(clients)} clienti",
                    clients=clients,
                    total=total
                )
                
        except Exception as e:
            logger.error(f"❌ Error getting clients for broker {broker_id}: {e}")
            return ClientListResponse(
                success=False,
                message="Errore nel recupero dei clienti",
                error=str(e)
            )
    
    async def update_client(self, client_id: UUID, update_data: ClientUpdate) -> ClientResponse:
        """Update client data and profile"""
        try:
            client = self.supabase_service
            
            # Get current client data
            current_client = await self.get_client_by_id(client_id)
            if not current_client.success:
                return current_client
            
            # Update client record
            client_update_data = {}
            if update_data.is_active is not None:
                client_update_data["is_active"] = update_data.is_active
            if update_data.notes is not None:
                client_update_data["notes"] = update_data.notes
            
            if client_update_data:
                client_result = client.table("clients").update(client_update_data).eq("id", str(client_id)).execute()
                if not client_result.data or len(client_result.data) == 0:
                    return ClientResponse(
                        success=False,
                        message="Errore nell'aggiornamento del cliente",
                        error="Failed to update client record"
                    )
            
            # Update profile if provided
            if current_client.client.client_type == ClientType.INDIVIDUAL and update_data.individual_profile:
                profile_update_data = {}
                profile = update_data.individual_profile
                
                if profile.first_name is not None:
                    profile_update_data["first_name"] = profile.first_name
                if profile.last_name is not None:
                    profile_update_data["last_name"] = profile.last_name
                if profile.birth_date is not None:
                    profile_update_data["date_of_birth"] = profile.birth_date.isoformat()
                if profile.fiscal_code is not None:
                    profile_update_data["fiscal_code"] = profile.fiscal_code
                if profile.phone is not None:
                    profile_update_data["phone"] = profile.phone
                if profile.email is not None:
                    profile_update_data["email"] = profile.email
                if profile.address is not None:
                    profile_update_data["address"] = profile.address
                if profile.city is not None:
                    profile_update_data["city"] = profile.city
                if profile.postal_code is not None:
                    profile_update_data["postal_code"] = profile.postal_code
                if profile.province is not None:
                    profile_update_data["province"] = profile.province
                
                if profile_update_data:
                    profile_result = client.table("individual_profiles").update(profile_update_data).eq("client_id", str(current_client.client.individual_profile.id)).execute()
                    if not profile_result.data or len(profile_result.data) == 0:
                        return ClientResponse(
                            success=False,
                            message="Errore nell'aggiornamento del profilo individuale",
                            error="Failed to update individual profile"
                        )
            
            elif current_client.client.client_type == ClientType.COMPANY and update_data.company_profile:
                profile_update_data = {}
                profile = update_data.company_profile
                
                if profile.company_name is not None:
                    profile_update_data["company_name"] = profile.company_name
                if profile.vat_number is not None:
                    profile_update_data["vat_number"] = profile.vat_number
                if profile.fiscal_code is not None:
                    profile_update_data["fiscal_code"] = profile.fiscal_code
                if profile.legal_address is not None:
                    profile_update_data["legal_address"] = profile.legal_address
                if profile.city is not None:
                    profile_update_data["city"] = profile.city
                if profile.postal_code is not None:
                    profile_update_data["postal_code"] = profile.postal_code
                if profile.province is not None:
                    profile_update_data["province"] = profile.province
                if profile.phone is not None:
                    profile_update_data["phone"] = profile.phone
                if profile.email is not None:
                    profile_update_data["email"] = profile.email
                if profile.contact_person is not None:
                    profile_update_data["contact_person"] = profile.contact_person
                if profile.contact_phone is not None:
                    profile_update_data["contact_phone"] = profile.contact_phone
                if profile.contact_email is not None:
                    profile_update_data["contact_email"] = profile.contact_email
                
                if profile_update_data:
                    profile_result = client.table("company_profiles").update(profile_update_data).eq("client_id", str(current_client.client.company_profile.id)).execute()
                    if not profile_result.data or len(profile_result.data) == 0:
                        return ClientResponse(
                            success=False,
                            message="Errore nell'aggiornamento del profilo aziendale",
                            error="Failed to update company profile"
                        )
            
            # Get updated client data
            updated_client = await self.get_client_by_id(client_id)
            
            if updated_client.success:
                logger.info(f"✅ Client updated successfully: {client_id}")
                return ClientResponse(
                    success=True,
                    message="Cliente aggiornato con successo",
                    client=updated_client.client
                )
            else:
                return ClientResponse(
                    success=False,
                    message="Errore nel recupero del cliente aggiornato",
                    error=updated_client.error
                )
                
        except Exception as e:
            logger.error(f"❌ Error updating client {client_id}: {e}")
            return ClientResponse(
                success=False,
                message="Errore nell'aggiornamento del cliente",
                error=str(e)
            )
    
    async def delete_client(self, client_id: UUID) -> ClientResponse:
        """Delete client and associated profile"""
        try:
            # Get client data first to know which profile to delete
            current_client = await self.get_client_by_id(client_id)
            if not current_client.success:
                return current_client
            
            client = self.supabase_service
            
            # Delete client record (this will cascade delete the profile due to foreign key)
            result = client.table("clients").delete().eq("id", str(client_id)).execute()
            
            if result.data and len(result.data) > 0:
                logger.info(f"✅ Client deleted successfully: {client_id}")
                return ClientResponse(
                    success=True,
                    message="Cliente eliminato con successo"
                )
            else:
                return ClientResponse(
                    success=False,
                    message="Errore nell'eliminazione del cliente",
                    error="Failed to delete client"
                )
                
        except Exception as e:
            logger.error(f"❌ Error deleting client {client_id}: {e}")
            return ClientResponse(
                success=False,
                message="Errore nell'eliminazione del cliente",
                error=str(e)
            )
    
    def _format_client_from_view(self, client_data: Dict[str, Any]) -> Client:
        """Format client data from the client_details view"""
        from datetime import datetime
        
        # Parse dates
        created_at = datetime.fromisoformat(client_data["created_at"].replace('Z', '+00:00')) if client_data["created_at"] else None
        updated_at = datetime.fromisoformat(client_data["updated_at"].replace('Z', '+00:00')) if client_data["updated_at"] else None
        
        # Create individual profile if exists
        individual_profile = None
        if client_data.get("individual_profile_id"):
            individual_profile = IndividualProfile(
                id=UUID(client_data["individual_profile_id"]),
                first_name=client_data["first_name"],
                last_name=client_data["last_name"],
                birth_date=datetime.fromisoformat(client_data["date_of_birth"].replace('Z', '+00:00')) if client_data.get("date_of_birth") else None,
                fiscal_code=client_data["fiscal_code"],
                phone=client_data["phone"],
                email=client_data["email"],
                address=client_data["address"],
                city=client_data["city"],
                postal_code=client_data["postal_code"],
                province=client_data["province"],
                created_at=created_at,
                updated_at=updated_at
            )
        
        # Create company profile if exists
        company_profile = None
        if client_data.get("company_profile_id"):
            company_profile = CompanyProfile(
                id=UUID(client_data["company_profile_id"]),
                company_name=client_data["company_name"],
                vat_number=client_data["vat_number"],
                fiscal_code=client_data["fiscal_code"],
                legal_address=client_data["legal_address"],
                city=client_data["city"],
                postal_code=client_data["postal_code"],
                province=client_data["province"],
                phone=client_data["phone"],
                email=client_data["email"],
                contact_person=client_data["contact_person"],
                contact_phone=client_data["contact_phone"],
                contact_email=client_data["contact_email"],
                created_at=created_at,
                updated_at=updated_at
            )
        
        return Client(
            id=UUID(client_data["id"]),
            broker_id=UUID(client_data["broker_id"]),
            client_type=ClientType(client_data["client_type"]),
            is_active=client_data["is_active"],
            notes=client_data["notes"],
            created_at=created_at,
            updated_at=updated_at,
            individual_profile=individual_profile,
            company_profile=company_profile
        )


def get_client_service() -> ClientService:
    """Dependency to get client service"""
    return ClientService()
