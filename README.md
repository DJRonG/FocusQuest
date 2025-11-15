# FocusQuest

FocusQuest is an adaptive learning & focus webapp powered by a Weekend-Agent core. This repo contains a starter scaffold for the frontend (Next.js), backend (FastAPI), agent modules, and deployment templates for Google AI Studio (Vertex AI), Firebase Hosting, and Cloud Build.

## Quick start

1. Clone repo
2. Copy `.env.example` to `.env` and fill values
3. From `apps/backend`: `python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
4. Start backend: `uvicorn main:app --reload --port 8000`
5. From `apps/web`: `npm install && npm run dev`

## Deploy
Follow the `deploy` section and use the provided `focusquest_deploy.yaml`, `firebase.json`, and `cloudbuild.yaml` to deploy to Vertex AI + Firebase.