# Serviq CRM

Serviq is a full-stack customer-support ticket management system. It helps support teams create, track, search, update, and resolve customer requests from one clean dashboard.

## Features

- Create tickets with customer details and issue description
- Auto-generated ticket IDs such as `TKT-001`
- Dashboard with live ticket counts by status
- Search tickets by ID, customer name, email, or issue
- Filter tickets by Open, In Progress, and Closed status
- View full ticket details
- Update ticket status
- Add internal support notes
- Responsive dashboard-style user interface

## Tech Stack

- Frontend: React + Vite + CSS
- Backend: Python + FastAPI
- Database: SQLite + SQLAlchemy
- API: REST API

## Project Structure

```text
serviq-crm/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
├── frontend/
│   └── src/
└── README.md