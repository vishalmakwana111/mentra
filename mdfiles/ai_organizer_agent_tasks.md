# AI Organizer Agent Tasks - Automatic Tagging (Detailed)

**Goal:** Automatically suggest and store relevant tags/keywords for notes based on their content using an AI agent.

---

## Phase 1: Backend Setup

### **Task 1: Design & Implement Tag Storage**
- [X] **1.1. Decision:** Choose storage location for tags.
    - *Options:*
        - A: `ARRAY(String)` column on `Note` model. (Pros: Direct querying via SQL. Cons: Requires schema change.)
        - B: Key within `data` JSONB field on `GraphNode` model. (Pros: Flexible, no Note schema change. Cons: Querying less direct.)
    - *Decision Made:* **Option B** (Tags stored in GraphNode.data['tags'])
- [X] **1.2. Model Update:** Modify the chosen SQLAlchemy model (`models/note.py` or `models/graph_node.py`) to include the tag storage mechanism.
    - *If Option A:* Add `tags = Column(ARRAY(String), nullable=True)` and import `ARRAY, String` from `sqlalchemy`.
    - *If Option B:* No model change needed, but ensure `data` field exists (`Column(JSONB)`). - **(Verified Existing)**
- [X] **1.3. Schema Update:** Update the corresponding Pydantic schema (`schemas/note.py` or `schemas/graph.py`) to include `tags: List[str] | None = None`. Ensure it's present in the main read schema (e.g., `Note` or `GraphNode`). - **(Updated `schemas/graph_node.py`)**
- [N/A] **1.4. Generate Migration:** Run `alembic revision --autogenerate -m "Add tag storage mechanism for [Note/GraphNode]"`.
- [N/A] **1.5. Review Migration:** Carefully check the generated script in `alembic/versions/`.
- [N/A] **1.6. Apply Migration:** Run `alembic upgrade head`.

### **Task 2: Create AI Tag Suggestion Service**
- [X] **2.1. Create File:** Create `app/ai/agents/organizer.py`.
- [X] **2.2. Define Function:** Define the async function signature: `async def suggest_tags_for_content(content: str) -> List[str]:`.
- [X] **2.3. Imports:** Add necessary imports (`ChatOpenAI`, `ChatPromptTemplate`, `StrOutputParser`, `settings`, `logging`, `List`).
- [X] **2.4. Initialize LLM:** Instantiate `llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0.2, api_key=settings.OPENAI_API_KEY)`. (Slight temperature for creativity in tags).
- [X] **2.5. Define Prompt:** Create a `ChatPromptTemplate` (`prompt_template`) with instructions like:
    ```
    "Analyze the following text and extract the 3 to 5 most relevant and concise keywords or tags.
    Present the tags as a comma-separated list ONLY, with no introductory text or numbering.
    Example: tag1, tag2, tag3

    Text:
    {text_content}"
    ```
- [X] **2.6. Create LCEL Chain:** Define `tag_chain = prompt_template | llm | StrOutputParser()`.
- [X] **2.7. Implement Function Logic:**
    - Add basic input validation (check if content is empty).
    - Wrap the `tag_chain.ainvoke({"text_content": content})` call in a `try...except` block.
    - Log the input content (truncated) and the raw LLM response.
- [X] **2.8. Implement Output Parsing:**
    - Take the raw string output from the LLM.
    - Split the string by commas (`,`).
    - Trim whitespace from each resulting tag.
    - Filter out any empty strings that might result from parsing.
    - Return the cleaned list of tags.
    - Log the final parsed tags.
- [X] **2.9. Error Handling & Logging:** Add specific logging for errors during the LLM call or parsing. Return an empty list on failure.

### **Task 3: Integrate Tag Suggestion into Note CRUD**
- [X] **3.1. Import Service:** In `crud/crud_note.py`, import `suggest_tags_for_content` from `app.ai.agents.organizer`.
- [X] **3.2. Modify `create_note` - Tag Generation:**
    - *After* the initial `db.commit()` and `db.refresh(db_note)` for the note creation.
    - Add a `try...except` block for tag generation.
    - Inside the `try`, call `tags = await suggest_tags_for_content(db_note.content)`.
    - Add logging for success/failure of tag generation.
- [X] **3.3. Modify `create_note` - Tag Storage:**
    - If `tags` were successfully generated:
        - *If Storing on Note (Option A):* Set `db_note.tags = tags`.
        - *If Storing on GraphNode (Option B):*
            - Fetch the `graph_node = crud_graph.get_graph_node(...)` - (Handled implicitly as `graph_node` is available).
            - Update `graph_node.data['tags'] = tags` using `flag_modified`.
            - Add `db.add(graph_node)`.
        - `db.commit()` the tag update in a separate try/except block.
        - `db.refresh(graph_node)`.
- [X] **3.4. Modify `update_note` - Trigger Condition:**
    - Locate the check for `content_updated`.
- [X] **3.5. Modify `update_note` - Tag Generation:**
    - *If* `content_updated` is true:
        - *Inside* a `try` block (after main update commit).
        - Call `new_tags = await suggest_tags_for_content(update_data['content'])`.
        - Add logging.
- [X] **3.6. Modify `update_note` - Tag Storage:**
    - *If* `content_updated` is true and `new_tags` generated successfully (or not):
        - *If Storing on Note (Option A):* Set `db_note.tags = new_tags`.
        - *If Storing on GraphNode (Option B):* Update `graph_node.data['tags'] = new_tags` using `flag_modified`.
        - Commit tag update in separate try/except block.
- [X] **3.7. API Response Verification:** Ensure the Pydantic schemas used in the `response_model` for `POST /notes/` and `PUT /notes/{note_id}` include the `tags` field, so they are returned to the frontend. **(Schema updated in Task 1.3. *Note: Population of `GraphNode.tags` from `GraphNode.data` in API responses needs handling in API route handlers.*)**

---

## Phase 2: Frontend Integration

### **Task 4: Update Frontend Types**
- [X] **4.1. Locate Type:** Find `NoteNodeData` (or `GraphNodeData`) in `frontend/src/types/index.ts`.
- [X] **4.2. Add Field:** Add `tags?: string[] | null;` to the interface.

### **Task 5: Display Tags on Node**
- [X] **5.1. Access Tags:** In `NoteNode.tsx`, get `tags` from the `data` prop (`const tags = data.tags;`).
- [X] **5.2. Add Tag Container:** Below the content display area, add a `div` for tags.
- [X] **5.3. Conditional Rendering:** Render the tag container only if `tags && tags.length > 0`.
- [X] **5.4. Render Tags:** Inside the container, use `tags.map()` to render each tag.
- [X] **5.5. Style Tags:** Apply styling to make tags look like small badges (e.g., `inline-block`, `bg-blue-100`, `text-blue-800`, `text-xs`, `font-medium`, `mr-1`, `mb-1`, `px-2`, `py-0.5`, `rounded`).

### **Task 6: Update Store & Fetching Logic**
- [X] **6.1. Verify `fetchGraphData` Mapping:** In `graphStore.ts`, check the mapping logic inside `fetchGraphData`. Ensure `tags` (from `backendNode.tags` or `backendNode.data.tags`) are correctly assigned to the `nodeData` payload.
- [X] **6.2. Verify `addNoteNode`:** Ensure `tags` (if returned by the create API) are included when constructing the new `Node<NoteNodeData>` object (N/A - Handled by fetchGraphData).
- [X] **6.3. Verify `updateNoteContent`:** Ensure `tags` (if returned by the update API) are included in the call to `get().updateNodeData` within the `updateNoteContent` action (N/A - Handled by fetchGraphData).

---

## Phase 3: Testing & Completion

### **Task 7: Testing & Refinement (Manual)**
- [M] **7.1. Test Creation:** Create several notes with different content lengths/topics. Verify tags are generated, stored in the DB correctly, and displayed on the frontend node.
- [M] **7.2. Test Update (Content Change):** Edit the content of existing notes significantly. Verify tags are regenerated/updated in the DB and frontend display.
- [M] **7.3. Test Update (No Content Change):** Edit only the title or position of a note. Verify tags are *not* regenerated.
- [M] **7.4. Test Edge Cases:** Test with very short notes or notes with ambiguous content.
- [M] **7.5. Prompt Refinement:** Review the quality/relevance of generated tags. If needed, adjust the LLM prompt in `organizer.py` and re-test.

### **Task 8: Update Master Task List (Manual)**
- [M] **8.1.** Add the completed "AI Organizer Agent - Automatic Tagging" tasks to `mdfiles/master_completed_tasks.md`. 