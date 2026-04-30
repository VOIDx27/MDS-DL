"""
Pydantic schemas for UPI transaction entities.
"""

from pydantic import BaseModel


class TransactionBase(BaseModel):
    """Base transaction schema — business logic TBD."""
    pass


class EntityBase(BaseModel):
    """Base entity schema — business logic TBD."""
    pass


class AlertBase(BaseModel):
    """Base alert/case schema — business logic TBD."""
    pass

