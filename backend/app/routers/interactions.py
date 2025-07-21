"""
Interaction routes for managing client interactions
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header, Query, Path
from fastapi.responses import JSONResponse
from app.services.interaction_service import get_interaction_service, InteractionService
from app.services.auth_service import get_auth_service, AuthService
from app.models.interactions import InteractionCreate, InteractionUpdate, InteractionResponse, InteractionListResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/clients/{client_id}/interactions", tags=["Interactions"])


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
async def create_interaction(
    interaction_data: InteractionCreate,
    client_id: str = Path(..., description="ID of the client"),
    broker_id: str = Depends(get_current_broker_id),
    interaction_service: InteractionService = Depends(get_interaction_service)
) -> Dict[str, Any]:
    """
    Create a new interaction for a client (protected endpoint)
    
    This endpoint creates a new interaction (note, call, meeting, email) for a specific client.
    The interaction will be associated with the authenticated broker.
    
    - EMAIL: Requires subject and details
    - CALL: Optional subject and details
    - MEETING: Requires subject, optional details
    - NOTE: Requires details, optional subject
    """
    try:
        from uuid import UUID
        
        client_uuid = UUID(client_id)
        broker_uuid = UUID(broker_id)
        
        result = await interaction_service.create_interaction(client_uuid, broker_uuid, interaction_data)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "interaction": result.interaction.dict() if result.interaction else None
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
        logger.error(f"❌ Create interaction endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.get("/")
async def get_interactions(
    client_id: str = Path(..., description="ID of the client"),
    limit: int = Query(100, ge=1, le=1000, description="Number of interactions to return"),
    offset: int = Query(0, ge=0, description="Number of interactions to skip"),
    broker_id: str = Depends(get_current_broker_id),
    interaction_service: InteractionService = Depends(get_interaction_service)
) -> Dict[str, Any]:
    """
    Get all interactions for a client (protected endpoint)
    
    Returns a paginated list of interactions for the specified client,
    ordered by timestamp (most recent first).
    Only the broker who owns the client can access the interactions.
    """
    try:
        from uuid import UUID
        
        client_uuid = UUID(client_id)
        broker_uuid = UUID(broker_id)
        
        result = await interaction_service.get_interactions_by_client(client_uuid, broker_uuid, limit, offset)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "interactions": [interaction.dict() for interaction in result.interactions],
                "total": result.total,
                "limit": limit,
                "offset": offset
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
        logger.error(f"❌ Get interactions endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.get("/{interaction_id}")
async def get_interaction(
    client_id: str = Path(..., description="ID of the client"),
    interaction_id: str = Path(..., description="ID of the interaction"),
    broker_id: str = Depends(get_current_broker_id),
    interaction_service: InteractionService = Depends(get_interaction_service)
) -> Dict[str, Any]:
    """
    Get a specific interaction by ID (protected endpoint)
    
    Returns the interaction data for the specified interaction.
    Only the broker who owns the client can access the interaction.
    """
    try:
        from uuid import UUID
        
        interaction_uuid = UUID(interaction_id)
        
        result = await interaction_service.get_interaction_by_id(interaction_uuid)
        
        if result.success:
            # Verify that the interaction belongs to the client owned by the broker
            if result.interaction.client_id != UUID(client_id):
                raise HTTPException(
                    status_code=403,
                    detail="Accesso negato: questa interazione non appartiene al cliente specificato"
                )
            
            return {
                "success": True,
                "message": result.message,
                "interaction": result.interaction.dict() if result.interaction else None
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
        logger.error(f"❌ Get interaction endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.put("/{interaction_id}")
async def update_interaction(
    update_data: InteractionUpdate,
    client_id: str = Path(..., description="ID of the client"),
    interaction_id: str = Path(..., description="ID of the interaction"),
    broker_id: str = Depends(get_current_broker_id),
    interaction_service: InteractionService = Depends(get_interaction_service)
) -> Dict[str, Any]:
    """
    Update an interaction (protected endpoint)
    
    Updates the specified interaction. Only the broker who created the interaction can update it.
    """
    try:
        from uuid import UUID
        
        interaction_uuid = UUID(interaction_id)
        broker_uuid = UUID(broker_id)
        
        result = await interaction_service.update_interaction(interaction_uuid, broker_uuid, update_data)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "interaction": result.interaction.dict() if result.interaction else None
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
        logger.error(f"❌ Update interaction endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.delete("/{interaction_id}")
async def delete_interaction(
    client_id: str = Path(..., description="ID of the client"),
    interaction_id: str = Path(..., description="ID of the interaction"),
    broker_id: str = Depends(get_current_broker_id),
    interaction_service: InteractionService = Depends(get_interaction_service)
) -> Dict[str, Any]:
    """
    Delete an interaction (protected endpoint)
    
    Deletes the specified interaction. Only the broker who created the interaction can delete it.
    """
    try:
        from uuid import UUID
        
        interaction_uuid = UUID(interaction_id)
        broker_uuid = UUID(broker_id)
        
        result = await interaction_service.delete_interaction(interaction_uuid, broker_uuid)
        
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
        logger.error(f"❌ Delete interaction endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        ) 