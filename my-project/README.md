# AirAware — Project Overview

This README is a single, shareable explainer for the AirAware project. Use it when someone asks you to explain the project: what it does, how it’s organized, tools used, how to run locally, endpoints, troubleshooting, and next steps.

## Elevator pitch
AirAware is a small full‑stack demo that shows air‑quality (AQI) data and an AI chatbot. It has:

- A Next.js React frontend (UX, map, widgets).
- A FastAPI backend that provides AQI endpoints, scheduled fetches, user auth stubs and a simple chatbot handler.
- A separate FastAPI "chatbot" service that uses a Groq/OpenAI-compatible client to call LLMs (with local fallback memory) and exposes a chat REST API.
- Some data-fetching code that integrates WAQI/OpenAQ-like APIs (demo token used), plus optional MongoDB storage.

There are batch scripts at the repo root to help start components locally.

---

## High-level architecture (textual)

Frontend (Next.js) <--> Backend API (FastAPI on 8000) <--> DB / External AQI APIs  
Frontend (Next.js) <--> Chatbot API (FastAPI on 8001) <--> Groq/OpenAI model API

- Frontend serves UI, map, widgets, and chat widget. Default frontend dev port: 3000.
- Backend (AQI) exposes endpoints for AQI, forecast stubs, feedback, auth, and a simple internal chatbot handler at `/api/messages`.
- Chatbot service is a separate FastAPI app that talks to Groq/OpenAI client using `GROQ_API_KEY` and provides a chat REST API at `/api/messages` and `/health`.
- Ports used in this workspace:
  - Frontend: 3000
  - Backend AQI: 8000
  - Chatbot service: 8001 (used locally to avoid conflicts)

Diagram (simple):
Frontend (3000)
  - /api/aqi -> Backend (8000)
  - ChatWidget -> Chatbot (8001) or `NEXT_PUBLIC_CHATBOT_URL` if set
Backend (8000)
  - /api/aqi, /api/aqi/india, /get_aqi, /submit_feedback, /api/messages (local bot)
Chatbot (8001)
  - /api/messages (LLM-based), /health, /api/messages GET (history)

---

## Where to find main code (paths)

- Frontend (Next.js + React + TSX): `AQI/front/`
  - `AQI/front/package.json`
  - App entry: `AQI/front/app/layout.tsx`, `AQI/front/app/page.tsx`
  - Components: `AQI/front/components/ChatWidget.tsx`, `AQI/front/components/LocationWidget.tsx`
  - UI primitives: `AQI/front/components/ui/*`
  - Contexts: `AQI/front/contexts/*`
  - Lib: `AQI/front/lib/useGeolocation.ts`
- Backend (AQI API): `AQI/backend/main.py`
- Chatbot service (LLM gateway): `AQI/chatbot/main.py` and `AQI/chatbot/.env`
- Root scripts: `start_airware.bat`, `start_backend.bat`, `start_frontend.bat`

---

## Tools, libraries & services used

Backend (Python):
- FastAPI, uvicorn, pymongo, requests, apscheduler, passlib, PyJWT, python-dotenv, openai (or Groq wrapper), pydantic

Chatbot service (Python):
- FastAPI, uvicorn, python-dotenv, openai (Groq client), logging

Frontend (TypeScript / React / Next.js):
- Next.js, React, Tailwind, framer-motion, leaflet/react-leaflet, lucide-react, TypeScript

APIs used:
- WAQI (World Air Quality Index) demo token in backend
- BigDataCloud reverse geocoding in frontend
- Optionally OpenAQ/OpenWeather if env keys are provided

---

## Important environment variables

Backend:
- `MONGO_URI` (default: `mongodb://localhost:27017`)
- `OPENAQ_API_KEY` (optional)
- `OPENWEATHER_API_KEY` (optional)
- `SECRET_KEY` (JWT secret; default in code for testing)

Chatbot:
- `GROQ_API_KEY` (required by `AQI/chatbot/main.py`)
- `GROQ_MODEL` (optional override)
- `GROQ_MODEL_CANDIDATES` (optional)

Frontend:
- `NEXT_PUBLIC_CHATBOT_URL` (if not set frontend defaults to `http://localhost:8001`)

---

## Key endpoints & behavior

Backend (AQI - `AQI/backend/main.py`)
- `GET /` → {"message": "AirAware API is running"}
- `GET /api/aqi` → Get AQI by `location` or `lat`/`lng`.
- `GET /api/aqi/india` → sample Indian cities AQI.
- `POST /submit_feedback` → store feedback or log when DB not available.
Note: Built-in auth endpoints and the optional Supabase-based auth integration have been removed from this workspace. The frontend no longer includes `/auth` routes. If you need authentication, integrate an external auth provider or reintroduce auth endpoints and client code.
- `POST /api/messages` → local, rule-based chatbot logic.

Chatbot service (`AQI/chatbot/main.py`)
- `GET /` — welcome
- `GET /api/messages` — list message history
- `POST /api/messages` — LLM call flow: build system prompt + history, try candidates, runtime fallback, local fallback
- `GET /health` — probe model connectivity

Frontend contracts (examples):
- Frontend gets AQI from backend and posts chat messages to the chatbot service.
- Map fetches `GET /api/aqi/india` and falls back to mock data when necessary.

---

## How to run (developer, PowerShell)

Prereqs: Python 3.12, Node.js, MongoDB (optional), internet.

1. Frontend

```powershell
cd D:\airware\my-project\AQI\front
npm install
npm run dev
# opens at http://localhost:3000
```

2. Backend (AQI API)

```powershell
cd D:\airware\my-project\AQI\backend
& "D:\airware\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
```

3. Chatbot service

```powershell
cd D:\airware\my-project\AQI\chatbot
# ensure .env contains GROQ_API_KEY
& "D:\airware\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8001 --app-dir "D:\airware\my-project\AQI\chatbot"
```

Or use `start_airware.bat` if it orchestrates services.

---

## Troubleshooting (quick)

- Failed to fetch: check CORS, check service running, check ports and `NEXT_PUBLIC_CHATBOT_URL`.
- Chatbot startup error: missing `GROQ_API_KEY` in `.env`.
- `Error loading ASGI app`: ensure `--app-dir` or working directory contains `main.py`.
- Port already in use: use a different port or stop the process using it.
- MongoDB not available: backend logs and falls back to mock data.

---

## Suggested improvements

- Consolidate chat endpoints (use chatbot service only).
- Add docker-compose for dev with MongoDB, frontend, backend, chatbot.
- Persist chat memory to DB for long-term storage.
- Add tests, CI, and secure secret management.

---

## Quick FAQ
- Chat logic location: `AQI/chatbot/main.py` (LLM calls). Backend has a simple local fallback too.
- Which chat service: chatbot on port 8001 by default — set `NEXT_PUBLIC_CHATBOT_URL` if different.
- Run locally: run frontend, backend, and chatbot as separate services (or use batch scripts).

---

If you want, I can also create a `docker-compose.yml` to run all services and MongoDB locally, or create a shorter `README-short.md` for onboarding. Let me know which you prefer.

---

<!-- Authentication removed: previous Supabase quick setup and auth behavior instructions were removed. -->
