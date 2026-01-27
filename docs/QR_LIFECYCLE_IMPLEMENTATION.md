# QR Lifecycle Implementation Guide

## Overview

The QR Lifecycle system provides dynamic QR code generation, context-aware routing, versioning, and comprehensive analytics for the FocusQuest platform. This implementation brings the platform updates outlined in `PLATFORM_UPDATES.md` to life.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ QR Manager   │  │ QR Scanner   │  │ Analytics    │  │
│  │ UI           │  │ Public Page  │  │ Dashboard    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     API Layer (FastAPI)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ QR CRUD      │  │ Scan Handler │  │ Analytics    │  │
│  │ Endpoints    │  │ & Redirect   │  │ Endpoints    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            QRCodeService                         │   │
│  │  - Creation & Lifecycle Management               │   │
│  │  - Context-aware Redirect Logic                  │   │
│  │  - Versioning & A/B Testing                      │   │
│  │  - Contact Intelligence                          │   │
│  │  - Analytics Aggregation                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ QR Codes     │  │ Scan Events  │  │ Contact      │  │
│  │ Storage      │  │ Log          │  │ Context      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Data Models

### QR Code States

```python
class QRState(Enum):
    CREATED = "created"      # QR created but not yet active
    ACTIVE = "active"        # Live and accepting scans
    PAUSED = "paused"        # Temporarily disabled
    EXPIRED = "expired"      # Past expiration date
    ARCHIVED = "archived"    # Permanently archived
```

### Journey States

QR codes are tied to specific journey states for intelligent routing:

- **LEAD_CAPTURE** - Initial contact acquisition
- **EVENT_CHECKIN** - Event registration and check-in
- **NURTURE** - Ongoing engagement campaigns
- **CONVERSION** - Purchase/signup flow
- **RETENTION** - Customer retention campaigns
- **REACTIVATION** - Win-back campaigns

### Event Types

Context for intelligent behavior:

- CONFERENCE
- WEBINAR
- WORKSHOP
- NETWORKING
- TRADE_SHOW
- GENERAL

---

## Core Features

### 1. Dynamic QR Code Generation

```python
# Create QR code via API
POST /api/qr
{
  "journey_state": "lead_capture",
  "event_type": "conference",
  "campaign_name": "Tech Summit 2024",
  "default_redirect_url": "https://example.com/welcome",
  "redirect_rules": [...],
  "tags": ["summit", "2024", "tech"]
}
```

**Features:**
- Unique code generation (format: `fq-xxxxxxxx`)
- Automatic image generation (PNG/SVG)
- Campaign and tag association
- Expiration date support

### 2. Context-Aware Redirect Logic

The system evaluates redirect rules in priority order:

```python
redirect_rules = [
  {
    "condition_type": "time",
    "condition_value": {"start": "09:00", "end": "17:00"},
    "redirect_url": "https://example.com/daytime",
    "priority": 10
  },
  {
    "condition_type": "history",
    "condition_value": 2,  # 2+ scans
    "redirect_url": "https://example.com/returning",
    "priority": 5
  },
  {
    "condition_type": "device",
    "condition_value": "mobile",
    "redirect_url": "https://example.com/mobile",
    "priority": 3
  }
]
```

**Rule Types:**
- **time** - Time-based routing (business hours, event times)
- **history** - Based on scan count (new vs returning)
- **event** - Event type matching
- **device** - Device type (mobile, desktop, tablet)
- **location** - Geographic routing

### 3. QR Versioning System

Support for A/B testing and campaign iterations:

```python
# Create new version
POST /api/qr/{qr_id}/versions
{
  "name": "Variant B - New Landing Page",
  "redirect_url": "https://example.com/landing-v2",
  "traffic_percentage": 50.0,
  "variant_group": "landing_page_test",
  "notes": "Testing new hero image"
}
```

**Features:**
- Version history tracking
- Traffic split allocation
- Variant grouping for A/B tests
- Version rollback capability

### 4. Contact Intelligence

Progressive profiling through repeated scans:

```python
class ContactContext:
    contact_id: str
    first_seen: datetime
    last_seen: datetime
    scan_count: int
    industry: Optional[str]
    intent_score: Optional[float]
    lifecycle_stage: Optional[str]
    enrichment_data: Dict[str, Any]
```

**Capabilities:**
- First-time vs returning visitor detection
- Scan frequency analysis
- Progressive data enrichment
- CRM sync readiness

### 5. Analytics & Tracking

Real-time analytics for each QR code:

```python
GET /api/qr/{qr_id}/analytics
{
  "total_scans": 1247,
  "unique_contacts": 843,
  "last_scanned_at": "2024-01-21T10:30:00Z",
  "contact_breakdown": {
    "total": 843,
    "returning": 127
  },
  "current_version": {
    "name": "Version 2",
    "version_number": 2
  }
}
```

---

## API Endpoints

### QR Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qr` | Create new QR code |
| GET | `/api/qr` | List QR codes (with filters) |
| GET | `/api/qr/{qr_id}` | Get QR details |
| PUT | `/api/qr/{qr_id}` | Update QR configuration |
| POST | `/api/qr/{qr_id}/activate` | Activate QR code |

### Versioning

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/qr/{qr_id}/versions` | Create new version |
| GET | `/api/qr/{qr_id}/versions` | List version history |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/qr/{qr_id}/analytics` | Get QR analytics |
| GET | `/api/campaigns/{campaign_id}/analytics` | Get campaign analytics |

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/qr/{code}` | Scan handler (redirects user) |
| GET | `/api/qr/{qr_id}/image` | Download QR image |

---

## Frontend Components

### QR Manager Interface

Located at `/qr-manager.html`

**Features:**
- Create new QR codes with journey/event configuration
- List and filter active QR codes
- View detailed analytics per QR
- Activate/pause QR codes
- Download QR images
- Copy scan URLs

**Key UI Elements:**
- QR Creation Form
- QR Code Cards Grid
- Analytics Dashboard
- Detail Modal with QR Image

---

## Usage Examples

### Create a Conference QR Code

```javascript
// Frontend call
const response = await fetch('http://localhost:8000/api/qr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaign_name: "DevCon 2024",
    journey_state: "lead_capture",
    event_type: "conference",
    default_redirect_url: "https://devcon.com/register",
    tags: ["devcon", "2024", "tech"],
    redirect_rules: [
      {
        condition_type: "time",
        condition_value: {"start": "08:00", "end": "18:00"},
        redirect_url: "https://devcon.com/live-schedule",
        priority: 10
      }
    ]
  })
});

const qrCode = await response.json();
console.log(`QR Created: ${qrCode.code}`);
```

### Process a QR Scan

When a user scans the QR code:

1. Browser navigates to: `https://focusquest.app/qr/fq-abc12345`
2. Backend receives request at `GET /qr/{code}`
3. Service evaluates redirect rules based on:
   - Current time
   - User's scan history
   - Device type
   - Location
4. User redirected to appropriate URL
5. Scan event logged for analytics

### View Campaign Analytics

```javascript
const response = await fetch('http://localhost:8000/api/campaigns/campaign-123/analytics');
const analytics = await response.json();

console.log(`Total QR Codes: ${analytics.qr_code_count}`);
console.log(`Total Scans: ${analytics.total_scans}`);
console.log(`Unique Contacts: ${analytics.unique_contacts}`);
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Backend

```bash
# Development
python -m backend.main

# Production (with Gunicorn)
gunicorn backend.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### 3. Access the Frontend

Open `qr-manager.html` in your browser or serve via:

```bash
python -m http.server 3000
```

Navigate to: `http://localhost:3000/qr-manager.html`

---

## Integration with Platform Updates

This implementation directly addresses the following items from `PLATFORM_UPDATES.md`:

### QR Contact Agent - Platform Architecture Updates

✅ **Enhanced QR Lifecycle**
- Dynamic QR codes tied to journey state
- Context-aware redirects
- QR versioning for campaigns

✅ **Contact Intelligence**
- Progressive profiling via repeated scans
- Scan history tracking
- CRM sync readiness

### Future Integration Points

🔄 **AI-Augmented Flyer Creation** (Planned)
- Auto-generated copy variants
- Smart CTA placement recommendations

🔄 **AI Copilot Integration** (Planned)
- Journey performance monitoring
- Automatic optimization recommendations
- Friction detection on QR scan patterns

---

## Storage Backends

The current implementation uses in-memory storage. For production:

### Firestore Integration

```python
# backend/storage/firestore_storage.py
from google.cloud import firestore

class FirestoreStorage:
    def __init__(self):
        self.db = firestore.Client()
        self.qr_collection = self.db.collection('qr_codes')
        self.events_collection = self.db.collection('scan_events')

    def save_qr_code(self, qr_code: QRCode):
        doc_ref = self.qr_collection.document(qr_code.qr_id)
        doc_ref.set(qr_code.dict())

    def get_qr_code(self, qr_id: str) -> Optional[QRCode]:
        doc = self.qr_collection.document(qr_id).get()
        return QRCode(**doc.to_dict()) if doc.exists else None

    # ... additional methods
```

### PostgreSQL Integration

```python
# backend/storage/postgres_storage.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Define SQLAlchemy models
# Implement storage interface
```

---

## Testing

### Unit Tests

```bash
pytest backend/tests/test_qr_service.py
```

### Integration Tests

```bash
pytest backend/tests/test_qr_api.py
```

### Manual Testing

1. Start backend: `python -m backend.main`
2. Open QR Manager: `http://localhost:3000/qr-manager.html`
3. Create a test QR code
4. Activate it
5. Test scan URL: `http://localhost:8000/qr/fq-xxxxxxxx`
6. View analytics

---

## Deployment

### Vercel (Frontend)

Already configured in `vercel.json`. Deploy frontend:

```bash
vercel deploy
```

### Google Cloud Run (Backend)

1. Build container:
```bash
docker build -t gcr.io/PROJECT_ID/focusquest-api .
```

2. Push to GCR:
```bash
docker push gcr.io/PROJECT_ID/focusquest-api
```

3. Deploy:
```bash
gcloud run deploy focusquest-api \
  --image gcr.io/PROJECT_ID/focusquest-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables

```bash
# Production
API_BASE_URL=https://api.focusquest.com
FIRESTORE_PROJECT_ID=your-project
SENTRY_DSN=your-sentry-dsn

# Development
API_BASE_URL=http://localhost:8000
```

---

## Next Steps

1. **Storage Integration** - Connect Firestore or PostgreSQL
2. **Authentication** - Add API key or OAuth protection
3. **Geolocation** - Integrate IP geolocation service
4. **Contact Enrichment** - Add Clearbit/ZoomInfo integration
5. **AI Copilot** - Connect journey intelligence layer
6. **Flyer Generator** - Build AI-powered design tool
7. **CRM Sync** - Add HubSpot/Salesforce connectors

---

## Support & Documentation

- **Main Docs**: `docs/PLATFORM_UPDATES.md`
- **API Reference**: OpenAPI schema at `/docs` when running backend
- **GitHub**: [FocusQuest Repository](https://github.com/DJRonG/FocusQuest)

**Last Updated**: January 21, 2026
