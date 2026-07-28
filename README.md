# 🛒 PoS-web (Point of Sales)

An enterprise-grade, modern, and highly scalable Point of Sales (POS) web application. Designed to streamline daily sales operations, track inventory, manage shifts, and monitor business analytics in real-time.

## ✨ Key Features
- **Rapid Transaction Processing**: Optimized for quick checkout and seamless user experience.
- **Table & Queue Management**: Supports QR-code-based table mapping and dynamic queue systems for F&B.
- **Real-time Inventory**: Synchronized stock tracking across multiple stands/terminals.
- **Shift Management**: End-to-end shift tracking with opening/closing cash reconciliation.
- **Comprehensive Analytics**: Monitor total sales, transactions, and business health.
- **Role-Based Access Control**: Secure multi-tenant user sessions and audit logs.

## 💻 Tech Stack
- **Framework**: Next.js (App Router), React
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Radix UI (shadcn/ui)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication & Security**: Custom JWT-based sessions, Rate Limiting

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)

### 1. Clone & Install
```bash
git clone https://github.com/prayersrain/PoS-web.git
cd PoS-web
npm install
```

### 2. Environment Variables
Copy the example environment file and fill in your database credentials:
```bash
cp .env.example .env
```

### 3. Database Migration
Initialize the database schema using Prisma:
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to view the application.

## 📝 License
This project is part of a professional portfolio and demonstration of Full-Stack engineering capabilities.