from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class TicketCreate(BaseModel):
    customer_name: str = Field(min_length=2)
    customer_email: EmailStr
    subject: str = Field(min_length=3)
    description: str = Field(min_length=5)


class NoteResponse(BaseModel):
    id: int
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True


class TicketUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class TicketListResponse(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: EmailStr
    subject: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TicketDetailResponse(TicketListResponse):
    description: str
    updated_at: datetime
    notes: List[NoteResponse] = []

    class Config:
        from_attributes = True