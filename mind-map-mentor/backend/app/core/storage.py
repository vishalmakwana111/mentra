import os
from pathlib import Path
from .config import settings

def ensure_storage_path_exists():
    """Checks if the configured file storage path exists, creates it if not."""
    storage_path = Path(settings.FILE_STORAGE_PATH)
    if not storage_path.exists():
        print(f"Storage path {storage_path.resolve()} does not exist. Creating...")
        try:
            os.makedirs(storage_path, exist_ok=True)
            print(f"Storage path {storage_path.resolve()} created successfully.")
        except OSError as e:
            print(f"Error creating storage path {storage_path.resolve()}: {e}")
            # Decide how to handle this - raise exception? Log critical error?
            # For now, just print the error.
            raise
    # else:
        # print(f"Storage path {storage_path.resolve()} already exists.") 