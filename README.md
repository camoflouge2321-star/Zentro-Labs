# Zentro Labs - Premium One-Page Website (Operational Edition)

A premium editorial agency website with a real backend API, persistent content data, and lead capture storage.

## Stack
- Frontend: `index.html`, `styles.css`, `app.js`
- Backend: `server.js` (Node + Express)
- Data store: JSON files inside `data/`

## Project Structure
- `index.html` - semantic one-page layout
- `styles.css` - bespoke premium design system and responsive styling
- `app.js` - animations, UI interactions, API integration, form submission
- `server.js` - API endpoints + static hosting
- `data/site-config.json` - editable site-wide config
- `data/work-items.json` - editable portfolio/work card content
- `data/leads.json` - captured inbound form submissions

## API Endpoints
- `GET /api/health` - health check
- `GET /api/config` - runtime site config
- `GET /api/work-items` - selected work data
- `POST /api/contact` - contact lead capture
- `GET /api/leads` - protected lead list (requires `ADMIN_TOKEN`)

## Setup
1. Install dependencies:
```bash
npm install
```

2. (Optional) Configure `.env` from `.env.example`.

3. Run locally:
```bash
npm run dev
```

4. Open:
`http://127.0.0.1:5500`

## Content Management
- Update brand and contact settings in `data/site-config.json`.
- Update portfolio cards in `data/work-items.json`.
- Leads from the contact form are stored in `data/leads.json`.

## Email Notifications (Optional)
If SMTP env vars are set, each new lead can trigger an email notification.
Required vars:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `NOTIFICATION_EMAIL`

Optional:
- `SMTP_FROM`

## Notes
- Hero section video remains `hero.bg.mp4`.
- If API is unavailable, frontend still falls back to default static config/work data.

## License
Private client project. All rights reserved.
