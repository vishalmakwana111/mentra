# Mind Map Mentor - Consolidated MVP Task List

This file consolidates all tasks from the detailed 12-week plan (`plan.md`), adjusted for an initial **local-first development focus**.

---

## Phase 1 – Foundation & Setup (Week 1-2)

### Backend
- [ ] Set up **backend repo** & environment (FastAPI)
- [ ] Design **database schema** (users, notes, files, graph nodes & edges)
- [ ] Implement **user auth/signup/login** (JWT or OAuth - local focus)
- [ ] Create basic API stubs:
  - [ ] Upload text/docs/PDFs (store locally initially)
  - [ ] List user notes/files
  - [ ] CRUD mind map nodes & edges
- [ ] Connect to **Postgres** (local instance)
- [ ] Connect to **Vector DB** (e.g., local Docker instance of Weaviate/Milvus/Chroma)
- [ ] Set up **local file storage** for uploads (Defer S3 integration)

### DevOps (Local Focus)
- [ ] Set up **GitHub repo + GitFlow** branching strategy
- [ ] Create **Docker containers** for app components (backend, DBs) - for local dev consistency

---

## Phase 2 – AI Agent Integration (Week 3-5)

### Base AI & Multi-Agent System
- [ ] Integrate **OpenAI API** (GPT-4 / 3.5) with your backend (requires API key)
- [ ] Build **LangChain / CrewAI** orchestration scaffold
- [ ] Implement **Organizer agent**:
  - [ ] Summarize and auto-tag new uploads
  - [ ] Cluster content by topic/intent
- [ ] Implement **Connector agent**:
  - [ ] Extract entities & ideas
  - [ ] Find & create links between related concepts in graph
- [ ] Set up **vector embeddings** pipeline (OpenAI / open-source) for search
- [ ] Store embeddings in local Vector DB

### Basic AI Tasks
- [ ] Text chunking/splitting strategy
- [ ] Handle multi-modal file ingestion (PDF parsing etc.)
- [ ] Test initial agent outputs on seed data
- [ ] Define API endpoints to trigger agents / get outputs

---

## Phase 3 – Knowledge Graph Core (Week 5-6)

### Backend
- [ ] Build mind map data model (nodes, relationships) in local Postgres
- [ ] API endpoints to **fetch/create/update** graph
- [ ] Logic to update graph with new AI outputs
- [ ] Link user notes/files → graph nodes
- [ ] Sync graph changes back to local vector DB

### Frontend
- [ ] Wireframe UI: login, dashboard, mind map, chat
- [ ] Set up **React app (Next.js), Tailwind CSS**
- [ ] Implement **auth flow** connecting to local backend
- [ ] Layout:
  - Side panel (inputs, chat)
  - Main: interactive mind map canvas
- [ ] Integrate **React Flow** to display graph
- [ ] Connect backend API → display dynamic graph

---

## Phase 4 – Interactive Chat + Visual UI (Week 7-9)

### Chat UI + Agent Control
- [ ] Build chat component (streaming replies, markdown support)
- [ ] Send chat queries → multi-agent backend (local)
- [ ] Show Organizer, Connector, Planner suggestions in thread
- [ ] Allow user to approve / edit changes to mind map
- [ ] Question answering over knowledge base (local data)

### Visual Mind Map UI
- [ ] Click/select nodes to view content/metadata
- [ ] Drag/drop nodes to reorganize
- [ ] Add/edit/delete nodes manually
- [ ] Real-time update on AI-generated links/connections

### Planner Agent (Basic Version)
- [ ] Generate plans from highlighted nodes or topics
- [ ] Output actionable steps/goals
- [ ] Show plan as sub-graph or task list

---

## Phase 5 – Local Alpha Testing & Polish (Week 10-12)

### Backend
- [ ] Add basic API rate limiting (if needed locally)
- [ ] Improve error handling/logging (local)
- [ ] Implement secure data export (JSON/CSV) from local DB
- [ ] Set up user settings & privacy controls (local focus)

### Frontend
- [ ] Improve UI/UX, tutorials/tooltips
- [ ] Loading/error states
- [ ] Basic theming/dark mode
- [ ] Mobile responsiveness
- [ ] Support uploading PDFs, links (images optional)

### User Testing (Local/Internal)
- [ ] Internal tests on real data (using local setup)
- [ ] Invite first users (friends, beta list) for local testing/feedback if feasible, otherwise focus on internal testing
- [ ] Collect feedback on:
  - Idea ingest + capture
  - Graph usefulness
  - Chat/agent value
  - Planner output
  - Overall experience

### Pre-Launch Prep (Content)
- [ ] Write landing page copy & value proposition
- [ ] Record demo video / GIFs (from local build)
- [ ] Set up waitlist + feedback channels (email, Discord, Telegram)
- [ ] First blog post: vision + what's next

---

## Deferred Tasks (Post-Local MVP / Pre-Cloud Deployment)

### DevOps
- [ ] Automate **CI/CD pipeline** (GitHub Actions / GitLab CI)
- [ ] Configure **cloud infra** (AWS/GCP) with staging/production environments
- [ ] Deploy **staging + production** environments
- [ ] Set up **automated backups** (cloud-based)
- [ ] Monitor **performance, cost** (cloud-based)
- [ ] Set up **usage analytics** (privacy-safe, likely cloud-integrated)

### Backend
- [ ] Integrate **S3 bucket/object storage** for uploads
- [ ] Scale database/vector DB for production load
- [ ] Implement robust cloud-based API rate limiting/security

--- 