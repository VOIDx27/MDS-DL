# MDS-DL — Malware Detection System powered by Deep Learning

A full-stack cybersecurity dashboard implementing the MDS-DL PRD.

## Stack
- **Frontend**: Vite + Vanilla JS + Chart.js
- **Backend**: Express.js REST API with simulated ML inference
- **Design**: Dark cyber theme, glassmorphism, particle animations

## Local Development

```bash
npm install

# Run both servers (frontend :3000, backend :3001)
npm run dev

# Or individually:
npm run dev:frontend   # Vite at http://localhost:3000
npm run dev:backend    # Express at http://localhost:3001
```

## Production Build & Run

```bash
npm run build          # Build Vite frontend to /dist
npm start              # Serve everything from Express on port 3001
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/analysis/analyze | Submit file for analysis |
| GET | /api/v1/analysis/:id | Get analysis result |
| POST | /api/v1/analysis/batch | Bulk analysis |
| GET | /api/v1/threats | List detections |
| GET | /api/v1/threats/stats | Dashboard statistics |
| GET | /api/v1/threats/families | Malware family taxonomy |
| GET | /api/v1/models | List deployed models |
| GET | /api/v1/models/:id/metrics | Model metrics |
| GET | /api/v1/models/drift | Drift monitoring |
| GET | /api/v1/health | Health check |

## Deploy to Render / Railway

Set the following in your hosting platform:
- **Build command**: `npm run build`
- **Start command**: `npm start`
- **Port**: `3001` (or use `PORT` env variable)
