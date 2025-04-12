import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool, create_engine

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add the project root directory to the Python path
# Adjust this path if your alembic folder is not directly in the backend root
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_dir)

# Import your Base model from your application
from app.db.base import Base

# Import all models here so Base knows about them for 'autogenerate'
# You might need a central place to import all models, e.g., app/db/base_model.py
from app.models.user import User
from app.models.note import Note
from app.models.file import File
from app.models.graph_node import GraphNode
from app.models.graph_edge import GraphEdge

# Set the target metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Read the database URL from the config section driven by .ini
    from app.core.config import settings # Import settings
    db_url = settings.DATABASE_URL

    if not db_url:
        raise ValueError("Database URL not found in alembic.ini or environment variables")

    connectable = create_engine(db_url) # Use create_engine directly

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
