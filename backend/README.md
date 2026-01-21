# FocusQuest Backend

FastAPI backend for QR lifecycle management and journey intelligence.

## Quick Start

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Development Server

```bash
python -m backend.main
```

Server runs at: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## Project Structure

```
backend/
├── __init__.py
├── main.py                 # Application entry point
├── api/
│   ├── __init__.py
│   └── qr_api.py          # QR management endpoints
├── models/
│   ├── __init__.py
│   └── qr_lifecycle.py    # Data models and schemas
├── services/
│   ├── __init__.py
│   └── qr_service.py      # Business logic
└── storage/               # (Future) Storage backends
    ├── firestore_storage.py
    └── postgres_storage.py
```

## API Endpoints

See full documentation at `/docs` or in `docs/QR_LIFECYCLE_IMPLEMENTATION.md`

### Key Endpoints

- `POST /api/qr` - Create QR code
- `GET /api/qr` - List QR codes
- `GET /api/qr/{qr_id}` - Get QR details
- `POST /api/qr/{qr_id}/activate` - Activate QR
- `GET /api/qr/{qr_id}/analytics` - View analytics
- `GET /qr/{code}` - Public scan endpoint (redirects)

## Features

- ✅ Dynamic QR code generation
- ✅ Context-aware routing (time, history, device, location)
- ✅ QR versioning and A/B testing
- ✅ Contact intelligence and progressive profiling
- ✅ Real-time analytics
- ✅ Campaign management

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=backend
```

## Deployment

### Docker

```bash
docker build -t focusquest-api .
docker run -p 8000:8000 focusquest-api
```

### Google Cloud Run

```bash
gcloud run deploy focusquest-api \
  --source . \
  --platform managed \
  --region us-central1
```

## Configuration

Set environment variables:

```bash
# .env
API_BASE_URL=http://localhost:8000
STORAGE_BACKEND=memory  # memory, firestore, postgres
FIRESTORE_PROJECT_ID=your-project-id
DATABASE_URL=postgresql://user:pass@host/db
```

## Next Steps

1. Add storage backend (Firestore/PostgreSQL)
2. Implement authentication
3. Add geolocation service
4. Integrate with AI Copilot layer

---

For full documentation, see: `docs/QR_LIFECYCLE_IMPLEMENTATION.md`
