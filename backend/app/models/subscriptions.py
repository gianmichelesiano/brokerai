"""
Subscription models for billing management
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class SubscriptionStatus(str, Enum):
    """Subscription status enumeration"""
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    UNPAID = "unpaid"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"


class PlanType(str, Enum):
    """Plan type enumeration"""
    FREE = "free"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class BillingInterval(str, Enum):
    """Billing interval enumeration"""
    MONTH = "month"
    YEAR = "year"


class SubscriptionBase(BaseModel):
    """Base subscription model"""
    user_id: str = Field(..., description="User ID from Supabase")
    stripe_customer_id: Optional[str] = Field(None, description="Stripe customer ID")
    stripe_subscription_id: Optional[str] = Field(None, description="Stripe subscription ID")
    autumn_customer_id: Optional[str] = Field(None, description="Autumn customer ID")
    plan_type: PlanType = Field(default=PlanType.FREE, description="Current plan type")
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE, description="Subscription status")
    billing_interval: Optional[BillingInterval] = Field(None, description="Billing interval")
    current_period_start: Optional[datetime] = Field(None, description="Current period start date")
    current_period_end: Optional[datetime] = Field(None, description="Current period end date")
    trial_start: Optional[datetime] = Field(None, description="Trial start date")
    trial_end: Optional[datetime] = Field(None, description="Trial end date")
    canceled_at: Optional[datetime] = Field(None, description="Cancellation date")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


class SubscriptionCreate(SubscriptionBase):
    """Create subscription model"""
    pass


class SubscriptionUpdate(BaseModel):
    """Update subscription model"""
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    autumn_customer_id: Optional[str] = None
    plan_type: Optional[PlanType] = None
    status: Optional[SubscriptionStatus] = None
    billing_interval: Optional[BillingInterval] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class Subscription(SubscriptionBase):
    """Full subscription model with database fields"""
    id: str = Field(..., description="Subscription ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class UsageBase(BaseModel):
    """Base usage tracking model"""
    user_id: str = Field(..., description="User ID")
    subscription_id: str = Field(..., description="Subscription ID")
    period_start: datetime = Field(..., description="Usage period start")
    period_end: datetime = Field(..., description="Usage period end")
    analyses_used: int = Field(default=0, description="Number of analyses used")
    companies_active: int = Field(default=0, description="Number of active companies")
    ai_analyses_used: int = Field(default=0, description="Number of AI analyses used")
    exports_generated: int = Field(default=0, description="Number of exports generated")
    api_calls_made: int = Field(default=0, description="Number of API calls made")


class UsageCreate(UsageBase):
    """Create usage model"""
    pass


class UsageUpdate(BaseModel):
    """Update usage model"""
    analyses_used: Optional[int] = None
    companies_active: Optional[int] = None
    ai_analyses_used: Optional[int] = None
    exports_generated: Optional[int] = None
    api_calls_made: Optional[int] = None


class Usage(UsageBase):
    """Full usage model with database fields"""
    id: str = Field(..., description="Usage ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class PlanLimits(BaseModel):
    """Plan limits configuration"""
    plan_type: PlanType
    monthly_analyses: int = Field(..., description="Monthly analyses limit (-1 for unlimited)")
    max_companies: int = Field(..., description="Maximum companies limit (-1 for unlimited)")
    ai_analysis: bool = Field(default=False, description="AI analysis feature enabled")
    export_data: bool = Field(default=False, description="Data export feature enabled")
    api_access: bool = Field(default=False, description="API access enabled")
    support_level: str = Field(default="email", description="Support level")
    
    @classmethod
    def get_limits(cls, plan_type: PlanType) -> "PlanLimits":
        """Get limits for a specific plan type"""
        limits_config = {
            PlanType.FREE: {
                "monthly_analyses": 5,
                "max_companies": 2,
                "ai_analysis": False,
                "export_data": False,
                "api_access": False,
                "support_level": "email"
            },
            PlanType.PROFESSIONAL: {
                "monthly_analyses": 100,
                "max_companies": 10,
                "ai_analysis": True,
                "export_data": True,
                "api_access": False,
                "support_level": "priority"
            },
            PlanType.ENTERPRISE: {
                "monthly_analyses": -1,  # unlimited
                "max_companies": -1,     # unlimited
                "ai_analysis": True,
                "export_data": True,
                "api_access": True,
                "support_level": "dedicated"
            }
        }
        
        config = limits_config.get(plan_type, limits_config[PlanType.FREE])
        return cls(plan_type=plan_type, **config)


class SubscriptionResponse(BaseModel):
    """Subscription response model"""
    subscription: Subscription
    current_usage: Optional[Usage] = None
    plan_limits: PlanLimits
    days_until_renewal: Optional[int] = None
    is_trial: bool = False
    trial_days_remaining: Optional[int] = None


class WebhookEvent(BaseModel):
    """Webhook event model"""
    id: str = Field(..., description="Event ID")
    type: str = Field(..., description="Event type")
    data: Dict[str, Any] = Field(..., description="Event data")
    created: datetime = Field(..., description="Event creation time")
    livemode: bool = Field(..., description="Live mode flag")
