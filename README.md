<p align="center">
  <img src="public/Asserts/logo.svg" alt="IndoTech Logo" width="80" />
</p>

<h1 align="center">INDOTECH Dispatch Management System</h1>

<p align="center">
  <strong>Enterprise-grade dispatch, packing, and logistics management platform for transformer manufacturing</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-Private-red" alt="Private" />
</p>

---

## 📋 Overview

The **INDOTECH Dispatch Management System** is a full-stack web application designed for **Indo Tech Transformers Limited (ITTL)** to manage the complete lifecycle of transformer dispatch operations — from work order creation through packing, loading, vehicle management, and final delivery.

Built with **React 19 + Vite** on the frontend and **Supabase** (PostgreSQL + Auth + RLS) on the backend, it provides role-based access control with five distinct user roles.

---

## ✨ Features

### 🔐 Role-Based Access Control
| Role | Access |
|------|--------|
| **Admin** | Full access — all modules, user management, reports, master lists |
| **Supervisor** | All operational modules — create, edit, delete work orders and items |
| **User** | Dashboard, work orders, packing, loading — view and add only |
| **Security** | Vehicle gate management — entry/exit tracking |
| **Dashboard User** | Read-only analytics dashboard |

### 📦 Core Modules
- **Dashboard** — Real-time KPIs, shift-wise analytics, work order progress tracking
- **Work Orders** — Create, edit, approve, and track transformer work orders with MVA/voltage specs
- **Packing List** — Item-level packing management with copy/paste between work orders, status cycling
- **Loading List** — Auto-populated from packed items, container/truck assignment
- **Vehicle Management** — Security gate entry/exit, auto-fill from work orders
- **Dispatch Slip** — Printable dispatch documentation
- **Reports** — Export data as CSV, filterable by date and status
- **Master List** — Centralized reference data (customers, vehicle types, transformer ratings)
- **User Management** — Admin-only user creation with role assignment

### 🎨 Design
- Dark-themed glassmorphism login page with role selection cards
- Professional light theme for operational pages
- Animated icons (Lottie + GIF) for edit, delete, approve, and view actions
- Modern toast notifications with progress bar and type-based styling
- Responsive layout with collapsible sidebar
- DM Sans typography throughout

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, React Router 7 |
| **Backend** | Supabase (PostgreSQL, Auth, Row Level Security) |
| **Styling** | Vanilla CSS with CSS variables |
| **Icons** | Lucide React, Lottie animations, custom GIFs |
| **Auth** | Supabase Auth with role enforcement |
| **Hosting** | Local development (Vite dev server) |

---

## 📁 Project Structure

```
├── public/
│   └── Asserts/              # Logo, icons, animations (GIF, Lottie JSON, PNG)
├── src/
│   ├── assets/               # Bundled assets (loading animation)
│   ├── components/
│   │   ├── Layout.jsx        # Main layout with sidebar + header
│   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   ├── SmartItemInput.jsx # Auto-learning item input component
│   │   └── ToastProvider.jsx  # Modern toast notification system
│   ├── lib/
│   │   ├── supabase.js       # Supabase client (with dev proxy)
│   │   ├── activityLogger.js # Activity audit logging
│   │   └── masterListLearning.js # Auto-learn from master list
│   ├── pages/
│   │   ├── Dashboard.jsx     # Analytics dashboard
│   │   ├── WorkOrders.jsx    # Work order CRUD
│   │   ├── PackingList.jsx   # Packing item management
│   │   ├── LoadingList.jsx   # Loading/container management
│   │   ├── Vehicles.jsx      # Vehicle gate management
│   │   ├── Login.jsx         # Role-based login
│   │   ├── Users.jsx         # User management (Admin only)
│   │   ├── Reports.jsx       # CSV export & reports
│   │   ├── MasterList.jsx    # Reference data management
│   │   ├── StuffList.jsx     # Miscellaneous items
│   │   ├── Email.jsx         # Email notifications
│   │   ├── DispatchSlip.jsx  # Printable dispatch slip
│   │   └── manager/          # Manager-specific views
│   ├── App.jsx               # Root component with routing
│   └── index.css             # Global styles
├── .env.example              # Environment variable template
├── vite.config.js            # Vite config with Supabase proxy
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- A **Supabase** project ([create one free](https://supabase.com))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/KRISH-exe-29/Dispatch-ITTL.git
cd Dispatch-ITTL

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |

> ⚠️ **Never commit `.env` files.** The `.gitignore` is configured to exclude all environment files.

---

## 🗄️ Database Setup

The application requires the following Supabase tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with role assignment |
| `work_orders` | Transformer work orders |
| `packing_items` | Individual packing list items |
| `loading_items` | Loading/container assignments |
| `vehicles` | Vehicle gate entry/exit records |
| `master_list` | Reference data (customers, types, ratings) |
| `activity_log` | Audit trail for all user actions |

Row Level Security (RLS) policies are configured per-role to enforce access control at the database level.

---

## 👥 Default Roles & Login Flow

1. User selects their role on the login screen (Supervisor, User, Dashboard User, Security)
2. Admin access is available via a discrete button in the top-right corner
3. After authentication, the system verifies the user's database role matches the selected login role
4. Mismatched roles are rejected with a clear error message
5. Security users are redirected directly to Vehicle Management

---

## 📄 License

This project is proprietary software developed for **Indo Tech Transformers Limited (ITTL)**.  
Unauthorized reproduction or distribution is prohibited.

---

<p align="center">
  <sub>Built with ❤️ for INDOTECH — Indo Tech Transformers Limited</sub>
</p>
