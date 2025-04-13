# Mentra: Technology Stack

## Overview

Mentra is an AI-powered mind mapping application that enables intelligent note organization, automatic relationship discovery, and context-aware knowledge retrieval. Our tech stack combines modern web technologies with powerful AI components.

## Frontend

- **Framework**: Next.js with React
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Graph Visualization**: React Flow
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Routing**: Next.js App Router

## Backend

- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT (JSON Web Tokens)
- **API Validation**: Pydantic
- **File Storage**: Local filesystem (cloud storage planned)

## AI Components

- **Vector Database**: Pinecone
- **Embeddings**: OpenAI Embeddings API (text-embedding-3-small)
- **LLM Integration**: LangChain / LangChain Expression Language (LCEL)
- **RAG Implementation**: Custom implementation using LangChain
- **LLM Model**: OpenAI GPT-4o-mini

## Features Implemented

- User authentication & session management
- Note creation, editing, and organization
- File upload and management
- Interactive graph visualization
- Persistent node positioning
- Manual edge creation
- Automatic edge creation based on semantic similarity (similarity threshold: 0.75)
- Retrieval Augmented Generation (RAG) for context-aware Q&A
- Source highlighting for RAG answers

## Development & Deployment

- **Version Control**: Git
- **API Documentation**: Swagger UI (via FastAPI)
- **Debugging**: Custom logging infrastructure
- **Environment Management**: Python venv, dotenv for configuration

## Planned Extensions

- Multi-agent AI system (Organizer, Connector, Planner, Coach)
- Enhanced multi-modal input (PDFs, links, etc.)
- Mobile-responsive design
- Team collaboration features
- Export/import functionality 