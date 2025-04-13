# Mind Map Mentor - Detailed Backend Setup Tasks (Local First)

This file breaks down the initial backend setup from Phase 1 into more specific tasks.

---

## 1. Project Initialization & Environment

- [x] Create main project directory (e.g., `mind-map-mentor`)
- [x] Create backend directory (e.g., `backend`)
- [x] Set up Python virtual environment within `backend`
- [x] Activate the virtual environment
- [x] Install base packages:
  - [x] `fastapi`
  - [x] `uvicorn[standard]`
  - [x] `sqlalchemy`
  - [x] `psycopg2-binary` (or `asyncpg`)
  - [x] `alembic`
  - [x] `python-dotenv`
  - [x] `pydantic[email]`
  - [x] `passlib[bcrypt]`
  - [x] `python-jose[cryptography]`
- [x] Create `requirements.txt` (`pip freeze > requirements.txt`)
- [x] Set up basic project structure (see suggested structure below)
- [x] Create `app/main.py` with FastAPI instance and health check (`/`)
- [x] Create `.env` file with initial variables (`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`)
- [x] Create `.gitignore` file
- [x] Configure `app/core/config.py` to load settings from `.env`

**Suggested Project Structure:**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py
│   │   └── note.py
│   │   └── file.py
│   │   └── graph_node.py
│   │   └── graph_edge.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── user.py
│   │   └── token.py
│   │   └── note.py
│   │   └── file.py
│   │   └── graph.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── api_v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── login.py
│   │   │   │   ├── users.py
│   │   │   │   ├── notes.py
│   │   │   │   ├── files.py
│   │   │   │   └── graph.py
│   │   │   └── api.py
│   │   └── deps.py
│   └── crud/
│       ├── __init__.py
│       └── crud_user.py
│       └── # ... other crud files ...
├── alembic/
├── .env
├── .gitignore
└── alembic.ini
```

---

## 2. Database Schema Design (SQLAlchemy Models)

- [x] Define `app/db/base.py` (declarative base)
- [x] Define `app/models/user.py`: `User` model (id, email, hashed_password, is_active, created_at)
- [x] Define `app/models/note.py`: `Note` model (id, user_id (FK to User), title, content, created_at, updated_at)
- [x] Define `app/models/file.py`: `File` model (id, user_id (FK to User), filename, storage_path (local), mime_type, size, created_at)
- [x] Define `app/models/graph_node.py`: `GraphNode` model (id, user_id (FK to User), label, data (JSON?), position (JSON?), created_at, updated_at)
- [x] Define `app/models/graph_edge.py`: `GraphEdge` model (id, user_id (FK to User), source_node_id (FK to GraphNode), target_node_id (FK to GraphNode), relationship_type, data (JSON?), created_at, updated_at)
- [x] Add/Refine SQLAlchemy relationships between models (e.g., `User.notes = relationship("Note", back_populates="owner")`)

---

## 3. Pydantic Schemas

- [x] Create schemas in `app/schemas/` for each model:
  - [x] `user.py` (UserBase, UserCreate, User)
  - [x] `token.py` (Token, TokenData)
  - [x] `note.py` (NoteBase, NoteCreate, NoteUpdate, Note)
  - [x] `file.py` (FileBase, FileCreate, File)
  - [x] `graph.py` (GraphNodeBase, GraphNodeCreate, GraphNodeUpdate, GraphNode, GraphEdgeBase, GraphEdgeCreate, GraphEdgeUpdate, GraphEdge)

---

## 4. Database Connection & Migrations

- [x] Configure `app/db/session.py` (SQLAlchemy engine, session maker using `DATABASE_URL`)
- [x] Initialize Alembic (`alembic init alembic`)
- [x] Configure `alembic.ini` & `alembic/env.py` (point to models, DB URL)
- [x] Generate initial Alembic migration (`alembic revision --autogenerate -m "Initial schema"`)
- [x] Apply migration to local Postgres DB (`alembic upgrade head`)

---

## 5. Basic Authentication

- [x] Implement password hashing utils in `app/core/security.py` (`verify_password`, `get_password_hash`)
- [x] Implement JWT token utils in `app/core/security.py` (`create_access_token`, dependency to decode token)
- [x] Create CRUD functions in `app/crud/crud_user.py` (`get_user_by_email`, `create_user`, `authenticate_user`)
- [x] Create API endpoints in `app/api/api_v1/endpoints/users.py` for user creation (`POST /users/`)
- [x] Create API endpoints in `app/api/api_v1/endpoints/login.py` for login (`POST /login/access-token`)
- [x] Implement dependency `get_current_active_user` in `app/api/deps.py`

---

## 6. API Stubs (Placeholder Endpoints)

- [x] Create router files: `notes.py`, `files.py`, `graph.py` in `app/api/api_v1/endpoints/`
- [x] Add placeholder CRUD endpoints for Notes (POST, GET list, GET single, PUT, DELETE)
- [x] Add placeholder CRUD endpoints for Files (POST upload, GET list, GET single, DELETE) - handle local file storage
- [x] Add placeholder CRUD endpoints for Graph Nodes (POST, GET list, PUT, DELETE)
- [x] Add placeholder CRUD endpoints for Graph Edges (POST, GET list, PUT, DELETE)
- [x] Ensure all new endpoints require authentication using `deps.get_current_active_user`
- [x] Include new routers in `app/api/api_v1/api.py`
- [x] Include `api_router` in `app/main.py` under a prefix like `/api/v1`

--- 