# Mentra

**Mentra** is a full-stack, AI-powered knowledge management platform. It enables users to create, visualize, and manage their personal knowledge graph with interactive mind maps, semantic search, and Retrieval-Augmented Generation (RAG) using vector databases and LLMs.

---

## 🚀 Features

- **Interactive Mind Map Visualization:** Create, link, and manage notes and files visually.
- **AI-Powered Semantic Search:** Query your knowledge graph using natural language.
- **Retrieval-Augmented Generation (RAG):** Get context-aware answers from your own data.
- **Full-Stack Solution:** Next.js (React, TypeScript) frontend + FastAPI backend.
- **ORM & Migrations:** SQLAlchemy and Alembic for robust database management.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** FastAPI, Python
- **Database:** PostgreSQL (default, can be changed)
- **Vector Store:** Pinecone
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **AI/Embeddings:** LangChain, OpenAI
- **Containerization:** Docker, Docker Compose

---

## ⚡ Quick Start

### 1. **Clone the Repository**

```sh
git clone https://github.com/vishalmakwana111/mentra.git
cd mentra
```

---

### 2. **Start the Database with Docker Compose**

The provided `docker-compose.yml` (in `mind-map-mentor/backend/`) will start only the PostgreSQL database service. Backend and frontend must be started manually (see below).

```sh
cd mind-map-mentor/backend
docker-compose up
```

- The **PostgreSQL database** will be available at: `localhost:5432`
- **Backend and frontend are NOT started by this command.**

---

### 3. **Manual Local Development**

#### **Backend**

1. **Create and activate a virtual environment (recommended):**
    ```sh
    cd mind-map-mentor/backend
    python -m venv .venv
    # On Windows:
    .venv\Scripts\activate
    # On macOS/Linux:
    source .venv/bin/activate
    ```
2. **Install dependencies:**
    ```sh
    pip install -r requirements.txt
    ```
3. **Set up environment variables** (see `.env.example`).
4. **Run database migrations:**
    ```sh
    alembic upgrade head
    ```
5. **Start the backend server:**
    ```sh
    uvicorn app.main:app --reload
    ```

#### **Frontend**

1. **Install dependencies:**
    ```sh
    cd mind-map-mentor/frontend
    npm install
    ```
2. **Start the frontend:**
    ```sh
    npm run dev
    ```
3. **Visit** `http://localhost:3000` **in your browser.**

---

## 🗄️ Database & ORM (SQLAlchemy + Alembic)

- **SQLAlchemy** is used for all database models and queries.
- **Alembic** handles schema migrations.

### **How to Use Alembic for Migrations**

1. **Create a new migration after changing models:**
    ```sh
    alembic revision --autogenerate -m "Describe your change"
    ```
2. **Apply migrations to the database:**
    ```sh
    alembic upgrade head
    ```
3. **(Optional) Downgrade migration:**
    ```sh
    alembic downgrade -1
    ```

- Alembic config is in `backend/alembic.ini`.
- Migration scripts are in `backend/alembic/versions/`.

---

## 🧠 Project Structure

```
mentra/
├── mind-map-mentor/
│   ├── backend/         # FastAPI backend, ORM, Alembic, AI logic
│   └── frontend/        # Next.js frontend
```

---

## 📝 Contributing

1. Fork the repo and create your branch.
2. Commit your changes.
3. Push to your fork and submit a pull request.

---

**Questions?**  
Open an issue or contact the maintainer!
