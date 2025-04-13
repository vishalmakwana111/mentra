# File Handling Tasks

1.  [X] **Backend Deps:** Add `python-multipart` to `requirements.txt` and install it.
2.  [X] **Backend Config:** Add a `FILE_STORAGE_PATH` setting to `core/config.py` and `.env`.
3.  [X] **Backend Storage Util:** Create a utility function to ensure the storage directory exists.
4.  [X] **Backend File CRUD:** Implement CRUD functions (`create_file_record`, `get_file`, `get_files_for_user`, `delete_file_record`) in `crud/crud_file.py`.
5.  [X] **Backend Upload Endpoint:** Create `POST /files/upload` endpoint in `endpoints/files.py` using `UploadFile`.
6.  [X] **Backend List Endpoint:** Create `GET /files/` endpoint in `endpoints/files.py`.
7.  [X] **Backend Delete Endpoint:** Create `DELETE /files/{file_id}` endpoint in `endpoints/files.py` (handle file system deletion too).
8.  [X] **Backend Download Endpoint:** Create `GET /files/{file_id}/download` endpoint using `FileResponse`.
9.  [X] **Backend Router:** Ensure the file router is correctly included in `api/api_v1/api.py`.
10. [X] **Frontend API Service:** Add `uploadFile`, `fetchFiles`, `deleteFile` functions to `services/api.ts`.
11. [X] **Frontend UI:** Add a basic file upload input/button to `SidePanel.tsx`.
12. [X] **Frontend Upload Logic:** Connect the upload UI to the `uploadFile` API service function.
13. [X] **Frontend File List:** Display fetched files in `SidePanel.tsx`.
14. [X] **Frontend Delete Logic:** Add delete functionality to the file list.
15. [ ] **(Optional) Frontend Graph Nodes:** Modify `graphStore` and `MindMapCanvas` to represent files as nodes. 
