"""
Application configuration — reads from environment variables.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "fraudgraphpassword"

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Postgres
    database_url: str = "postgresql://fraudgraph:fraudgraphpassword@localhost:5432/str_db"

    # CORS
    backend_cors_origins: str = "http://localhost:5173"

    # Security
    jwt_secret: str = "super_secret_key_change_in_production"
    
    # LLM
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
