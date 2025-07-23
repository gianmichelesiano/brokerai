"""
Broker routes for managing broker data
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from app.services.broker_service import get_broker_service, BrokerService
from app.services.auth_service import get_auth_service, AuthService
from app.models.brokers import BrokerCreate, BrokerUpdate, BrokerResponse
from app.dependencies.auth import (
    get_current_user_context, get_user_company_filter, add_company_id_to_data
)
from app.models.companies import UserContext

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/brokers", tags=["Brokers"])


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


async def get_current_broker_info(
    authorization: str = Header(None),
    auth_service: AuthService = Depends(get_auth_service),
    broker_service: BrokerService = Depends(get_broker_service)
) -> Dict[str, Any]:
    """
    Dependency to get current broker information from JWT token
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
    
    # Get broker info
    broker_result = await broker_service.get_broker_by_auth_id(user_data["id"])
    if not broker_result.success:
        raise HTTPException(
            status_code=404,
            detail="Profilo broker non trovato"
        )
    
    return {
        "id": user_data["id"],
        "broker": broker_result.broker
    }


@router.get("/me")
async def get_current_broker(
    user_context: UserContext = Depends(get_current_user_context),
    broker_service: BrokerService = Depends(get_broker_service)
) -> Dict[str, Any]:
    """
    Get current broker information (protected endpoint)
    Returns broker data from the brokers table
    """
    try:
        result = await broker_service.get_broker_by_auth_id(user_context.user_id)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "broker": result.broker.dict() if result.broker else None
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get current broker endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.put("/me")
async def update_current_broker(
    update_data: BrokerUpdate,
    broker_id: str = Depends(get_current_broker_id),
    broker_service: BrokerService = Depends(get_broker_service)
) -> Dict[str, Any]:
    """
    Update current broker profile (protected endpoint)
    Allows updating name, surname, RUI number, etc.
    """
    try:
        from uuid import UUID
        
        # Convert broker_id to UUID
        broker_uuid = UUID(broker_id)
        
        result = await broker_service.update_broker(broker_uuid, update_data)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "broker": result.broker.dict() if result.broker else None
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
        logger.error(f"❌ Update current broker endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.get("/me/profile")
async def get_current_broker_profile(
    broker_id: str = Depends(get_current_broker_id),
    broker_service: BrokerService = Depends(get_broker_service)
) -> Dict[str, Any]:
    """
    Get current broker profile with additional information
    This endpoint can be extended to include more profile data
    """
    try:
        result = await broker_service.get_broker_by_auth_id(broker_id)
        
        if result.success and result.broker:
            # Add any additional profile information here
            profile_data = result.broker.dict()
            profile_data["profile_complete"] = bool(
                profile_data["first_name"] and 
                profile_data["last_name"] and 
                profile_data["rui_number"]
            )
            
            return {
                "success": True,
                "message": "Profilo broker recuperato con successo",
                "profile": profile_data
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=result.error or "Profilo broker non trovato"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get broker profile endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.post("/")
async def create_broker(
    broker_data: BrokerCreate,
    current_broker_info: Dict[str, Any] = Depends(get_current_broker_info),
    broker_service: BrokerService = Depends(get_broker_service)
) -> Dict[str, Any]:
    """
    Create a new broker (admin only)
    Only brokers with ADMIN role can create new brokers
    """
    try:
        # Check if current user is admin
        current_broker = current_broker_info["broker"]
        if current_broker.role != "ADMIN":
            raise HTTPException(
                status_code=403,
                detail="Solo gli amministratori possono creare nuovi broker"
            )
        
        result = await broker_service.create_broker(broker_data)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "broker": result.broker.dict() if result.broker else None
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=result.error
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Create broker endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )


@router.post("/me")
async def create_my_broker_profile(
    broker_data: BrokerCreate,
    broker_id: str = Depends(get_current_broker_id),
    broker_service: BrokerService = Depends(get_broker_service)
) -> Dict[str, Any]:
    """
    Create broker profile for current user
    This endpoint allows users to create their own broker profile
    """
    try:
        from uuid import UUID
        
        # Ensure the broker ID matches the current user
        if str(broker_data.id) != broker_id:
            raise HTTPException(
                status_code=400,
                detail="L'ID del broker deve corrispondere all'utente autenticato"
            )
        
        result = await broker_service.create_broker(broker_data)
        
        if result.success:
            return {
                "success": True,
                "message": result.message,
                "broker": result.broker.dict() if result.broker else None
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
        logger.error(f"❌ Create my broker profile endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Errore interno del server"
        )
