# Warkoem Pul - Point of Sale System

Hybrid PoS system untuk Warkoem Pul dengan fitur QR ordering (customer scan) dan walk-in ordering (kasir input).

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: SQLite (dev) → PostgreSQL (prod) via Prisma ORM
- **Payment**: Midtrans (QRIS, Card, Bank Transfer)
- **Real-time**: Server-Sent Events (SSE)
- **Deploy**: Vercel (app) + Supabase (DB)

## Features

### Kasir Dashboard (`/admin`)
- Dashboard overview (pending orders, revenue, stats)
- Create new orders (walk-in dine-in / take-away)
- Stand assignment (auto-assign available stand)
- Menu management (CRUD, toggle availability)
- Stand management (view active/available stands)
- Tables & QR codes (generate printable PDF QR codes)
- Shift management (open/close shift, cash reconciliation)
- Reports (daily sales, top items, payment breakdown, CSV export)

### Kitchen Display (`/kitchen`)
- Real-time order updates via SSE
- Status management: Pending → Preparing → Ready → Served
- Print ticket for each order
- Queue display support

### Customer QR Menu (`/menu/[tableId]`)
- Mobile-first responsive design
- Browse menu by category (Nasi, Mie, Snack, Minuman, etc.)
- Add to cart with quantity control
- Add notes to items
- Submit order → auto-redirect to payment page
- Payment via Midtrans QRIS (scan with e-wallet/banking app)

### Queue Display (`/queue-display`)
- Fullscreen TV display for take-away orders
- Shows "Ready to Pick Up" and "Being Prepared" queues
- Auto-refresh every 3 seconds

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Kasir | kasir | kasir123 |
| Kitchen | kitchen | kitchen123 |

## Setup

### Development

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev --name init
npx prisma db seed

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Midtrans keys

# Run development server
npm run dev
```

### Environment Variables

```env
# Midtrans (get from https://dashboard.midtrans.com)
MIDTRANS_SERVER_KEY=SB-Mid-server-YOUR_KEY
MIDTRANS_CLIENT_KEY=SB-Mid-client-YOUR_KEY

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

## Database Schema

```
User          → kasir, kitchen (role-based access)
Shift         → shift management, cash reconciliation
Stand         → physical stand numbers for dine-in
Table         → 40 tables (T1-T40) with QR codes
MenuItem      → 58 menu items across 8 categories
Order         → orders with stand/table assignment
OrderItem     → items within each order
Refund        → refund records
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Menu
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create menu item
- `PUT /api/menu` - Update menu item
- `DELETE /api/menu?id=xxx` - Delete menu item

### Orders
- `GET /api/orders` - Get orders (filter by status, limit)
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get single order
- `PUT /api/orders/[id]/status` - Update order status
- `PUT /api/orders/[id]/payment` - Update payment status
- `POST /api/orders/[id]/items` - Add items to existing order
- `POST /api/orders/[id]/refund` - Process refund (Midtrans)
- `POST /api/orders/[id]/cancel` - Cancel transaction (Midtrans)

### Payment
- `POST /api/payment/create` - Create Midtrans QRIS payment
- `POST /api/payment/notify` - Midtrans webhook handler

### Stands
- `GET /api/stands` - Get all stands
- `POST /api/stands` - Auto-assign available stand
- `POST /api/stands/[id]/release` - Release stand

### Tables
- `GET /api/tables` - Get all tables
- `POST /api/tables?action=generate-qr` - Download all QR codes as PDF

### Reports
- `GET /api/reports/stats` - Dashboard statistics
- `GET /api/reports/daily?date=YYYY-MM-DD` - Daily report

### Real-time
- `GET /api/sse/orders` - SSE endpoint for real-time order updates

### Shift
- `GET /api/shift` - Get current shift
- `POST /api/shift/open` - Open new shift
- `POST /api/shift/close` - Close current shift

## Project Structure

```
pos-system/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data (58 menu items, 40 tables, 25 stands)
├── src/
│   ├── app/
│   │   ├── /admin/            # Kasir dashboard
│   │   ├── /kitchen/          # Kitchen display
│   │   ├── /login/            # Login page
│   │   ├── /menu/[tableId]/   # Customer QR menu
│   │   ├── /payment/[orderId]/# Payment page
│   │   ├── /queue-display/    # TV queue display
│   │   └── /api/              # API routes
│   ├── components/
│   │   ├── /admin/            # Admin components (PaymentModal)
│   │   ├── /shared/           # Shared components (Receipt)
│   │   └── /ui/               # shadcn/ui components
│   ├── hooks/
│   │   └── useOrderUpdates.ts # SSE hook
│   ├── lib/
│   │   ├── auth.ts            # Auth utilities
│   │   ├── midtrans.ts        # Midtrans integration
│   │   ├── prisma.ts          # Prisma client
│   │   └── qr-generator.ts    # QR code & PDF generation
│   └── types/
│       ├── index.ts           # TypeScript types
│       └── midtrans-client.d.ts
└── package.json
```

## Seeding Data

Database sudah terisi dengan:
- **25 stands** (nomor 1-25)
- **40 tables** (T1-T40) dengan QR codes
- **58 menu items** sesuai menu Warkoem Pul:
  - Nasi (6 items)
  - Signature Noodle (1 item)
  - Mie (5 items)
  - Snack (6 items)
  - Ketan (4 items)
  - Pisang (4 items)
  - Roti Bakar (4 items)
  - Minuman (28 items)
- **2 users** (kasir, kitchen)

## Flow

### Walk-in Dine-in
1. Customer → Counter → Kasir input order
2. Kasir assign stand → Total with tax
3. Customer bayar (Cash/Debit/QRIS)
4. Kasir kasih stand nomor → Order masuk kitchen
5. Kitchen prepare → Mark ready → Waitress antar

### Walk-in Take-away
1. Customer → Counter → Kasir input order
2. Kasir kasih nomor antrian → Customer bayar
3. Kitchen prepare → Queue display update
4. Panggil nomor → Customer ambil

### QR Ordering
1. Customer duduk → Scan QR di meja
2. Browse menu → Add to cart → Checkout
3. Pay via Midtrans QRIS (scan with e-wallet)
4. Payment confirmed → Order masuk kitchen
5. Kitchen prepare → Waitress antar

## Notes

- **Tax**: 10% PPN otomatis dihitung
- **Payment**: Semua order harus bayar dulu (pay-first)
- **Real-time**: SSE untuk live update di dashboard & kitchen
- **Receipt**: Print via browser (Ctrl+P / Cmd+P)
- **QR Codes**: Generate PDF printable dari admin/tables

## License

Internal use only - Warkoem Pul
