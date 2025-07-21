"""
Billing API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import stripe
import logging
from datetime import datetime

from app.config.settings import settings
from app.models.subscriptions import (
    Subscription, SubscriptionResponse, SubscriptionUpdate,
    Usage, PlanLimits, PlanType, SubscriptionStatus, BillingInterval, WebhookEvent
)
from app.services.billing_service import BillingService
from app.config.database import get_supabase
from supabase import Client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


def get_billing_service(supabase: Client = Depends(get_supabase)) -> BillingService:
    """Get billing service instance"""
    return BillingService(supabase)


def get_current_user_id(request: Request) -> str:
    """Extract user ID from request headers (Supabase auth)"""
    # This should be implemented based on your auth middleware
    # For now, we'll use a placeholder
    user_id = request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Get current user subscription details"""
    try:
        subscription_details = await billing_service.get_subscription_details(user_id)
        return subscription_details
    except Exception as e:
        logger.error(f"Error getting subscription for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription")


@router.get("/usage")
async def get_current_usage(
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Get current month usage for user"""
    try:
        subscription = await billing_service.get_or_create_subscription(user_id)
        usage = await billing_service.get_current_usage(user_id, subscription.id)
        return usage
    except Exception as e:
        logger.error(f"Error getting usage for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get usage")


@router.post("/usage/increment")
async def increment_usage(
    usage_type: str,
    amount: int = 1,
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Increment usage counter"""
    try:
        # Map usage_type to the correct action for limit checking
        usage_to_action_map = {
            "analyses": "analysis",
            "ai_analyses": "ai_analysis", 
            "exports": "export",
            "api_calls": "api_access"
        }
        
        # Get the correct action for limit checking
        action_for_limit_check = usage_to_action_map.get(usage_type, usage_type)
        
        # Check if user can perform this action
        limit_check = await billing_service.check_usage_limits(user_id, action_for_limit_check)
        
        if not limit_check["allowed"]:
            raise HTTPException(
                status_code=403, 
                detail={
                    "message": limit_check["reason"],
                    "current_usage": limit_check.get("current_usage"),
                    "limit": limit_check.get("limit"),
                    "plan_type": limit_check["plan_type"]
                }
            )
        
        # Increment usage only if allowed
        usage = await billing_service.increment_usage(user_id, usage_type, amount)
        return {"success": True, "usage": usage}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error incrementing usage for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to increment usage")


@router.post("/usage/companies")
async def update_companies_count(
    count: int,
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Update active companies count"""
    try:
        # Check if user can have this many companies
        if count > 0:
            limit_check = await billing_service.check_usage_limits(user_id, "add_company")
            if not limit_check["allowed"] and count > limit_check.get("limit", 0):
                raise HTTPException(
                    status_code=403,
                    detail={
                        "message": limit_check["reason"],
                        "current_usage": limit_check.get("current_usage"),
                        "limit": limit_check.get("limit"),
                        "plan_type": limit_check["plan_type"]
                    }
                )
        
        usage = await billing_service.update_companies_count(user_id, count)
        return {"success": True, "usage": usage}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating companies count for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update companies count")


@router.get("/limits/check/{action}")
async def check_usage_limits(
    action: str,
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Check if user can perform specific action"""
    try:
        result = await billing_service.check_usage_limits(user_id, action)
        return result
    except Exception as e:
        logger.error(f"Error checking limits for user {user_id}, action {action}: {e}")
        raise HTTPException(status_code=500, detail="Failed to check limits")


@router.get("/plans")
async def get_available_plans():
    """Get available subscription plans"""
    try:
        plans = []
        for plan_type in PlanType:
            limits = PlanLimits.get_limits(plan_type)
            plans.append({
                "plan_type": plan_type.value,
                "limits": limits.dict()
            })
        return {"plans": plans}
    except Exception as e:
        logger.error(f"Error getting plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to get plans")


@router.post("/stripe/customer")
async def create_stripe_customer(
    email: str,
    name: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Create Stripe customer for user"""
    try:
        customer_id = await billing_service.create_stripe_customer(user_id, email, name)
        return {"success": True, "customer_id": customer_id}
    except Exception as e:
        logger.error(f"Error creating Stripe customer for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create Stripe customer")


@router.post("/stripe/portal")
async def create_billing_portal_session(
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Create Stripe billing portal session"""
    try:
        subscription = await billing_service.get_or_create_subscription(user_id)
        
        if not subscription.stripe_customer_id:
            raise HTTPException(
                status_code=400, 
                detail="No Stripe customer found. Please subscribe to a plan first."
            )
        
        session = stripe.billing_portal.Session.create(
            customer=subscription.stripe_customer_id,
            return_url=f"{settings.NEXT_PUBLIC_APP_URL}/dashboard"
        )
        
        return {"url": session.url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating portal session for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create portal session")


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    billing_service: BillingService = Depends(get_billing_service)
):
    """Handle Stripe webhooks"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Handle the event
        success = await billing_service.handle_stripe_webhook(
            event['type'], 
            event['data']['object']
        )
        
        if success:
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to process webhook")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {e}")
        raise HTTPException(status_code=500, detail="Failed to process webhook")


@router.get("/health")
async def billing_health_check():
    """Health check for billing service"""
    try:
        # Test Stripe connection
        stripe.Account.retrieve()
        
        return {
            "status": "healthy",
            "stripe": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Billing health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.post("/subscription/free")
async def set_free_plan(
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Set user to free plan"""
    try:
        logger.info(f"Setting free plan for user {user_id}")
        
        # Ottieni o crea la subscription
        subscription = await billing_service.get_or_create_subscription(user_id)
        
        # Se l'utente ha già una subscription attiva a pagamento, 
        # potresti voler gestire la cancellazione
        if subscription.plan_type != PlanType.FREE:
            logger.info(f"User {user_id} switching from {subscription.plan_type} to FREE plan")
        
        # Aggiorna direttamente nel database senza usare il service per evitare problemi di serializzazione
        now = datetime.utcnow()
        update_data = {
            "plan_type": PlanType.FREE.value,
            "status": SubscriptionStatus.ACTIVE.value,
            "stripe_subscription_id": None,
            "current_period_start": now.isoformat(),
            "current_period_end": None,
            "updated_at": now.isoformat(),
            "metadata": {
                "plan_activated_via": "frontend_api",
                "activation_timestamp": now.isoformat()
            }
        }
        
        # Ottieni il client Supabase direttamente
        supabase = billing_service.supabase
        result = supabase.table("subscriptions").update(update_data).eq("id", subscription.id).execute()
        
        if not result.data:
            raise Exception("Failed to update subscription in database")
        
        logger.info(f"✅ Free plan activated and saved to database for user {user_id}")
        
        # Crea la risposta manualmente dai dati del database
        updated_record = result.data[0]
        subscription_data = {
            "id": updated_record["id"],
            "user_id": updated_record["user_id"],
            "plan_type": updated_record["plan_type"],
            "status": updated_record["status"],
            "billing_interval": updated_record.get("billing_interval"),
            "current_period_start": updated_record.get("current_period_start"),
            "current_period_end": updated_record.get("current_period_end"),
            "created_at": updated_record["created_at"],
            "updated_at": updated_record["updated_at"],
            "stripe_customer_id": updated_record.get("stripe_customer_id"),
            "stripe_subscription_id": updated_record.get("stripe_subscription_id"),
            "autumn_customer_id": updated_record.get("autumn_customer_id"),
            "metadata": updated_record.get("metadata", {})
        }
        
        return {
            "success": True,
            "message": "Piano gratuito attivato con successo",
            "subscription": subscription_data
        }
        
    except Exception as e:
        logger.error(f"Error setting free plan for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set free plan: {str(e)}")


@router.post("/subscription/paid")
async def set_paid_plan(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Set user to paid plan after successful Stripe/Autumn payment"""
    try:
        body = await request.json()
        
        plan_type = body.get("plan_type")
        billing_interval = body.get("billing_interval", "month")
        stripe_customer_id = body.get("stripe_customer_id")
        stripe_subscription_id = body.get("stripe_subscription_id")
        autumn_customer_id = body.get("autumn_customer_id")
        product_id = body.get("product_id")
        
        # Validazione del piano
        if plan_type not in ["professional", "enterprise"]:
            raise HTTPException(status_code=400, detail="Invalid plan type for paid subscription")
        
        logger.info(f"User {user_id} upgrading to {plan_type} plan")
        
        # Calcola le date del periodo corrente
        current_period_start = datetime.utcnow()
        if billing_interval == "year":
            # Aggiungi 1 anno
            current_period_end = current_period_start.replace(year=current_period_start.year + 1)
        else:
            # Aggiungi 1 mese
            if current_period_start.month == 12:
                current_period_end = current_period_start.replace(year=current_period_start.year + 1, month=1)
            else:
                current_period_end = current_period_start.replace(month=current_period_start.month + 1)
        
        # Ottieni o crea la subscription
        subscription = await billing_service.get_or_create_subscription(user_id)
        
        # Aggiorna a piano a pagamento
        updated_subscription = await billing_service.update_subscription(
            subscription.id,
            SubscriptionUpdate(
                plan_type=PlanType(plan_type),
                status=SubscriptionStatus.ACTIVE,
                billing_interval=BillingInterval(billing_interval),
                stripe_customer_id=stripe_customer_id,
                stripe_subscription_id=stripe_subscription_id,
                autumn_customer_id=autumn_customer_id,
                current_period_start=current_period_start,
                current_period_end=current_period_end,
                metadata={
                    "product_id": product_id,
                    "upgraded_at": current_period_start.isoformat(),
                    "payment_method": "stripe_autumn",
                    "plan_activated_via": "frontend_api"
                }
            )
        )
        
        logger.info(f"✅ {plan_type} plan activated and saved to database for user {user_id}")
        
        # Serialize datetime objects to strings manually
        subscription_dict = updated_subscription.dict()
        for key, value in subscription_dict.items():
            if isinstance(value, datetime):
                subscription_dict[key] = value.isoformat()
        
        return {
            "success": True,
            "message": f"Piano {plan_type} attivato con successo",
            "subscription": subscription_dict
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting paid plan for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set paid plan: {str(e)}")


@router.get("/stats")
async def get_billing_stats(
    user_id: str = Depends(get_current_user_id),
    billing_service: BillingService = Depends(get_billing_service)
):
    """Get billing statistics for user"""
    try:
        subscription_details = await billing_service.get_subscription_details(user_id)
        
        stats = {
            "plan_type": subscription_details.subscription.plan_type,
            "status": subscription_details.subscription.status,
            "is_trial": subscription_details.is_trial,
            "trial_days_remaining": subscription_details.trial_days_remaining,
            "days_until_renewal": subscription_details.days_until_renewal,
            "usage": {
                "analyses_used": subscription_details.current_usage.analyses_used if subscription_details.current_usage else 0,
                "companies_active": subscription_details.current_usage.companies_active if subscription_details.current_usage else 0,
                "ai_analyses_used": subscription_details.current_usage.ai_analyses_used if subscription_details.current_usage else 0,
                "exports_generated": subscription_details.current_usage.exports_generated if subscription_details.current_usage else 0,
                "api_calls_made": subscription_details.current_usage.api_calls_made if subscription_details.current_usage else 0,
            },
            "limits": subscription_details.plan_limits.dict()
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting billing stats for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get billing stats")
