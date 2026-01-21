"""
FocusQuest Backend - Main Application Entry Point
"""

from backend.api.qr_api import app

# Export the FastAPI app for deployment
__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn

    # Run development server
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
