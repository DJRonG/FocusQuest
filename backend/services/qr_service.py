"""
QR Code Service
Core business logic for QR lifecycle management, generation, and tracking
"""

import qrcode
import io
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from uuid import uuid4

from backend.models.qr_lifecycle import (
    QRCode, QRState, JourneyState, QRVersion, QRScanEvent,
    ContactContext, RedirectRule, QRCreateRequest, QRUpdateRequest,
    QRVersionCreateRequest, EventType
)


class QRCodeService:
    """Service for managing QR code lifecycle"""

    def __init__(self, storage_backend=None):
        """
        Initialize QR service with optional storage backend

        Args:
            storage_backend: Storage implementation (Firestore, PostgreSQL, etc.)
        """
        self.storage = storage_backend
        self._qr_cache: Dict[str, QRCode] = {}  # In-memory cache

    def create_qr_code(self, request: QRCreateRequest) -> QRCode:
        """
        Create a new QR code with lifecycle tracking

        Args:
            request: QR creation request

        Returns:
            Created QRCode instance
        """
        # Generate unique code
        qr_id = str(uuid4())
        code = f"fq-{qr_id[:8]}"

        # Create initial version
        initial_version = QRVersion(
            name=request.version_name,
            version_number=1,
            notes="Initial version"
        )

        # Build QR code entity
        qr_code = QRCode(
            qr_id=qr_id,
            code=code,
            state=QRState.CREATED,
            journey_state=request.journey_state,
            event_type=request.event_type,
            campaign_id=request.campaign_id,
            campaign_name=request.campaign_name,
            default_redirect_url=request.default_redirect_url,
            redirect_rules=request.redirect_rules,
            current_version=initial_version,
            version_history=[initial_version],
            expires_at=request.expires_at,
            tags=request.tags,
            metadata=request.metadata
        )

        # Store
        self._store_qr_code(qr_code)

        return qr_code

    def activate_qr_code(self, qr_id: str) -> QRCode:
        """
        Activate a QR code, making it live for scanning

        Args:
            qr_id: QR code identifier

        Returns:
            Updated QRCode instance
        """
        qr_code = self._get_qr_code(qr_id)

        if qr_code.state != QRState.CREATED and qr_code.state != QRState.PAUSED:
            raise ValueError(f"Cannot activate QR in state: {qr_code.state}")

        qr_code.state = QRState.ACTIVE
        qr_code.activated_at = datetime.utcnow()

        self._store_qr_code(qr_code)
        return qr_code

    def update_qr_code(self, qr_id: str, request: QRUpdateRequest) -> QRCode:
        """
        Update QR code configuration

        Args:
            qr_id: QR code identifier
            request: Update request with fields to change

        Returns:
            Updated QRCode instance
        """
        qr_code = self._get_qr_code(qr_id)

        # Update fields if provided
        if request.state is not None:
            qr_code.state = request.state
        if request.journey_state is not None:
            qr_code.journey_state = request.journey_state
        if request.default_redirect_url is not None:
            qr_code.default_redirect_url = request.default_redirect_url
        if request.redirect_rules is not None:
            qr_code.redirect_rules = request.redirect_rules
        if request.expires_at is not None:
            qr_code.expires_at = request.expires_at
        if request.tags is not None:
            qr_code.tags = request.tags
        if request.metadata is not None:
            qr_code.metadata.update(request.metadata)

        self._store_qr_code(qr_code)
        return qr_code

    def create_version(self, qr_id: str, request: QRVersionCreateRequest) -> QRCode:
        """
        Create a new version of a QR code for A/B testing or campaign iterations

        Args:
            qr_id: QR code identifier
            request: Version creation request

        Returns:
            Updated QRCode with new version
        """
        qr_code = self._get_qr_code(qr_id)

        # Create new version
        new_version_number = qr_code.current_version.version_number + 1
        new_version = QRVersion(
            version_number=new_version_number,
            name=request.name,
            traffic_percentage=request.traffic_percentage,
            variant_group=request.variant_group,
            notes=request.notes
        )

        # Archive current version if making the new one active
        if request.traffic_percentage > 0:
            qr_code.current_version.is_active = False

        # Add to history and set as current
        qr_code.version_history.append(new_version)
        qr_code.current_version = new_version

        # Update redirect rules if provided
        if request.redirect_rules is not None:
            qr_code.redirect_rules = request.redirect_rules
        if request.redirect_url is not None:
            qr_code.default_redirect_url = request.redirect_url

        self._store_qr_code(qr_code)
        return qr_code

    def process_scan(
        self,
        code: str,
        contact_id: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        location: Optional[Dict[str, Any]] = None,
        referrer: Optional[str] = None,
        device_type: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> Tuple[str, QRScanEvent]:
        """
        Process a QR code scan and determine redirect URL

        Args:
            code: QR code value scanned
            contact_id: Optional contact identifier
            user_agent: Browser user agent
            ip_address: Client IP address
            location: Geolocation data
            referrer: Referrer URL
            device_type: Type of device (mobile, desktop, tablet)
            session_id: Session identifier

        Returns:
            Tuple of (redirect_url, scan_event)
        """
        # Find QR code
        qr_code = self._get_qr_code_by_code(code)

        if qr_code is None:
            raise ValueError(f"QR code not found: {code}")

        # Check if QR is active
        if qr_code.state != QRState.ACTIVE:
            raise ValueError(f"QR code is not active: {qr_code.state}")

        # Check expiration
        if qr_code.expires_at and datetime.utcnow() > qr_code.expires_at:
            qr_code.state = QRState.EXPIRED
            self._store_qr_code(qr_code)
            raise ValueError("QR code has expired")

        # Determine redirect URL using context-aware rules
        redirect_url, matched_rule = self._evaluate_redirect_rules(
            qr_code, contact_id, user_agent, location
        )

        # Update contact context
        if contact_id:
            self._update_contact_context(qr_code, contact_id)

        # Update analytics
        qr_code.total_scans += 1
        qr_code.last_scanned_at = datetime.utcnow()
        if contact_id and contact_id not in qr_code.contact_contexts:
            qr_code.unique_contacts += 1

        self._store_qr_code(qr_code)

        # Create scan event
        scan_event = QRScanEvent(
            qr_id=qr_code.qr_id,
            contact_id=contact_id,
            user_agent=user_agent,
            ip_address=ip_address,
            location=location,
            referrer=referrer,
            redirect_url=redirect_url,
            rule_matched=matched_rule,
            device_type=device_type,
            session_id=session_id
        )

        self._store_scan_event(scan_event)

        return redirect_url, scan_event

    def _evaluate_redirect_rules(
        self,
        qr_code: QRCode,
        contact_id: Optional[str],
        user_agent: Optional[str],
        location: Optional[Dict[str, Any]]
    ) -> Tuple[str, Optional[str]]:
        """
        Evaluate redirect rules in priority order

        Returns:
            Tuple of (redirect_url, matched_rule_description)
        """
        # Sort rules by priority (higher first)
        sorted_rules = sorted(qr_code.redirect_rules, key=lambda r: r.priority, reverse=True)

        now = datetime.utcnow()
        contact_context = qr_code.contact_contexts.get(contact_id) if contact_id else None

        for rule in sorted_rules:
            if rule.condition_type == "time":
                # Time-based routing
                if self._check_time_condition(rule.condition_value, now):
                    return rule.redirect_url, f"time:{rule.condition_value}"

            elif rule.condition_type == "history" and contact_context:
                # History-based routing (returning visitor)
                if contact_context.scan_count >= rule.condition_value:
                    return rule.redirect_url, f"history:scan_count>={rule.condition_value}"

            elif rule.condition_type == "event":
                # Event type routing
                if rule.condition_value == qr_code.event_type.value:
                    return rule.redirect_url, f"event:{rule.condition_value}"

            elif rule.condition_type == "device" and user_agent:
                # Device type routing
                if rule.condition_value.lower() in user_agent.lower():
                    return rule.redirect_url, f"device:{rule.condition_value}"

            elif rule.condition_type == "location" and location:
                # Location-based routing
                if self._check_location_condition(rule.condition_value, location):
                    return rule.redirect_url, f"location:{rule.condition_value}"

        # No rules matched, use default
        return qr_code.default_redirect_url, None

    def _check_time_condition(self, condition: Any, now: datetime) -> bool:
        """Check if time-based condition is met"""
        if isinstance(condition, dict):
            # Support time ranges like {"start": "09:00", "end": "17:00"}
            if "start" in condition and "end" in condition:
                current_time = now.strftime("%H:%M")
                return condition["start"] <= current_time <= condition["end"]
        return False

    def _check_location_condition(self, condition: Any, location: Dict[str, Any]) -> bool:
        """Check if location-based condition is met"""
        if isinstance(condition, dict):
            # Support location matching like {"country": "US", "region": "CA"}
            for key, value in condition.items():
                if location.get(key) != value:
                    return False
            return True
        return False

    def _update_contact_context(self, qr_code: QRCode, contact_id: str):
        """Update or create contact context"""
        if contact_id not in qr_code.contact_contexts:
            qr_code.contact_contexts[contact_id] = ContactContext(
                contact_id=contact_id,
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow(),
                scan_count=1
            )
        else:
            context = qr_code.contact_contexts[contact_id]
            context.last_seen = datetime.utcnow()
            context.scan_count += 1

    def generate_qr_image(
        self,
        qr_id: str,
        size: int = 300,
        format: str = "PNG"
    ) -> bytes:
        """
        Generate QR code image

        Args:
            qr_id: QR code identifier
            size: Image size in pixels
            format: Image format (PNG, SVG)

        Returns:
            Image bytes
        """
        qr_code = self._get_qr_code(qr_id)

        # Generate scan URL
        scan_url = f"https://focusquest.app/qr/{qr_code.code}"

        # Create QR image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(scan_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to bytes
        img_buffer = io.BytesIO()
        img.save(img_buffer, format=format)
        img_buffer.seek(0)

        return img_buffer.getvalue()

    def get_analytics(self, qr_id: str) -> Dict[str, Any]:
        """
        Get analytics data for a QR code

        Args:
            qr_id: QR code identifier

        Returns:
            Analytics dictionary
        """
        qr_code = self._get_qr_code(qr_id)

        return {
            "qr_id": qr_code.qr_id,
            "code": qr_code.code,
            "state": qr_code.state,
            "journey_state": qr_code.journey_state,
            "total_scans": qr_code.total_scans,
            "unique_contacts": qr_code.unique_contacts,
            "last_scanned_at": qr_code.last_scanned_at,
            "created_at": qr_code.created_at,
            "activated_at": qr_code.activated_at,
            "campaign_name": qr_code.campaign_name,
            "current_version": {
                "name": qr_code.current_version.name,
                "version_number": qr_code.current_version.version_number
            },
            "contact_breakdown": {
                "total": len(qr_code.contact_contexts),
                "returning": sum(1 for c in qr_code.contact_contexts.values() if c.scan_count > 1)
            }
        }

    # Storage abstraction methods
    def _store_qr_code(self, qr_code: QRCode):
        """Store QR code to backend"""
        self._qr_cache[qr_code.qr_id] = qr_code
        if self.storage:
            self.storage.save_qr_code(qr_code)

    def _get_qr_code(self, qr_id: str) -> QRCode:
        """Retrieve QR code by ID"""
        if qr_id in self._qr_cache:
            return self._qr_cache[qr_id]
        if self.storage:
            qr_code = self.storage.get_qr_code(qr_id)
            if qr_code:
                self._qr_cache[qr_id] = qr_code
                return qr_code
        raise ValueError(f"QR code not found: {qr_id}")

    def _get_qr_code_by_code(self, code: str) -> Optional[QRCode]:
        """Retrieve QR code by code value"""
        # Check cache
        for qr in self._qr_cache.values():
            if qr.code == code:
                return qr
        # Check storage
        if self.storage:
            return self.storage.get_qr_code_by_code(code)
        return None

    def _store_scan_event(self, event: QRScanEvent):
        """Store scan event"""
        if self.storage:
            self.storage.save_scan_event(event)

    def list_qr_codes(
        self,
        campaign_id: Optional[str] = None,
        state: Optional[QRState] = None,
        journey_state: Optional[JourneyState] = None,
        limit: int = 100
    ) -> List[QRCode]:
        """
        List QR codes with optional filters

        Args:
            campaign_id: Filter by campaign
            state: Filter by QR state
            journey_state: Filter by journey state
            limit: Maximum results

        Returns:
            List of QRCode instances
        """
        if self.storage:
            return self.storage.list_qr_codes(campaign_id, state, journey_state, limit)

        # In-memory filtering
        results = list(self._qr_cache.values())

        if campaign_id:
            results = [qr for qr in results if qr.campaign_id == campaign_id]
        if state:
            results = [qr for qr in results if qr.state == state]
        if journey_state:
            results = [qr for qr in results if qr.journey_state == journey_state]

        return results[:limit]
