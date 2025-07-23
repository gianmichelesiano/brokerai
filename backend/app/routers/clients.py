"""
Client routes for managing client data
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from fastapi.responses import JSONResponse
from app.services.client_service import get_client_service, ClientService
from app.services.auth_service import get_auth_service, AuthService
from app.models.clients import ClientCreate, ClientUpdate, ClientResponse, ClientListResponse, ClientCreateFlat
from app.dependencies.auth import (
    get_current_user_context, get_user_company_filter, add_company_id_to_data
)
from app.models.companies import UserContext

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/clients", tags=["Clients"])


async def get_current_broker_id(
    authorization: str = Header(None),
    auth_service: AuthService = Depends(get_auth_service)
) -> str:
    """
    Dependency to get current broker ID from JWT token
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Token di accesso mancante"
        )
    
    access_token = authorization.split(" ")[1]
    result = await auth_service.get_current_user(access_token)
    
    if not result["success"]:
        raise HTTPException(
            status_code=401,
            detail=result["error"]
        )
    
    # Extract user ID from the user data
    user_data = result["user"]
    if not user_data or "id" not in user_data:
        raise HTTPException(
            status_code=401,
            detail="Dati utente non validi"
        )
    
    return user_data["id"]


@router.post("/")
async def create_client(
    client_data: ClientCreate,
    user_context: UserContext = Depends(get_current_user_context),
    client_service: ClientService = Depends(get_client_service)
) -> Dict[str, Any]:
    """
    Create a new client (protected endpoint) - Structured format
    
    This endpoint creates a new client with the appropriate profile (individual or company)
    in a transactional manner. The client_type field determines which profile data is required.
    
    - For individual clients: individual_profile is required
    - For company clients: company_profile is required
    
    The operation is transactional - if any part fails, the entire operation is rolled back.
    """
    try:
        from uuid import UUID
        
        # Use user_id as broker_id for multi-tenant system
        broker_uuid = UUID(user_context.user_id)
        
        result = await client_service.create_client(client_data, broker_uuid)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "client": result.client.dict() if result.client else None
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Invalid UUID format: {e}")
        raise HTTPException(
            status_code=400,
            detail="Formato ID broker non valido"
        )
    except Exception as e:
        logger.error(f"❌ Create client endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.post("/flat")
async def create_client_flat(
    client_data: ClientCreateFlat,
    broker_id: str = Depends(get_current_broker_id),
    client_service: ClientService = Depends(get_client_service)
) -> Dict[str, Any]:
    """
    Create a new client (protected endpoint) - Flat format (Frontend compatible)
    
    This endpoint accepts the flat format used by the frontend:
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
    
    The tipo field determines if it's an individual ("privato") or company ("azienda") client.
    """
    try:
        from uuid import UUID
        
        # Convert broker_id to UUID
        broker_uuid = UUID(broker_id)
        
        result = await client_service.create_client_flat(client_data, broker_uuid)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "client": result.client.dict() if result.client else None
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Invalid UUID format: {e}")
        raise HTTPException(
            status_code=400,
            detail="Formato ID broker non valido"
        )
    except Exception as e:
        logger.error(f"❌ Create client flat endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.get("/")
async def get_clients(
    limit: int = Query(100, ge=1, le=1000, description="Number of clients to return"),
    offset: int = Query(0, ge=0, description="Number of clients to skip"),
    broker_id: str = Depends(get_current_broker_id),
    client_service: ClientService = Depends(get_client_service)
) -> Dict[str, Any]:
    """
    Get all clients for the current broker (protected endpoint)
    
    Returns a paginated list of clients managed by the authenticated broker.
    """
    try:
        from uuid import UUID
        
        broker_uuid = UUID(broker_id)
        result = await client_service.get_clients_by_broker(broker_uuid, limit, offset)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "clients": [client.dict() for client in result.clients],
                "total": result.total,
                "limit": limit,
                "offset": offset
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Invalid UUID format: {e}")
        raise HTTPException(
            status_code=400,
            detail="Formato ID broker non valido"
        )
    except Exception as e:
        logger.error(f"❌ Get clients endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.get("/flat")
async def get_clients_flat(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term"),
    tipo: Optional[str] = Query(None, description="Client type filter"),
    broker_id: str = Depends(get_current_broker_id),
    client_service: ClientService = Depends(get_client_service)
) -> Dict[str, Any]:
    """
    Get all clients for the current broker in flat format (Frontend compatible)
    
    Returns a paginated list of clients in the format expected by the frontend:
    - tipo: 'privato' | 'azienda'
    - nome, cognome for individuals
    - ragione_sociale for companies
    - All other fields flattened
    """
    try:
        from uuid import UUID
        
        # Convert page/per_page to limit/offset
        limit = per_page
        offset = (page - 1) * per_page
        
        broker_uuid = UUID(broker_id)
        result = await client_service.get_clients_by_broker(broker_uuid, limit, offset)
        
        if result.success:
            # Convert structured format to flat format
            flat_clients = []
            for client in result.clients:
                flat_client = {
                    "id": str(client.id),
                    "broker_id": str(client.broker_id),
                    "created_at": client.created_at.isoformat() if client.created_at else None,
                    "updated_at": client.updated_at.isoformat() if client.updated_at else None,
                }
                
                if client.client_type.value == "individual" and client.individual_profile:
                    profile = client.individual_profile
                    flat_client.update({
                        "tipo": "privato",
                        "nome": profile.first_name,
                        "cognome": profile.last_name,
                        "ragione_sociale": "",
                        "email": profile.email or "",
                        "telefono": profile.phone or "",
                        "indirizzo": profile.address or "",
                        "citta": profile.city or "",
                        "provincia": profile.province or "",
                        "cap": profile.postal_code or "",
                        "partita_iva": "",
                        "codice_fiscale": profile.fiscal_code or ""
                    })
                elif client.client_type.value == "company" and client.company_profile:
                    profile = client.company_profile
                    flat_client.update({
                        "tipo": "azienda",
                        "nome": "",
                        "cognome": "",
                        "ragione_sociale": profile.company_name,
                        "email": profile.email or "",
                        "telefono": profile.phone or "",
                        "indirizzo": profile.legal_address or "",
                        "citta": profile.city or "",
                        "provincia": profile.province or "",
                        "cap": profile.postal_code or "",
                        "partita_iva": profile.vat_number or "",
                        "codice_fiscale": profile.fiscal_code or ""
                    })
                
                flat_clients.append(flat_client)
            
            # Apply client-side filtering if needed (basic implementation)
            if search:
                search_lower = search.lower()
                flat_clients = [
                    client for client in flat_clients
                    if (search_lower in (client.get("nome", "") or "").lower() or
                        search_lower in (client.get("cognome", "") or "").lower() or
                        search_lower in (client.get("ragione_sociale", "") or "").lower() or
                        search_lower in (client.get("email", "") or "").lower() or
                        search_lower in (client.get("codice_fiscale", "") or "").lower())
                ]
            
            if tipo:
                flat_clients = [
                    client for client in flat_clients
                    if client.get("tipo") == tipo
                ]
            
            # Calculate pagination info
            total_pages = (result.total + per_page - 1) // per_page
            
            return {
                "success": True,
                "message": result.message,
                "clients": flat_clients,
                "total": result.total,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Invalid UUID format: {e}")
        raise HTTPException(
            status_code=400,
            detail="Formato ID broker non valido"
        )
    except Exception as e:
        logger.error(f"❌ Get clients flat endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.get("/flat/{client_id}")
async def get_client_flat(
    client_id: str,
    broker_id: str = Depends(get_current_broker_id),
    client_service: ClientService = Depends(get_client_service)
) -> Dict[str, Any]:
    """
    Get a specific client by ID in flat format (Frontend compatible)
    
    Returns the client data in the flat format expected by the frontend.
    Only the broker who owns the client can access it.
    """
    try:
        from uuid import UUID
        
        client_uuid = UUID(client_id)
        result = await client_service.get_client_by_id(client_uuid)
        
        if result.success:
            # Verify that the client belongs to the current broker
            if result.client.broker_id != UUID(broker_id):
                raise HTTPException(
                    status_code=403,
                    detail="Accesso negato: questo cliente non appartiene al broker corrente"
                )
            
            # Convert to flat format
            client = result.client
            flat_client = {
                "id": str(client.id),
                "broker_id": str(client.broker_id),
                "created_at": client.created_at.isoformat() if client.created_at else None,
                "updated_at": client.updated_at.isoformat() if client.updated_at else None,
            }
            
            if client.client_type.value == "individual" and client.individual_profile:
                profile = client.individual_profile
                flat_client.update({
                    "tipo": "privato",
                    "nome": profile.first_name,
                    "cognome": profile.last_name,
                    "ragione_sociale": "",
                    "email": profile.email or "",
                    "telefono": profile.phone or "",
                    "indirizzo": profile.address or "",
                    "citta": profile.city or "",
                    "provincia": profile.province or "",
                    "cap": profile.postal_code or "",
                    "partita_iva": "",
                    "codice_fiscale": profile.fiscal_code or ""
                })
            elif client.client_type.value == "company" and client.company_profile:
                profile = client.company_profile
                flat_client.update({
                    "tipo": "azienda",
                    "nome": "",
                    "cognome": "",
                    "ragione_sociale": profile.company_name,
                    "email": profile.email or "",
                    "telefono": profile.phone or "",
                    "indirizzo": profile.legal_address or "",
                    "citta": profile.city or "",
                    "provincia": profile.province or "",
                    "cap": profile.postal_code or "",
                    "partita_iva": profile.vat_number or "",
                    "codice_fiscale": profile.fiscal_code or ""
                })
            
            return {
                "success": True,
                "message": result.message,
                "client": flat_client
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Invalid UUID format: {e}")
        raise HTTPException(
            status_code=400,
            detail="Formato ID non valido"
        )
    except Exception as e:
        logger.error(f"❌ Get client flat endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.get("/{client_id}")
async def get_client(
    client_id: str,
    broker_id: str = Depends(get_current_broker_id),
    client_service: ClientService = Depends(get_client_service)
) -> Dict[str, Any]:
    """
    Get a specific client by ID (protected endpoint)
    
    Returns the client data with the associated profile (individual or company).
    Only the broker who owns the client can access it.
    """
    try:
        from uuid import UUID
        
        client_uuid = UUID(client_id)
        result = await client_service.get_client_by_id(client_uuid)
        
        if result.success:
            # Verify that the client belongs to the current broker
            if result.client.broker_id != UUID(broker_id):
                raise HTTPException(
                    status_code=403,
                    detail="Accesso negato: questo cliente non appartiene al broker corrente"
                )
            
            return {
                "success": True,
                "message": result.message,
                "client": result.client.dict() if result.client else None
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Invalid UUID format: {e}")
        raise HTTPException(
            status_code=400,
            detail="Formato ID non valido"
        )
    except Exception as e:
        logger.error(f"❌ Get client endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.put("/flat/{client_id}")
async def update_client_flat(
    client_id: str,
    update_data: ClientCreateFlat,
    broker_id: str = Depends(get_current_broker_id),
    client_service: ClientService = Depends(get_client_service)
) -> Dict[str, Any]:
    """
    Update a specific client in flat format (Frontend compatible)
    
    Updates the client data using the flat format from the frontend.
    Only the broker who owns the client can update it.
    """
    try:
        from uuid import UUID
        
        client_uuid = UUID(client_id)
        
        # First get the client to verify ownership
        current_client = await client_service.get_client_by_id(client_uuid)
        if not current_client.success:
            raise HTTPException(
                status_code=404,
                detail="Cliente non trovato"
            )
        
        # Verify that the client belongs to the current broker
        if current_client.client.broker_id != UUID(broker_id):
            raise HTTPException(
                status_code=403,
                detail="Accesso negato: questo cliente non appartiene al broker corrente"
            )
        
        # Convert flat format to structured format for update
        if update_data.tipo in ['privato', 'individual']:
            # Update individual client
            from app.models.clients import ClientUpdate, IndividualProfileUpdate
            structured_update = ClientUpdate(
                is_active=True,  # Keep active
                notes=None,
                individual_profile=IndividualProfileUpdate(
                    first_name=update_data.nome,
                    last_name=update_data.cognome,
                    fiscal_code=update_data.codice_fiscale,
                    phone=update_data.telefono,
                    email=update_data.email,
                    address=update_data.indirizzo,
                    city=update_data.citta,
                    postal_code=update_data.cap,
                    province=update_data.provincia
                )
            )
        else:
            # Update company client
            from app.models.clients import ClientUpdate, CompanyProfileUpdate
            structured_update = ClientUpdate(
                is_active=True,  # Keep active
                notes=None,
                company_profile=CompanyProfileUpdate(
                    company_name=update_data.ragione_sociale,
                    vat_number=update_data.partita_iva,
                    fiscal_code=update_data.codice_fiscale,
                    legal_address=update_data.indirizzo,
                    city=update_data.citta,
                    postal_code=update_data.cap,
                    province=update_data.provincia,
                    phone=update_data.telefono,
                    email=update_data.email
                )
            )
        
        result = await client_service.update_client(client_uuid, structured_update)
        
        if result.success:
            # Convert result back to flat format
            client = result.client
            flat_client = {
                "id": str(client.id),
                "broker_id": str(client.broker_id),
                "created_at": client.created_at.isoformat() if client.created_at else None,
                "updated_at": client.updated_at.isoformat() if client.updated_at else None,
            }
            
            if client.client_type.value == "individual" and client.individual_profile:
                profile = client.individual_profile
                flat_client.update({
                    "tipo": "privato",
                    "nome": profile.first_name,
                    "cognome": profile.last_name,
                    "ragione_sociale": "",
                    "email": profile.email or "",
                    "telefono": profile.phone or "",
                    "indirizzo": profile.address or "",
                    "citta": profile.city or "",
                    "provincia": profile.province or "",
                    "cap": profile.postal_code or "",
                    "partita_iva": "",
                    "codice_fiscale": profile.fiscal_code or ""
                })
            elif client.client_type.value == "company" and client.company_profile:
                profile = client.company_profile
                flat_client.update({
                    "tipo": "azienda",
                    "nome": "",
                    "cognome": "",
                    "ragione_sociale": profile.company_name,
                    "email": profile.email or "",
                    "telefono": profile.phone or "",
                    "indirizzo": profile.legal_address or "",
                    "citta": profile.city or "",
                    "provincia": profile.province or "",
                    "cap": profile.postal_code or "",
                    "partita_iva": profile.vat_number or "",
                    "codice_fiscale": profile.fiscal_code or ""
                })
            
            return {
                "success": True,
                "message": result.message,
                "client": flat_client
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Invalid UUID format: {e}")
        raise HTTPException(
            status_code=400,
            detail="Formato ID non valido"
        )
    except Exception as e:
        logger.error(f"❌ Update client flat endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.put("/{client_id}")
async def update_client(
    client_id: str,
    update_data: ClientUpdate,
    broker_id: str = Depends(get_current_broker_id),
    client_service: ClientService = Depends(get_client_service)
) -> Dict[str, Any]:
    """
    Update a specific client (protected endpoint)
    
    Updates the client data and/or the associated profile.
    Only the broker who owns the client can update it.
    """
    try:
        from uuid import UUID
        
        client_uuid = UUID(client_id)
        
        # First get the client to verify ownership
        current_client = await client_service.get_client_by_id(client_uuid)
        if not current_client.success:
            raise HTTPException(
                status_code=404,
                detail="Cliente non trovato"
            )
        
        # Verify that the client belongs to the current broker
        if current_client.client.broker_id != UUID(broker_id):
            raise HTTPException(
                status_code=403,
                detail="Accesso negato: questo cliente non appartiene al broker corrente"
            )
        
        result = await client_service.update_client(client_uuid, update_data)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "client": result.client.dict() if result.client else None
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Invalid UUID format: {e}")
        raise HTTPException(
            status_code=400,
            detail="Formato ID non valido"
        )
    except Exception as e:
        logger.error(f"❌ Update client endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.delete("/{client_id}")
async def delete_client(
    client_id: str,
    broker_id: str = Depends(get_current_broker_id),
    client_service: ClientService = Depends(get_client_service)
) -> Dict[str, Any]:
    """
    Delete a specific client (protected endpoint)
    
    Deletes the client and the associated profile (individual or company).
    Only the broker who owns the client can delete it.
    """
    try:
        from uuid import UUID
        
        client_uuid = UUID(client_id)
        
        # First get the client to verify ownership
        current_client = await client_service.get_client_by_id(client_uuid)
        if not current_client.success:
            raise HTTPException(
                status_code=404,
                detail="Cliente non trovato"
            )
        
        # Verify that the client belongs to the current broker
        if current_client.client.broker_id != UUID(broker_id):
            raise HTTPException(
                status_code=403,
                detail="Accesso negato: questo cliente non appartiene al broker corrente"
            )
        
        result = await client_service.delete_client(client_uuid)
        
        if result.success:
            return {
                "success": True,
                "message": result.message
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Invalid UUID format: {e}")
        raise HTTPException(
            status_code=400,
            detail="Formato ID non valido"
        )
    except Exception as e:
        logger.error(f"❌ Delete client endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )
