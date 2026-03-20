# Follow-Up System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive web-based follow-up tracking system for real estate offers, accessible from multiple computers. Supports adding properties, tracking agent responses, and logging multiple follow-up actions per property with expandable rows.

**Architecture:** Node.js + Express backend serving a REST API with SQLite for persistence. Vanilla HTML/CSS/JS frontend served as static files. Single-page design with expandable rows for follow-up history per property.

**Tech Stack:** Node.js, Express, better-sqlite3, HTML5, CSS3, Vanilla JavaScript (ES6+)

**Security Note:** All dynamic content rendered into the DOM must use `textContent` or safe DOM creation methods (`createElement`, `appendChild`). Sanitize inputs server-side. Use parameterized SQL queries (better-sqlite3 handles this natively).

---

## File Structure

```
follow_up/
  server.js                 # Express server: static files + REST API
  db.js                     # SQLite database setup, schema, seed data
  package.json              # Dependencies: express, better-sqlite3
  public/
    index.html              # Main page: table, modals, layout
    css/
      styles.css            # All styling: table, modals, forms, responsive
    js/
      app.js                # Entry point: init, event wiring
      api.js                # Fetch wrapper for all REST calls
      table.js              # Render main table + inline follow-up rows
      modal.js              # Add/Edit property modal logic
      followup.js           # Follow-up entry UI + logic per property
```

**Responsibilities:**
- `server.js` — Express app. Serves `public/` as static. Mounts REST API routes.
- `db.js` — Creates SQLite DB file (`data.db`), defines schema, exposes query functions, seeds sample data on first run.
- `api.js` — Frontend module. Wraps all `fetch()` calls to the REST API. Returns parsed JSON. Single source for all HTTP calls.
- `table.js` — Renders the property table from API data. Handles expand/collapse of follow-up rows. Uses safe DOM methods.
- `modal.js` — Opens/closes the add/edit property modal. Collects form data, calls API, re-renders table.
- `followup.js` — Renders follow-up history inside expanded rows. Handles "add follow-up" form.
- `app.js` — Glues everything: fetches data, renders initial table, wires global event listeners.

---

## REST API

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/properties` | — | List all properties with their follow-ups |
| POST | `/api/properties` | `{address, email, agentName, ...}` | Create a property |
| PUT | `/api/properties/:id` | `{field: value, ...}` | Update a property |
| DELETE | `/api/properties/:id` | — | Delete property + its follow-ups |
| POST | `/api/properties/:id/followups` | `{date, method, notes}` | Add a follow-up |
| DELETE | `/api/followups/:id` | — | Delete a follow-up |

---

## Database Schema

```sql
CREATE TABLE properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  email TEXT DEFAULT '',
  agent_name TEXT DEFAULT '',
  agent_email TEXT DEFAULT '',
  agent_phone TEXT DEFAULT '',
  listing_price REAL DEFAULT 0,
  initial_offer REAL DEFAULT 0,
  offer_date TEXT DEFAULT '',
  seller_response TEXT DEFAULT ''
);

CREATE TABLE follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  method TEXT NOT NULL,
  notes TEXT DEFAULT ''
);
```

---

## Seed Data (5 rows from the Excel dashboard)

1. 270 West Glendale — Stuart — phone: 216-xxx-xxxx — $120,000 listing / $105,000 offer — 12/10/25 — closed
2. 8570 Randolph Rd, Crestwood Heights — Karen — email: kherftho@gmail.com — $140,000 offer — 09/02/26 — checking
3. 15012 Corlett Rd, Maple Heights, OH 44137 — Deborah Kidd — email: deborahsolutions@gmail.com — $145,000 listing / $120,000 offer — 09/02/26 — checking
4. 21860 Louis Rd, Bedford Heights, OH 44146 — (no agent) — email: SikTheRealtor@gmail.com — $120,000 offer — 09/03/26 — (blank)
5. 440 E 21st St, Euclid — Gene Williams — email: genewilliams703@gmail.com — $45,000 listing / $110,000 offer — 09/02/26 — "1.07% not work for the seller"

All properties have `email: "dana.gcy.invest@gmail.com"` as the sender.

---

### Task 1: Backend Setup — Server, Database, API

**Files:**
- Create: `package.json`
- Create: `db.js`
- Create: `server.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "follow-up-tracker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "better-sqlite3": "^11.0.0"
  }
}
```

- [ ] **Step 2: Run `npm install`**

- [ ] **Step 3: Create `db.js`**

Module exports an object with methods:
- `init()` — creates tables if not exist, seeds sample data if `properties` table is empty
- `getAllProperties()` — returns all properties, each with a `followUps` array (use a JOIN or two queries)
- `getPropertyById(id)` — returns one property with its follow-ups
- `createProperty(data)` — inserts and returns the new property with `id`
- `updateProperty(id, data)` — updates only the fields provided, returns updated property
- `deleteProperty(id)` — deletes property (CASCADE deletes follow-ups)
- `createFollowUp(propertyId, data)` — inserts and returns the new follow-up with `id`
- `deleteFollowUp(id)` — deletes a follow-up

All queries must use parameterized statements (better-sqlite3 `prepare().run(params)` / `.get(params)` / `.all(params)`).

Enable WAL mode and foreign keys on init: `PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`

- [ ] **Step 4: Create `server.js`**

- Import express and db
- Call `db.init()`
- Serve `public/` as static files
- Mount all 6 REST API endpoints from the table above
- All endpoints return JSON
- Error handling: try/catch per route, return `{error: message}` with appropriate status codes
- Listen on `process.env.PORT || 3000`, log the URL on startup

- [ ] **Step 5: Create `public/` directory with an empty `index.html` placeholder**

Just enough to verify the server starts: `<h1>Follow-Up Tracker</h1>`

- [ ] **Step 6: Start server and test**

Run: `node server.js`
Test: `curl http://localhost:3000/api/properties` — should return JSON array with 5 seeded properties.

- [ ] **Step 7: Commit**

```bash
git init
git add package.json package-lock.json db.js server.js public/index.html
git commit -m "feat: backend with Express, SQLite, REST API, and seed data"
```

---

### Task 2: Frontend API Client + Property Table

**Files:**
- Create: `public/js/api.js`
- Create: `public/js/table.js`
- Create: `public/js/app.js`
- Create: `public/css/styles.css`
- Modify: `public/index.html` (full page structure)

- [ ] **Step 1: Create `public/js/api.js`**

Module (IIFE `Api`) with async methods wrapping fetch:
- `getProperties()` — GET `/api/properties`
- `createProperty(data)` — POST `/api/properties`
- `updateProperty(id, data)` — PUT `/api/properties/:id`
- `deleteProperty(id)` — DELETE `/api/properties/:id`
- `addFollowUp(propertyId, data)` — POST `/api/properties/:id/followups`
- `deleteFollowUp(id)` — DELETE `/api/followups/:id`

Each method: calls fetch with appropriate method/headers/body, parses JSON, returns data. On error, logs and re-throws.

- [ ] **Step 2: Create `public/js/table.js`**

`Table` IIFE with async `render()` method:
- Calls `Api.getProperties()`
- Builds table using safe DOM methods (createElement/textContent/appendChild)
- Columns: expand arrow, Property Address, Agent Name, Contact Info, Listing Price, Initial Offer, Offer Date, Seller Response (color-coded badge), Follow-Ups (count), Actions (Edit/Del)
- Each property row followed by a hidden follow-up row
- Status badge colors: red=closed, yellow=checking, green=accepted, gray=other
- Wire expand/edit/delete button event listeners

**Important:** Use `document.createElement` and `textContent` for all user-supplied data. No innerHTML with user content.

- [ ] **Step 3: Create `public/css/styles.css`**

Full styles for: reset, body, header, buttons, table (dark header #1e3a5f, hover, badges), hidden class, empty state.

- [ ] **Step 4: Update `public/index.html`**

Full HTML structure with:
- Header with title + "+ Add Property" button
- `<div id="table-container">` for the table
- Property modal HTML (form with all fields)
- Script tags in order: api.js, table.js, modal.js, followup.js, app.js

- [ ] **Step 5: Create `public/js/app.js`**

DOMContentLoaded: call `Table.render()`, `Modal.init()`, `FollowUp.init()`.

- [ ] **Step 6: Start server, open browser, verify table shows 5 properties**

- [ ] **Step 7: Commit**

```bash
git add public/
git commit -m "feat: frontend table with API client showing seeded properties"
```

---

### Task 3: Add/Edit Property Modal

**Files:**
- Create: `public/js/modal.js`
- Modify: `public/css/styles.css` (add modal styles)

- [ ] **Step 1: Create `public/js/modal.js`**

`Modal` IIFE with:
- `init()` — wire "+ Add Property" button, cancel, backdrop click, form submit
- `open(editId?)` — if editId, fetch property from Api and pre-fill form; otherwise reset for new entry. Default email to "dana.gcy.invest@gmail.com", default date to today.
- `close()` — hide modal
- `save()` — async. Collect form data, call `Api.createProperty` or `Api.updateProperty`, close, re-render table.

- [ ] **Step 2: Add modal styles to `css/styles.css`**

Fixed overlay, centered white card, form labels/inputs with focus ring, action buttons row.

- [ ] **Step 3: Test: add new property, edit existing property**

- [ ] **Step 4: Commit**

```bash
git add public/js/modal.js public/css/styles.css
git commit -m "feat: add/edit property modal"
```

---

### Task 4: Follow-Up Panel (Core Feature)

**Files:**
- Create: `public/js/followup.js`
- Modify: `public/css/styles.css` (add follow-up panel styles)

- [ ] **Step 1: Create `public/js/followup.js`**

`FollowUp` IIFE with:
- `init()` — nothing global needed (events are wired per panel render)
- `renderPanel(propertyId)` — async. Fetches property from stored data or Api. Renders into `.followup-panel[data-property-id]`:
  - Header with property address
  - Timeline of existing follow-ups: method badge (email=blue, text=green, phone=yellow, in-person=purple), date, notes, delete (x) button
  - "No follow-ups yet" if empty
  - Add Follow-Up form: date (default today), method select, notes textarea, submit button

On add form submit: call `Api.addFollowUp`, re-render panel, refresh main table to update count.
On delete click: call `Api.deleteFollowUp`, re-render panel, refresh main table count.

**Important:** After `Table.render()`, re-expand any previously open follow-up row.

Use safe DOM methods for all user content.

- [ ] **Step 2: Add follow-up panel styles**

Left blue border, card entries, color-coded method badges, form styling, timeline layout.

- [ ] **Step 3: Test full follow-up flow**

1. Expand a row — "No follow-ups yet" message
2. Add follow-up (email, notes) — appears with blue EMAIL badge
3. Add another (text) — appears below, count badge updates to 2
4. Delete one — removed, count decrements

- [ ] **Step 4: Commit**

```bash
git add public/js/followup.js public/css/styles.css
git commit -m "feat: follow-up panel with timeline and add/delete"
```

---

### Task 5: Inline Seller Response + Polish

**Files:**
- Modify: `public/js/table.js` (inline editing)
- Modify: `public/css/styles.css` (inline input + responsive)

- [ ] **Step 1: Add inline seller response editing to `table.js`**

Make status badges clickable. On click: replace with text input pre-filled with current value. On Enter or blur: call `Api.updateProperty(id, {sellerResponse: value})`, re-render. On Escape: cancel, re-render.

- [ ] **Step 2: Add styles**

Dashed outline on hover for editable badges. Inline input styling. Responsive breakpoint at 900px: horizontal scroll on table, stacked form fields.

- [ ] **Step 3: Test inline editing + responsive**

- [ ] **Step 4: Commit**

```bash
git add public/js/table.js public/css/styles.css
git commit -m "feat: inline seller response editing and responsive layout"
```

---

## Summary

| Task | What it delivers |
|------|-----------------|
| 1 | **Backend** — Express server, SQLite DB, REST API, seed data |
| 2 | **Frontend table** — API client + property table matching Excel |
| 3 | **Add/Edit modal** — create and update properties |
| 4 | **Follow-up panel** — expandable rows with timeline, add/delete follow-ups |
| 5 | **Inline editing + polish** — click-to-edit seller response, responsive |

After all 5 tasks: run `npm start`, open `http://localhost:3000` from any computer on the network. Full CRUD on properties and follow-ups, persisted in SQLite.
