"""
QR Lifecycle Data Models
Defines the state machine and data structures for dynamic QR codes
"""

from enum import Enum
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from uuid import uuid4


class QRState(str, Enum):
    """QR code lifecycle states"""
    CREATED = "created"
    ACTIVE = "active"
    PAUSED = "paused"
    EXPIRED = "expired"
    ARCHIVED = "archived"


class JourneyState(str, Enum):
    """Journey states that QR codes can be tied to"""
    LEAD_CAPTURE = "lead_capture"
    EVENT_CHECKIN = "event_checkin"
    NURTURE = "nurture"
    CONVERSION = "conversion"
    RETENTION = "retention"
    REACTIVATION = "reactivation"


class EventType(str, Enum):
    """Types of events for context-aware redirects"""
    CONFERENCE = "conference"
    WEBINAR = "webinar"
    WORKSHOP = "workshop"
    NETWORKING = "networking"
    TRADE_SHOW = "trade_show"
    GENERAL = "general"


class RedirectRule(BaseModel):
    """Rules for context-aware redirects"""
    condition_type: str = Field(..., description="Type of condition (time, history, event)")
    condition_value: Any = Field(..., description="Value to match against")
    redirect_url: str = Field(..., description="URL to redirect to when condition matches")
    priority: int = Field(default=0, description="Priority for rule evaluation (higher = first)")


class QRVersion(BaseModel):
    """Version tracking for campaigns and experiments"""
    version_id: str = Field(default_factory=lambda: str(uuid4()))
    version_number: int = Field(default=1)
    name: str = Field(..., description="Version name or identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
    notes: Optional[str] = Field(None, description="Version notes or changelog")

    # A/B testing fields
    traffic_percentage: float = Field(default=100.0, description="Percentage of traffic to route here")
    variant_group: Optional[str] = Field(None, description="A/B test variant group")


class ContactContext(BaseModel):
    """Context information about the contact"""
    contact_id: Optional[str] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    scan_count: int = 0
    industry: Optional[str] = None
    intent_score: Optional[float] = None
    lifecycle_stage: Optional[str] = None
    enrichment_data: Dict[str, Any] = Field(default_factory=dict)


class QRCode(BaseModel):
    """Main QR code entity with lifecycle management"""
    qr_id: str = Field(default_factory=lambda: str(uuid4()))
    code: str = Field(..., description="The actual QR code string/data")

    # State management
    state: QRState = Field(default=QRState.CREATED)
    journey_state: JourneyState = Field(..., description="Current journey state")

    # Event and campaign context
    event_type: EventType = Field(default=EventType.GENERAL)
    campaign_id: Optional[str] = Field(None, description="Associated campaign ID")
    campaign_name: Optional[str] = Field(None, description="Campaign name for reporting")

    # Versioning
    current_version: QRVersion
    version_history: List[QRVersion] = Field(default_factory=list)

    # Redirect configuration
    default_redirect_url: str = Field(..., description="Default URL when no rules match")
    redirect_rules: List[RedirectRule] = Field(default_factory=list)

    # Analytics and tracking
    total_scans: int = Field(default=0)
    unique_contacts: int = Field(default=0)
    last_scanned_at: Optional[datetime] = None

    # Contact intelligence
    contact_contexts: Dict[str, ContactContext] = Field(default_factory=dict)

    # Lifecycle timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None

    # Metadata
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        use_enum_values = True


class QRScanEvent(BaseModel):
    """Event logged when a QR code is scanned"""
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    qr_id: str
    scanned_at: datetime = Field(default_factory=datetime.utcnow)

    # Context at scan time
    contact_id: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    referrer: Optional[str] = None

    # Redirect information
    redirect_url: str
    rule_matched: Optional[str] = None

    # Device and session
    device_type: Optional[str] = None
    session_id: Optional[str] = None


class QRCreateRequest(BaseModel):
    """Request model for creating a new QR code"""
    journey_state: JourneyState
    event_type: EventType = EventType.GENERAL
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    default_redirect_url: str
    redirect_rules: List[RedirectRule] = Field(default_factory=list)
    version_name: str = "Initial Version"
    expires_at: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class QRUpdateRequest(BaseModel):
    """Request model for updating an existing QR code"""
    state: Optional[QRState] = None
    journey_state: Optional[JourneyState] = None
    default_redirect_url: Optional[str] = None
    redirect_rules: Optional[List[RedirectRule]] = None
    expires_at: Optional[datetime] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class QRVersionCreateRequest(BaseModel):
    """Request model for creating a new QR version"""
    name: str
    redirect_url: Optional[str] = None
    redirect_rules: Optional[List[RedirectRule]] = None
    traffic_percentage: float = 100.0
    variant_group: Optional[str] = None
    notes: Optional[str] = None
