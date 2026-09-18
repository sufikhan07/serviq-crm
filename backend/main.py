from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models
from database import Base, SessionLocal, engine
from schemas import (
    TicketCreate,
    TicketDetailResponse,
    TicketListResponse,
    TicketUpdate,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Serviq CRM API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
   allow_origins=["*"],
allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Serviq CRM backend is running"}


@app.post("/api/tickets")
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    ticket_count = db.query(models.Ticket).count()
    new_ticket_id = f"TKT-{ticket_count + 1:03d}"

    new_ticket = models.Ticket(
        ticket_id=new_ticket_id,
        customer_name=ticket.customer_name,
        customer_email=ticket.customer_email,
        subject=ticket.subject,
        description=ticket.description,
        status="Open",
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return {
        "ticket_id": new_ticket.ticket_id,
        "created_at": new_ticket.created_at,
    }


@app.get("/api/tickets", response_model=list[TicketListResponse])
def get_tickets(
    status: str | None = None,
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Ticket)

    if status:
        query = query.filter(models.Ticket.status == status)

    if search:
        search_value = f"%{search}%"
        query = query.filter(
            or_(
                models.Ticket.ticket_id.ilike(search_value),
                models.Ticket.customer_name.ilike(search_value),
                models.Ticket.customer_email.ilike(search_value),
                models.Ticket.subject.ilike(search_value),
                models.Ticket.description.ilike(search_value),
            )
        )

    return query.order_by(models.Ticket.created_at.desc()).all()


@app.get(
    "/api/tickets/{ticket_id}",
    response_model=TicketDetailResponse
)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = (
        db.query(models.Ticket)
        .filter(models.Ticket.ticket_id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return ticket


@app.put("/api/tickets/{ticket_id}")
def update_ticket(
    ticket_id: str,
    update_data: TicketUpdate,
    db: Session = Depends(get_db),
):
    allowed_statuses = ["Open", "In Progress", "Closed"]

    if update_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status must be Open, In Progress, or Closed"
        )

    ticket = (
        db.query(models.Ticket)
        .filter(models.Ticket.ticket_id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = update_data.status
    ticket.updated_at = datetime.utcnow()

    if update_data.notes and update_data.notes.strip():
        new_note = models.Note(
            ticket_id=ticket.id,
            note_text=update_data.notes.strip(),
        )
        db.add(new_note)

    db.commit()
    db.refresh(ticket)

    return {
        "success": True,
        "updated_at": ticket.updated_at,
    }