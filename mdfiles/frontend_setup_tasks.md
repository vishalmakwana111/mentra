# Mind Map Mentor - Detailed Frontend Setup Tasks (Local First)

This file breaks down the initial frontend setup (React/Next.js, Tailwind, React Flow).

---

## 1. Project Initialization & Environment

- [x] Navigate to the main project directory (e.g., `mind-map-mentor`)
- [x] Create frontend directory (e.g., `frontend`)
- [x] Initialize Next.js project within `frontend` using `npx create-next-app@latest`:
  - Recommended options: TypeScript, ESLint, Tailwind CSS, `src/` Directory, App Router.
- [x] Navigate into the new `frontend` directory
- [x] Install additional packages:
  - [x] `reactflow`
  - [x] State Management (Choose ONE):
    - [x] `zustand` (Recommended for simplicity)
    - [ ] `jotai`
    - [ ] `@reduxjs/toolkit react-redux`
  - [x] `axios` (for API calls)
- [x] Verify the default Next.js app runs (`npm run dev` or `yarn dev`)

---

## 2. Tailwind CSS Configuration (Verify/Complete)

- [x] Ensure `tailwind.config.ts` exists and is configured.
- [x] Ensure `postcss.config.js` exists and is configured.
- [x] Ensure `globals.css` exists in `src/app/` and imports Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`).
- [x] Test Tailwind: Apply a basic Tailwind class (e.g., `bg-blue-500`) to an element in `src/app/page.tsx` and verify it works.

---

## 3. Basic Project Structure

- [x] Review the default `src/` structure (`app/`, `components/` etc.).
- [x] Create sub-directories within `src/components/`:
  - [x] `layout/`
  - [x] `auth/`
  - [x] `mindmap/`
  - [x] `chat/`
  - [x] `ui/` (for generic reusable components like Button, Input)
- [x] Create top-level directories within `src/`:
  - [x] `store/` (for state management logic, e.g., Zustand store)
  - [x] `services/` or `lib/api/` (for API fetching logic)
  - [x] `hooks/` (for custom React hooks)
  - [x] `types/` (for shared TypeScript types/interfaces)

---

## 4. Layout Implementation

- [x] Clean up default content in `src/app/page.tsx`.
- [x] Modify root layout `src/app/layout.tsx` if needed (e.g., setting base font, theme providers).
- [x] Create `src/components/layout/SidePanel.tsx` (basic placeholder div).
- [x] Create `src/components/layout/MainContent.tsx` (basic placeholder div).
- [x] Create main layout component `src/components/layout/DashboardLayout.tsx`:
  - [x] Use Flexbox or Grid to arrange `SidePanel` and `MainContent`.
  - [x] Give distinct background colors/borders for visual separation initially.
- [x] Apply `DashboardLayout` within `src/app/page.tsx` (or a new route like `src/app/dashboard/page.tsx`).

---

## 5. React Flow Setup

- [x] Create `src/components/mindmap/MindMapCanvas.tsx`.
- [x] Import `ReactFlow`, `Background`, `Controls`, `MiniMap`, `ReactFlowProvider` from `reactflow`.
- [x] Import `useState` (or state management functions) to manage `nodes`, `edges`, `onNodesChange`, `onEdgesChange`, `onConnect`.
- [x] Implement basic `onNodesChange`, `onEdgesChange`, `onConnect` handlers (use helpers from `reactflow` like `applyNodeChanges`, `applyEdgeChanges`, `addEdge`).
- [x] Define initial empty state for `nodes` and `edges`.
- [x] Render the `<ReactFlow>` component within `MindMapCanvas.tsx` with basic props:
  - [x] `nodes={nodes}`
  - [x] `edges={edges}`
  - [x] `onNodesChange={onNodesChange}`
  - [x] `onEdgesChange={onEdgesChange}`
  - [x] `onConnect={onConnect}`
  - [x] `fitView` (optional, useful initially)
- [x] Add `<Background />`, `<Controls />`, `<MiniMap />` inside `<ReactFlow>`.
- [x] Wrap the component/page that uses `MindMapCanvas` with `<ReactFlowProvider>`.
- [x] Render `MindMapCanvas` within the `MainContent` area of your `DashboardLayout`.
- [x] Verify a blank canvas with controls/minimap renders correctly.

--- 