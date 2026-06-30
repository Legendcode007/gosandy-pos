# Gosandy Company Ltd — POS & Business Management System

A full-stack web application for managing printing services, stationery sales, staff, branches, and reporting.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Tailwind CSS, Recharts    |
| Backend    | Node.js, Express.js                 |
| Database   | PostgreSQL                          |
| ORM        | Prisma                              |
| Auth       | JWT + bcrypt                        |
| Receipts   | PDFKit (PDF generation)             |

---

## Project Structure

```
gosandy/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← Database schema
│   │   └── seed.js             ← Default data (services + boss account)
│   └── src/
│       ├── config/prisma.js
│       ├── controllers/        ← Business logic
│       ├── middleware/         ← JWT auth + RBAC
│       ├── routes/             ← API endpoints
│       └── server.js
└── frontend/
    └── src/
        ├── context/            ← Auth state
        ├── pages/              ← All screens
        ├── components/layout/  ← Sidebar + layout
        └── utils/              ← API client, currency, date
```

---

## Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+ (local or hosted)
- **npm** v8+

---

## Setup Instructions

### 1. Clone / copy the project

```bash
cd gosandy
```

### 2. Set up the Backend

```bash
cd backend

# Install dependencies
npm install

# Copy the environment file
cp .env.example .env
```

Open `.env` and fill in your PostgreSQL connection:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/gosandy_db"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (creates all tables)
npx prisma migrate dev --name init

# Seed default services and boss account
node prisma/seed.js
```

### 3. Set up the Frontend

```bash
cd ../frontend

# Install dependencies
npm install
```

### 4. Run the Application

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# Runs on http://localhost:3000
```

---

## Default Login (after seeding)

| Field    | Value                  |
|----------|------------------------|
| Email    | boss@gosandy.com       |
| Password | Boss@Gosandy2024       |
| Role     | BOSS (full access)     |

> ⚠️ **Change this password immediately** after first login via My Profile → Change Password.

---

## First-Time Setup Checklist

After logging in as Boss:

1. **Create your branches** → Branches → New Branch
2. **Staff register** their accounts at `/register`
3. **Assign staff** to branches → Users → Edit → Set Branch & Role
4. **Add stationery items** → Stationery → Add Item
5. **Verify services** → Services (18 services are pre-loaded)
6. **Start recording sales** → New Sale

---

## Role Permissions Summary

| Feature                          | Boss | Admin | Staff |
|----------------------------------|------|-------|-------|
| Create/manage branches           | ✅   | ❌    | ❌    |
| View all-branch reports          | ✅   | ❌    | ❌    |
| Manage users (assign roles)      | ✅   | ✅*   | ❌    |
| View branch report               | ✅   | ✅    | ❌    |
| Confirm payment (cashier)        | ✅   | ✅    | ❌    |
| Manage services & stationery     | ✅   | ✅    | ❌    |
| Record new sale                  | ✅   | ✅    | ✅    |
| View own transactions            | ✅   | ✅    | ✅    |
| Print receipt                    | ✅   | ✅    | ✅    |
| Change own password              | ✅   | ✅    | ✅    |

*Admin can only manage users within their own branch.

---

## API Endpoints Reference

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/change-password

GET    /api/branches
POST   /api/branches
PUT    /api/branches/:id
DELETE /api/branches/:id

GET    /api/users
PUT    /api/users/:id/assign
PUT    /api/users/:id/deactivate

GET    /api/services
POST   /api/services
PUT    /api/services/:id

GET    /api/stationery
POST   /api/stationery
PUT    /api/stationery/:id
POST   /api/stationery/:id/stock

GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PUT    /api/transactions/:id/confirm
PUT    /api/transactions/:id/cancel

GET    /api/receipts/:transactionId/pdf   ← Opens printable PDF

GET    /api/reports/dashboard
GET    /api/reports/overview             (Boss only)
GET    /api/reports/branch/:branchId
GET    /api/reports/staff/:staffId
```

---

## Receipt Printing

Receipts are generated as PDF and opened in a new browser tab.  
Use **Ctrl+P** (or browser print) to print. Works with:
- Standard desktop/laser printers (A4)
- Thermal printers (scale to fit 80mm paper in print settings)

---

## Cloud Deployment (optional)

### Backend (e.g. Render, Railway, Heroku)
- Set environment variables from `.env`
- Use a hosted PostgreSQL (Neon, Supabase, Railway)
- Run `npx prisma migrate deploy` on first deploy

### Frontend (e.g. Vercel, Netlify)
- Set `REACT_APP_API_URL` or configure the proxy in `package.json`
- Build: `npm run build`

---

## Support & Development

Built for **Gosandy Company Ltd**, Ghana 🇬🇭  
System version: **1.0.0**

Phases completed:
- [x] Phase 1 — Auth, roles, branches, services
- [x] Phase 2 — POS transaction flow + receipt printing
- [x] Phase 3 — Reports & performance dashboards
- [x] Phase 4 — Stationery inventory tracking

Coming next:
- [ ] Phase 5 — Offline mode, thermal printer direct integration
- [ ] Phase 6 — SMS receipt option, daily email reports
