"""
QR Code API Endpoints
FastAPI routes for QR lifecycle management
"""

from fastapi import FastAPI, HTTPException, Request, Response, Query
from fastapi.responses import StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import io

from backend.models.qr_lifecycle import (
    QRCode, QRState, JourneyState, QRCreateRequest,
    QRUpdateRequest, QRVersionCreateRequest, EventType
)
from backend.services.qr_service import QRCodeService


# Initialize FastAPI app
app = FastAPI(
    title="FocusQuest QR API",
    description="QR Code lifecycle management with journey intelligence",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize QR service
qr_service = QRCodeService()


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "qr-api"}


# QR Code Management Endpoints
@app.post("/api/qr", response_model=QRCode)
async def create_qr_code(request: QRCreateRequest):
    """
    Create a new QR code with lifecycle tracking

    Args:
        request: QR creation request

    Returns:
        Created QR code
    """
    try:
        qr_code = qr_service.create_qr_code(request)
        return qr_code
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/qr/{qr_id}", response_model=QRCode)
async def get_qr_code(qr_id: str):
    """
    Get QR code by ID

    Args:
        qr_id: QR code identifier

    Returns:
        QR code details
    """
    try:
        qr_code = qr_service._get_qr_code(qr_id)
        return qr_code
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/qr", response_model=List[QRCode])
async def list_qr_codes(
    campaign_id: Optional[str] = Query(None),
    state: Optional[QRState] = Query(None),
    journey_state: Optional[JourneyState] = Query(None),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    List QR codes with optional filters

    Args:
        campaign_id: Filter by campaign ID
        state: Filter by QR state
        journey_state: Filter by journey state
        limit: Maximum number of results

    Returns:
        List of QR codes
    """
    qr_codes = qr_service.list_qr_codes(
        campaign_id=campaign_id,
        state=state,
        journey_state=journey_state,
        limit=limit
    )
    return qr_codes


@app.put("/api/qr/{qr_id}", response_model=QRCode)
async def update_qr_code(qr_id: str, request: QRUpdateRequest):
    """
    Update QR code configuration

    Args:
        qr_id: QR code identifier
        request: Update request

    Returns:
        Updated QR code
    """
    try:
        qr_code = qr_service.update_qr_code(qr_id, request)
        return qr_code
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/qr/{qr_id}/activate", response_model=QRCode)
async def activate_qr_code(qr_id: str):
    """
    Activate a QR code

    Args:
        qr_id: QR code identifier

    Returns:
        Activated QR code
    """
    try:
        qr_code = qr_service.activate_qr_code(qr_id)
        return qr_code
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/qr/{qr_id}/versions", response_model=QRCode)
async def create_qr_version(qr_id: str, request: QRVersionCreateRequest):
    """
    Create a new version of a QR code

    Args:
        qr_id: QR code identifier
        request: Version creation request

    Returns:
        Updated QR code with new version
    """
    try:
        qr_code = qr_service.create_version(qr_id, request)
        return qr_code
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# QR Code Image Generation
@app.get("/api/qr/{qr_id}/image")
async def get_qr_image(
    qr_id: str,
    size: int = Query(300, ge=100, le=1000),
    format: str = Query("PNG", regex="^(PNG|SVG)$")
):
    """
    Generate QR code image

    Args:
        qr_id: QR code identifier
        size: Image size in pixels
        format: Image format (PNG or SVG)

    Returns:
        QR code image
    """
    try:
        image_bytes = qr_service.generate_qr_image(qr_id, size, format)

        media_type = "image/png" if format == "PNG" else "image/svg+xml"

        return StreamingResponse(
            io.BytesIO(image_bytes),
            media_type=media_type,
            headers={
                "Content-Disposition": f"inline; filename=qr-{qr_id}.{format.lower()}"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Analytics Endpoints
@app.get("/api/qr/{qr_id}/analytics")
async def get_qr_analytics(qr_id: str):
    """
    Get analytics for a QR code

    Args:
        qr_id: QR code identifier

    Returns:
        Analytics data
    """
    try:
        analytics = qr_service.get_analytics(qr_id)
        return analytics
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Public Scan Endpoint
@app.get("/qr/{code}")
async def scan_qr_code(code: str, request: Request):
    """
    Public endpoint for QR code scanning and redirect

    This is the URL embedded in QR codes. It processes the scan,
    applies context-aware routing rules, and redirects the user.

    Args:
        code: QR code value
        request: HTTP request with headers and client info

    Returns:
        Redirect to appropriate URL
    """
    try:
        # Extract context from request
        user_agent = request.headers.get("user-agent")
        client_host = request.client.host if request.client else None
        referrer = request.headers.get("referer")

        # TODO: Extract contact_id from session/cookie if available
        contact_id = request.cookies.get("fq_contact_id")

        # TODO: Get geolocation from IP
        location = None

        # Determine device type
        device_type = "mobile" if user_agent and "mobile" in user_agent.lower() else "desktop"

        # Process scan
        redirect_url, scan_event = qr_service.process_scan(
            code=code,
            contact_id=contact_id,
            user_agent=user_agent,
            ip_address=client_host,
            location=location,
            referrer=referrer,
            device_type=device_type,
            session_id=request.cookies.get("fq_session_id")
        )

        # Redirect user
        return RedirectResponse(url=redirect_url, status_code=302)

    except ValueError as e:
        # QR not found or inactive
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan processing error: {str(e)}")


# Campaign Management Endpoints
@app.get("/api/campaigns/{campaign_id}/qr")
async def get_campaign_qr_codes(campaign_id: str):
    """
    Get all QR codes for a campaign

    Args:
        campaign_id: Campaign identifier

    Returns:
        List of QR codes in campaign
    """
    qr_codes = qr_service.list_qr_codes(campaign_id=campaign_id)
    return qr_codes


@app.get("/api/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics(campaign_id: str):
    """
    Get aggregated analytics for all QR codes in a campaign

    Args:
        campaign_id: Campaign identifier

    Returns:
        Campaign-level analytics
    """
    qr_codes = qr_service.list_qr_codes(campaign_id=campaign_id)

    total_scans = sum(qr.total_scans for qr in qr_codes)
    total_unique_contacts = sum(qr.unique_contacts for qr in qr_codes)

    return {
        "campaign_id": campaign_id,
        "qr_code_count": len(qr_codes),
        "total_scans": total_scans,
        "unique_contacts": total_unique_contacts,
        "qr_codes": [
            {
                "qr_id": qr.qr_id,
                "code": qr.code,
                "state": qr.state,
                "scans": qr.total_scans,
                "unique_contacts": qr.unique_contacts
            }
            for qr in qr_codes
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
