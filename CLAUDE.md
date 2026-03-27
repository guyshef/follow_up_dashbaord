# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
./follow_up_start.sh   # Start the service on port 3002 (daemonized, logs to follow_up.log)
./follow_up_stop.sh    # Stop the service
npm start              # Start interactively on port 3000 (or $PORT)
```

There are no build, lint, or test scripts — this is a no-build-tool project.

## Architecture

This is a **real estate follow-up tracker**: a lightweight full-stack app where users track properties, agents, offer details, and follow-up history.

**Stack:** Node.js + Express (server) · better-sqlite3 (database) · Vanilla JS / HTML / CSS (frontend, no frameworks, no bundler)

### Backend

- [server.js](server.js) — Express app serving `public/` as static files plus all REST API endpoints
- [db.js](db.js) — SQLite schema, query functions, WAL mode, FK enforcement, and seed data

**REST API:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/properties` | List all properties with follow-ups |
| POST | `/api/properties` | Create property |
| PUT | `/api/properties/:id` | Update property fields |
| DELETE | `/api/properties/:id` | Delete property (cascades follow-ups) |
| POST | `/api/properties/:id/followups` | Add follow-up |
| DELETE | `/api/followups/:id` | Delete follow-up |

**Schema — two tables with cascading deletes:**

```sql
properties(id, address, email, agent_name, agent_email, agent_phone,
           listing_price, initial_offer, offer_date, seller_response)

follow_ups(id, property_id → properties.id ON DELETE CASCADE, date, method, notes)
```

### Frontend

All JS modules in [public/js/](public/js/) use the IIFE pattern (`var Module = (function(){ return {...}; })()`).

| File | Responsibility |
|------|----------------|
| [app.js](public/js/app.js) | DOMContentLoaded entry point; initializes all modules |
| [api.js](public/js/api.js) | Wraps all `fetch()` calls to the REST API |
| [table.js](public/js/table.js) | Renders the main property table; handles expand/collapse of follow-up rows and inline status badge editing |
| [modal.js](public/js/modal.js) | Add/Edit property overlay form |
| [followup.js](public/js/followup.js) | Follow-up timeline panel; add/delete follow-up UI |

**State model:** There is no client-side state store. `Table.render()` re-fetches the full dataset from the API on every mutation. `FollowUp.renderPanel()` populates from the already-fetched data passed to it.

### UI Patterns

- Expandable table rows: click the arrow on a property row to reveal its follow-up timeline
- Inline editing: click a status badge to edit `seller_response` in place
- Color-coded badges for status (red/yellow/green) and follow-up method (email/text/call/in-person)
- Responsive: horizontal scroll on table below 900px viewport
