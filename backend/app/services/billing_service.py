"""
Billing service for subscription and usage management
"""

import stripe
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from supabase import Client
from app.config.settings import settings
from app.models.subscriptions import (
    Subscription, SubscriptionCreate, SubscriptionUpdate,
    Usage, UsageCreate, UsageUpdate,
    PlanType, SubscriptionStatus, BillingInterval,
    PlanLimits, SubscriptionResponse
)
import logging

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    """Service for managing billing and subscriptions"""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    
    async def get_or_create_subscription(self, user_id: str) -> Subscription:
        """Get existing subscription or create a free one"""
        try:
            logger.info(f"🔍 get_or_create_subscription: Starting for user {user_id}")
            
            # Try to get existing subscription
            logger.info(f"📋 Querying subscriptions table for user {user_id}")
            result = self.supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()
            logger.info(f"📋 Query result: {len(result.data) if result.data else 0} records found")
            
            if result.data:
                logger.info(f"✅ Found existing subscription: {result.data[0].get('id', 'unknown')}")
                subscription = Subscription(**result.data[0])
                logger.info(f"✅ Created Subscription object with plan: {subscription.plan_type}")
                return subscription
            
            # Create free subscription with explicit data structure
            logger.info(f"🆕 No subscription found, creating new free subscription for user {user_id}")
            subscription_data = {
                "user_id": user_id,
                "plan_type": PlanType.FREE.value,
                "status": SubscriptionStatus.ACTIVE.value,
                "metadata": {}
            }
            logger.info(f"🆕 Subscription data to insert: {subscription_data}")
            
            result = self.supabase.table("subscriptions").insert(subscription_data).execute()
            logger.info(f"🆕 Insert result: {len(result.data) if result.data else 0} records created")
            
            if result.data:
                logger.info(f"✅ Successfully created subscription: {result.data[0].get('id', 'unknown')}")
                subscription = Subscription(**result.data[0])
                logger.info(f"✅ Created Subscription object with plan: {subscription.plan_type}")
                return subscription
            else:
                logger.error(f"💥 Failed to create subscription for user {user_id} - no data returned")
                raise Exception("Failed to create subscription")
            
        except Exception as e:
            logger.error(f"💥 ERROR in get_or_create_subscription for user {user_id}: {e}")
            logger.error(f"💥 ERROR TYPE: {type(e).__name__}")
            import traceback
            logger.error(f"💥 TRACEBACK: {traceback.format_exc()}")
            raise
    
    async def update_subscription(self, subscription_id: str, update_data: SubscriptionUpdate) -> Subscription:
        """Update subscription"""
        try:
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
            
            # Convert datetime objects to ISO strings for database storage
            for key, value in update_dict.items():
                if isinstance(value, datetime):
                    update_dict[key] = value.isoformat()
            
            update_dict["updated_at"] = datetime.utcnow().isoformat()
            
            result = self.supabase.table("subscriptions").update(update_dict).eq("id", subscription_id).execute()
            return Subscription(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error updating subscription {subscription_id}: {e}")
            raise
    
    async def get_current_usage(self, user_id: str, subscription_id: str) -> Optional[Usage]:
        """Get current month usage for user"""
        try:
            # Calculate current period start (beginning of month)
            now = datetime.utcnow()
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            # Try to get existing usage for current period
            result = self.supabase.table("usage").select("*").eq("user_id", user_id).eq("subscription_id", subscription_id).gte("period_start", period_start.isoformat()).lte("period_end", period_end.isoformat()).execute()
            
            if result.data:
                return Usage(**result.data[0])
            
            # Create new usage record for current period
            usage_data = {
                "user_id": user_id,
                "subscription_id": subscription_id,
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "analyses_used": 0,
                "companies_active": 0,
                "ai_analyses_used": 0,
                "exports_generated": 0,
                "api_calls_made": 0
            }
            
            result = self.supabase.table("usage").insert(usage_data).execute()
            if result.data:
                return Usage(**result.data[0])
            else:
                logger.error(f"Failed to create usage record for user {user_id}")
                return None
            
        except Exception as e:
            logger.error(f"Error getting current usage for user {user_id}: {e}")
            raise
    
    async def increment_usage(self, user_id: str, usage_type: str, amount: int = 1) -> Usage:
        """Increment usage counter"""
        try:
            subscription = await self.get_or_create_subscription(user_id)
            usage = await self.get_current_usage(user_id, subscription.id)
            
            # Map usage types to fields
            usage_fields = {
                "analyses": "analyses_used",
                "ai_analyses": "ai_analyses_used",
                "exports": "exports_generated",
                "api_calls": "api_calls_made"
            }
            
            field = usage_fields.get(usage_type)
            if not field:
                raise ValueError(f"Invalid usage type: {usage_type}")
            
            # Update usage
            current_value = getattr(usage, field, 0)
            update_data = {field: current_value + amount}
            
            result = self.supabase.table("usage").update(update_data).eq("id", usage.id).execute()
            return Usage(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error incrementing usage {usage_type} for user {user_id}: {e}")
            raise
    
    async def update_companies_count(self, user_id: str, count: int) -> Usage:
        """Update active companies count"""
        try:
            subscription = await self.get_or_create_subscription(user_id)
            usage = await self.get_current_usage(user_id, subscription.id)
            
            result = self.supabase.table("usage").update({"companies_active": count}).eq("id", usage.id).execute()
            return Usage(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error updating companies count for user {user_id}: {e}")
            raise
    
    async def check_usage_limits(self, user_id: str, action: str) -> Dict[str, Any]:
        """Check if user can perform action based on plan limits"""
        try:
            subscription = await self.get_or_create_subscription(user_id)
            usage = await self.get_current_usage(user_id, subscription.id)
            limits = PlanLimits.get_limits(subscription.plan_type)
            
            result = {
                "allowed": True,
                "reason": None,
                "current_usage": None,
                "limit": None,
                "plan_type": subscription.plan_type
            }
            
            if action == "analysis":
                if limits.monthly_analyses != -1:  # Not unlimited
                    if usage.analyses_used >= limits.monthly_analyses:
                        result.update({
                            "allowed": False,
                            "reason": "Monthly analysis limit reached",
                            "current_usage": usage.analyses_used,
                            "limit": limits.monthly_analyses
                        })
            
            elif action == "ai_analysis":
                if not limits.ai_analysis:
                    result.update({
                        "allowed": False,
                        "reason": "AI analysis not available in current plan"
                    })
            
            elif action == "export":
                if not limits.export_data:
                    result.update({
                        "allowed": False,
                        "reason": "Data export not available in current plan"
                    })
            
            elif action == "api_access":
                if not limits.api_access:
                    result.update({
                        "allowed": False,
                        "reason": "API access not available in current plan"
                    })
            
            elif action == "add_company":
                if limits.max_companies != -1:  # Not unlimited
                    if usage.companies_active >= limits.max_companies:
                        result.update({
                            "allowed": False,
                            "reason": "Maximum companies limit reached",
                            "current_usage": usage.companies_active,
                            "limit": limits.max_companies
                        })
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking usage limits for user {user_id}, action {action}: {e}")
            raise
    
    async def get_subscription_details(self, user_id: str) -> SubscriptionResponse:
        """Get complete subscription details"""
        try:
            logger.info(f"🔍 Starting get_subscription_details for user {user_id}")
            
            # Step 1: Get or create subscription
            logger.info(f"📝 Step 1: Getting/creating subscription for user {user_id}")
            subscription = await self.get_or_create_subscription(user_id)
            logger.info(f"✅ Step 1 SUCCESS: Got subscription {subscription.id} with plan {subscription.plan_type}")
            
            # Step 2: Get current usage
            logger.info(f"📊 Step 2: Getting current usage for user {user_id}, subscription {subscription.id}")
            usage = await self.get_current_usage(user_id, subscription.id)
            if usage:
                logger.info(f"✅ Step 2 SUCCESS: Got usage record {usage.id}")
            else:
                logger.warning(f"⚠️ Step 2 WARNING: No usage record found")
            
            # Step 3: Get plan limits
            logger.info(f"📋 Step 3: Getting plan limits for {subscription.plan_type}")
            limits = PlanLimits.get_limits(subscription.plan_type)
            logger.info(f"✅ Step 3 SUCCESS: Got limits - analyses: {limits.monthly_analyses}, companies: {limits.max_companies}")
            
            # Step 4: Calculate days until renewal
            logger.info(f"📅 Step 4: Calculating renewal days")
            days_until_renewal = None
            if subscription.current_period_end:
                # Ensure both datetimes are timezone-aware for comparison
                now_utc = datetime.now(timezone.utc)
                if subscription.current_period_end.tzinfo is None:
                    # If database datetime is naive, assume it's UTC
                    period_end = subscription.current_period_end.replace(tzinfo=timezone.utc)
                else:
                    period_end = subscription.current_period_end
                days_until_renewal = (period_end - now_utc).days
                logger.info(f"✅ Step 4: Days until renewal: {days_until_renewal}")
            else:
                logger.info(f"ℹ️ Step 4: No renewal date (free plan)")
            
            # Step 5: Check trial status
            logger.info(f"🆓 Step 5: Checking trial status")
            is_trial = False
            trial_days_remaining = None
            if subscription.trial_end:
                # Ensure both datetimes are timezone-aware for comparison
                now_utc = datetime.now(timezone.utc)
                if subscription.trial_end.tzinfo is None:
                    # If database datetime is naive, assume it's UTC
                    trial_end = subscription.trial_end.replace(tzinfo=timezone.utc)
                else:
                    trial_end = subscription.trial_end
                trial_days_remaining = (trial_end - now_utc).days
                is_trial = trial_days_remaining > 0
                logger.info(f"✅ Step 5: Trial status - is_trial: {is_trial}, days_remaining: {trial_days_remaining}")
            else:
                logger.info(f"ℹ️ Step 5: No trial period")
            
            # Step 6: Create response
            logger.info(f"🏗️ Step 6: Creating SubscriptionResponse")
            response = SubscriptionResponse(
                subscription=subscription,
                current_usage=usage,
                plan_limits=limits,
                days_until_renewal=days_until_renewal,
                is_trial=is_trial,
                trial_days_remaining=trial_days_remaining
            )
            logger.info(f"🎉 SUCCESS: Created SubscriptionResponse for user {user_id}")
            
            return response
            
        except Exception as e:
            logger.error(f"💥 ERROR in get_subscription_details for user {user_id}: {e}")
            logger.error(f"💥 ERROR TYPE: {type(e).__name__}")
            logger.error(f"💥 ERROR ARGS: {e.args}")
            import traceback
            logger.error(f"💥 TRACEBACK: {traceback.format_exc()}")
            raise
    
    async def create_stripe_customer(self, user_id: str, email: str, name: str = None) -> str:
        """Create Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={"user_id": user_id}
            )
            
            # Update subscription with Stripe customer ID
            subscription = await self.get_or_create_subscription(user_id)
            await self.update_subscription(
                subscription.id,
                SubscriptionUpdate(stripe_customer_id=customer.id)
            )
            
            return customer.id
            
        except Exception as e:
            logger.error(f"Error creating Stripe customer for user {user_id}: {e}")
            raise
    
    async def handle_stripe_webhook(self, event_type: str, event_data: Dict[str, Any]) -> bool:
        """Handle Stripe webhook events"""
        try:
            logger.info(f"Processing Stripe webhook: {event_type}")
            
            if event_type == "customer.subscription.created":
                await self._handle_subscription_created(event_data)
            elif event_type == "customer.subscription.updated":
                await self._handle_subscription_updated(event_data)
            elif event_type == "customer.subscription.deleted":
                await self._handle_subscription_deleted(event_data)
            elif event_type == "invoice.payment_succeeded":
                await self._handle_payment_succeeded(event_data)
            elif event_type == "invoice.payment_failed":
                await self._handle_payment_failed(event_data)
            else:
                logger.info(f"Unhandled webhook event type: {event_type}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error handling Stripe webhook {event_type}: {e}")
            return False
    
    async def _handle_subscription_created(self, subscription_data: Dict[str, Any]):
        """Handle subscription created webhook"""
        stripe_customer_id = subscription_data["customer"]
        stripe_subscription_id = subscription_data["id"]
        
        # Find user by Stripe customer ID
        result = self.supabase.table("subscriptions").select("*").eq("stripe_customer_id", stripe_customer_id).execute()
        
        if result.data:
            subscription = Subscription(**result.data[0])
            
            # Determine plan type from Stripe subscription
            plan_type = self._get_plan_type_from_stripe(subscription_data)
            
            await self.update_subscription(
                subscription.id,
                SubscriptionUpdate(
                    stripe_subscription_id=stripe_subscription_id,
                    plan_type=plan_type,
                    status=SubscriptionStatus.ACTIVE,
                    current_period_start=datetime.fromtimestamp(subscription_data["current_period_start"]),
                    current_period_end=datetime.fromtimestamp(subscription_data["current_period_end"])
                )
            )
    
    async def _handle_subscription_updated(self, subscription_data: Dict[str, Any]):
        """Handle subscription updated webhook"""
        stripe_subscription_id = subscription_data["id"]
        
        result = self.supabase.table("subscriptions").select("*").eq("stripe_subscription_id", stripe_subscription_id).execute()
        
        if result.data:
            subscription = Subscription(**result.data[0])
            plan_type = self._get_plan_type_from_stripe(subscription_data)
            
            await self.update_subscription(
                subscription.id,
                SubscriptionUpdate(
                    plan_type=plan_type,
                    status=SubscriptionStatus(subscription_data["status"]),
                    current_period_start=datetime.fromtimestamp(subscription_data["current_period_start"]),
                    current_period_end=datetime.fromtimestamp(subscription_data["current_period_end"])
                )
            )
    
    async def _handle_subscription_deleted(self, subscription_data: Dict[str, Any]):
        """Handle subscription deleted webhook"""
        stripe_subscription_id = subscription_data["id"]
        
        result = self.supabase.table("subscriptions").select("*").eq("stripe_subscription_id", stripe_subscription_id).execute()
        
        if result.data:
            subscription = Subscription(**result.data[0])
            
            await self.update_subscription(
                subscription.id,
                SubscriptionUpdate(
                    plan_type=PlanType.FREE,
                    status=SubscriptionStatus.CANCELED,
                    canceled_at=datetime.utcnow()
                )
            )
    
    async def _handle_payment_succeeded(self, invoice_data: Dict[str, Any]):
        """Handle successful payment webhook"""
        # Log successful payment
        logger.info(f"Payment succeeded for invoice: {invoice_data['id']}")
    
    async def _handle_payment_failed(self, invoice_data: Dict[str, Any]):
        """Handle failed payment webhook"""
        # Log failed payment and potentially notify user
        logger.warning(f"Payment failed for invoice: {invoice_data['id']}")
    
    def _get_plan_type_from_stripe(self, subscription_data: Dict[str, Any]) -> PlanType:
        """Extract plan type from Stripe subscription data"""
        # This would need to be customized based on your Stripe product setup
        items = subscription_data.get("items", {}).get("data", [])
        
        if items:
            price_id = items[0].get("price", {}).get("id", "")
            
            # Map Stripe price IDs to plan types
            if "professional" in price_id.lower():
                return PlanType.PROFESSIONAL
            elif "enterprise" in price_id.lower():
                return PlanType.ENTERPRISE
        
        return PlanType.FREE
