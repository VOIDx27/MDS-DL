# FraudGraph

**UPI Fraud Detection & Money Mule Network Mapper**

A production-grade investigative intelligence platform for detecting UPI payment fraud in India — targeting mule accounts, suspicious transaction chains, fraud rings, and account layering patterns.

## Target Users

- Cyber cell investigators
- Bank fraud analysts
- Compliance officers

## Regulatory Context

RBI fraud reporting · FIU-IND STR filing · NPCI fraud framework · PMLA compliance

---

## Project Structure

```
fraudgraph/
├── frontend/          → React 18 + TypeScript + Vite
├── backend/           → Python FastAPI
├── graph-engine/      → Neo4j schema + Cypher queries
├── stream-processor/  → Kafka + Flink event pipeline
├── simulation/        → Synthetic data generator
├── shared/            → TypeScript types, Python schemas
└── docs/              → API docs, architecture notes
```

## Quick Start

```bash
# 1. Copy env file
cp .env.example .env

# 2. Start infrastructure
docker-compose up -d

# 3. Install & run frontend
cd frontend && npm install && npm run dev

# 4. Install & run backend (without Docker)
cd backend && pip install -r requirements.txt && uvicorn main:app --reload
```

## Tech Stack

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Frontend         | React 18, TypeScript, Vite     |
| Backend          | FastAPI, Pydantic              |
| Graph DB         | Neo4j 5, APOC, GDS            |
| Streaming        | Apache Kafka, Apache Flink     |
| Cache            | Redis 7                        |
| Containerization | Docker, Docker Compose         |

## License

Proprietary — Internal Use Only
