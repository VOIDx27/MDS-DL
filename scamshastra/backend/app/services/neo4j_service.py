"""
Neo4j graph database service — connection pooling and query execution.

Provides a singleton driver instance and a FastAPI dependency
that yields a session per request.
"""

from contextlib import contextmanager
from typing import Any, Generator

from neo4j import GraphDatabase, Driver, Session

from app.config import settings


class Neo4jService:
    """Manages the Neo4j driver lifecycle with connection pooling."""

    _driver: Driver | None = None

    @classmethod
    def get_driver(cls) -> Driver:
        if cls._driver is None:
            cls._driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password),
                max_connection_pool_size=50,
                connection_acquisition_timeout=30,
            )
        return cls._driver

    @classmethod
    def close(cls) -> None:
        if cls._driver is not None:
            cls._driver.close()
            cls._driver = None

    @classmethod
    @contextmanager
    def session(cls) -> Generator[Session, None, None]:
        driver = cls.get_driver()
        session = driver.session()
        try:
            yield session
        finally:
            session.close()

    @classmethod
    def execute_read(cls, query: str, **params: Any) -> list[dict]:
        """Run a read query and return results as list of dicts."""
        with cls.session() as session:
            result = session.run(query, **params)
            return [record.data() for record in result]

    @classmethod
    def execute_write(cls, query: str, **params: Any) -> list[dict]:
        """Run a write query and return results as list of dicts."""
        with cls.session() as session:
            result = session.run(query, **params)
            return [record.data() for record in result]

    @classmethod
    def execute_single(cls, query: str, **params: Any) -> dict | None:
        """Run a query expecting a single result row."""
        rows = cls.execute_read(query, **params)
        return rows[0] if rows else None


# ─── FastAPI Dependency ───────────────────────────────────────────────────────

def get_neo4j_session() -> Generator[Session, None, None]:
    """Yields a Neo4j session for use as a FastAPI Depends()."""
    driver = Neo4jService.get_driver()
    session = driver.session()
    try:
        yield session
    finally:
        session.close()

