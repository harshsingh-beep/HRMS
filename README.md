# HRMS Lite

A lightweight Human Resource Management System for managing employee records and tracking daily attendance.

## Live Demo

- **Frontend:** [https://hrms-lite-self-iota.vercel.app](https://hrms-lite-self-iota.vercel.app)
- **Backend API:** [https://hrms-liy0.onrender.com/api](https://hrms-liy0.onrender.com/api)
- **API Docs (Swagger):** [https://hrms-liy0.onrender.com/api/docs/](https://hrms-liy0.onrender.com/api/docs/)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| **State Management** | TanStack React Query |
| **Charts** | Recharts |
| **Backend** | Django 6.0, Django REST Framework |
| **Database** | PostgreSQL |
| **API Docs** | drf-spectacular (Swagger/OpenAPI) |
| **Deployment** | Vercel (frontend), Render (backend + PostgreSQL) |

## Features

### Employee Management
- Add, view, and delete employees
- Search employees by name, ID, or department
- Track total present days per employee

### Attendance Management
- Mark daily attendance (Present / Absent)
- Bulk "Mark All Present" for current date
- Filter attendance records by employee or date
- Visual attendance summary with progress bar

### Dashboard
- Total employees, present today, absent today
- Today's attendance rate with animated progress bar
- Department breakdown pie chart
- Quick action buttons

### UI/UX
- Responsive design (desktop + mobile)
- Dark mode with persistence
- Loading skeletons, error banners, and empty states
- Smooth page transitions and micro-animations

## Project Structure

```
HRMS/
├── hrms_lite/              # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── employees/              # Django app
│   ├── models.py           # Employee & Attendance models
│   ├── serializers.py      # DRF serializers with validation
│   ├── views.py            # API views
│   ├── urls.py             # API routes
│   ├── pagination.py       # Custom pagination
│   ├── exceptions.py       # Custom error handler
│   ├── admin.py            # Django admin config
│   └── tests.py            # 18 unit + API tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/          # Dashboard, Employees, Attendance, NotFound
│   │   ├── components/     # AppLayout, AnimatedCounter, ui/
│   │   └── lib/            # API client, config, utils
│   └── public/
├── requirements.txt
├── Procfile
├── build.sh
└── .env.example
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees/` | List all employees |
| POST | `/api/employees/` | Create employee |
| GET | `/api/employees/{id}/` | Get employee details |
| DELETE | `/api/employees/{id}/` | Delete employee (cascades attendance) |
| GET | `/api/attendance/` | List attendance records |
| GET | `/api/attendance/?employee={id}` | Filter by employee |
| GET | `/api/attendance/?date=YYYY-MM-DD` | Filter by date |
| POST | `/api/attendance/` | Mark attendance |
| GET | `/api/dashboard/` | Dashboard summary |

## Error Handling

All API errors return consistent JSON:

```json
{
  "error": "Human-readable message",
  "details": { "field": ["validation error"] }
}
```

- `400` — Validation errors, duplicate attendance
- `404` — Employee not found
- `409` — Duplicate employee ID or email

## Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
# Clone and navigate
git clone https://github.com/harshsingh-beep/HRMS.git
cd HRMS

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations
python manage.py migrate

# Run tests (18 tests)
python manage.py test

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if backend is not on localhost:8000

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Running Tests

```bash
# Backend (18 tests covering models, API endpoints, validations)
python manage.py test

# Frontend
cd frontend && npm run test
```

## Assumptions & Limitations

- Single admin user — no authentication required (as per assignment scope)
- Attendance can only be marked once per employee per date
- Employee deletion cascades to all their attendance records
- Pagination set to 20 records per page (configurable via `?page_size=` param)
