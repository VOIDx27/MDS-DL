"""
FraudGraph — FastAPI Backend Entry Point.

Registers all routers and configures CORS for the frontend.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import entities, transactions, graph, alerts, compliance
from app.services.neo4j_service import Neo4jService
from app.services.db_service import engine, Base
from scoring.router import router as scoring_router


# ─── Lifespan (startup / shutdown) ────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify Neo4j connectivity
    try:
        Neo4jService.get_driver().verify_connectivity()
        print("✓ Neo4j connection established")
    except Exception as e:
        print(f"⚠ Neo4j not reachable at startup: {e}")
        
    # Postgres setup
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ PostgreSQL tables initialized")
    except Exception as e:
        print(f"⚠ PostgreSQL error at startup: {e}")
        
    yield
    # Shutdown
    consumer_task.cancel()
    Neo4jService.close()
    print("✓ Neo4j driver closed")


app = FastAPI(
    title="FraudGraph API",
    description="UPI Fraud Detection & Money Mule Network Mapper",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────
app.include_router(entities.router)
app.include_router(transactions.router)
app.include_router(graph.router)
app.include_router(alerts.router)
app.include_router(scoring_router)
app.include_router(compliance.router)

@app.get("/")
def read_root():
    return {"message": "FraudGraph Backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}
