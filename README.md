# Investment Tracker

Your personal investment tracking portal.

## Features
- Dashboard with summary cards and charts
- Full investment log (add/edit/delete)
- SIP / recurring investment tracker
- Financial goals with progress bars
- Portfolio value history chart
- CSV export
- Secure login with hashed passwords

## Deploy on Replit

1. Go to replit.com → Create Repl → Import from GitHub (or upload ZIP)
2. Once uploaded, Replit auto-detects `.replit` config
3. Click **Run** — it installs dependencies and starts both servers
4. Click **Deploy** → Autoscale → your app is live 24/7

## Local Development

```bash
npm run install-all   # install all dependencies
npm run dev           # start backend (port 5000) + frontend (port 3000)
```

## Project Structure

```
investment-tracker/
├── backend/
│   ├── server.js      # Express API
│   ├── db.js          # SQLite database + schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js              # Main app + sidebar navigation
│   │   ├── context/AuthContext.js
│   │   └── pages/
│   │       ├── LoginPage.js
│   │       ├── Dashboard.js    # Charts + summary
│   │       ├── Investments.js  # Full CRUD table
│   │       ├── SIP.js          # SIP tracker
│   │       └── Goals.js        # Financial goals
│   └── package.json
├── .replit
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Create account |
| POST | /api/login | Login |
| GET/POST | /api/investments | List / add investments |
| PUT/DELETE | /api/investments/:id | Edit / delete |
| GET | /api/snapshots | Portfolio history |
| GET/POST | /api/sip | SIP entries |
| GET/POST | /api/goals | Financial goals |
| GET | /api/export/csv | Download CSV |
