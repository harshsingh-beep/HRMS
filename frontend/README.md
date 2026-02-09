# HRMS Lite — Frontend

A modern, animated frontend for the HRMS Lite Human Resource Management System.

## Tech Stack

- **React 18** + TypeScript
- **Vite** — fast build tool
- **Tailwind CSS** + **shadcn/ui** — styling & components
- **Framer Motion** — animations
- **TanStack React Query** — server state management
- **Recharts** — dashboard charts
- **Axios** — HTTP client
- **React Router** — client-side routing

## Pages

- **Dashboard** (`/`) — Stats, department chart, quick actions
- **Employees** (`/employees`) — CRUD employee management with search
- **Attendance** (`/attendance`) — Mark & view attendance with filters

## Setup

```sh
# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env

# Start dev server
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api` |
