# Inventory & Order Management System

A production-ready full-stack Inventory & Order Management System built with **FastAPI + PostgreSQL + React**, fully containerized with Docker.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2, PostgreSQL 15 (psycopg2)
- **Frontend**: React 19 (JavaScript), Tailwind CSS, shadcn/ui, react-router-dom, axios, sonner
- **Database**: PostgreSQL (relational schema with proper foreign keys)
- **Containerization**: Docker + Docker Compose (3 services: `postgres`, `backend`, `frontend`)

## Features

- **Dashboard** — Total products, customers, orders, low-stock alerts
- **Products** — Full CRUD with unique SKU enforcement and non-negative price/quantity
- **Customers** — Add/list/delete with unique email and phone validation
- **Orders** — Multi-product orders with automatic stock deduction, server-side total calculation, and stock restoration on deletion
- **INR currency** formatted with `Intl.NumberFormat('en-IN', ...)`
- **Sample Indian data** auto-seeded on first startup (Rahul Sharma, Wireless Mouse, etc.)
- **Responsive** sidebar layout that collapses to a drawer on mobile
- **Toast notifications** for every success & error path
- **Proper HTTP status codes** — 200 / 201 / 400 / 404 / 409 / 422 / 500

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── products.py
│   │   │   ├── customers.py
│   │   │   ├── orders.py
│   │   │   └── dashboard.py
│   │   ├── database.py        # SQLAlchemy engine + session
│   │   ├── models.py          # ORM models (Product, Customer, Order, OrderItem)
│   │   ├── schemas.py         # Pydantic schemas
│   │   └── seed.py            # Indian demo data
│   ├── server.py              # FastAPI entry point (all routes under /api)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── pages/             # Dashboard, Products, Customers, Orders, OrderCreate, OrderDetail
│   │   ├── components/        # Layout + shadcn/ui
│   │   ├── api/client.js
│   │   ├── lib/format.js
│   │   ├── App.js
│   │   └── index.js
│   ├── nginx.conf             # SPA routing for production container
│   ├── Dockerfile             # Multi-stage build (Node build → nginx serve)
│   └── .dockerignore
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

All routes are prefixed with `/api`.

### Products
- `POST   /api/products`
- `GET    /api/products`
- `GET    /api/products/{id}`
- `PUT    /api/products/{id}`
- `DELETE /api/products/{id}`

### Customers
- `POST   /api/customers`
- `GET    /api/customers`
- `GET    /api/customers/{id}`
- `DELETE /api/customers/{id}`

### Orders
- `POST   /api/orders`
- `GET    /api/orders`
- `GET    /api/orders/{id}`
- `DELETE /api/orders/{id}`   *(restores stock back to inventory)*

### Dashboard
- `GET    /api/dashboard/stats`

## Database Schema

| Table         | Columns                                                                 |
|---------------|-------------------------------------------------------------------------|
| `products`    | id, product_name, **sku_code (UNIQUE)**, price, quantity_in_stock       |
| `customers`   | id, full_name, **email (UNIQUE)**, phone_number                         |
| `orders`      | id, customer_id (FK), total_amount, created_at                          |
| `order_items` | id, order_id (FK), product_id (FK), quantity, price_at_purchase         |

Constraints:
- `products.price >= 0`, `products.quantity_in_stock >= 0`
- `order_items.quantity > 0`, `order_items.price_at_purchase >= 0`

## Business Rules

1. Product SKU must be unique (409 Conflict if duplicate)
2. Customer email must be unique (409 Conflict if duplicate)
3. Product quantity cannot be negative (422 from validator + DB CHECK constraint)
4. Orders are rejected with **409 Conflict** when any product has insufficient stock
5. Stock is **atomically deducted** on successful order creation (transaction + row lock)
6. Total order amount is **always computed on the backend** from current product prices
7. Deleting an order **restores stock** back to inventory
8. A product/customer that is referenced by existing orders cannot be deleted (409 Conflict)

## Running with Docker (recommended)

```bash
# 1. Optional: edit .env.example -> .env
cp .env.example .env

# 2. Build & start everything
docker compose up --build -d

# Services:
#   - PostgreSQL:  localhost:5432
#   - Backend API: http://localhost:8001
#   - Frontend:    http://localhost:3000
```

The PostgreSQL volume `inventory_postgres_data` is persistent across restarts.

To stop:
```bash
docker compose down
# or completely wipe data:
docker compose down -v
```

## Running Locally (without Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
# ensure PostgreSQL is running locally and update DATABASE_URL in backend/.env
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

## Deployment

- **Backend**: deploy as a Docker container to Render / Railway / Fly.io. Set the `DATABASE_URL` environment variable to your managed PostgreSQL connection string.
- **Frontend**: deploy to Vercel / Netlify. Set `REACT_APP_BACKEND_URL` to the public backend URL at build time.

## Sample Indian Data (auto-seeded)

**Customers**: Rahul Sharma, Priya Verma, Amit Kumar, Sneha Gupta, Neha Agarwal, Ankit Singh

**Products** (INR): Wireless Mouse (₹799), Wireless Keyboard (₹1,899), Laptop Stand (₹1,299), Monitor (₹12,499), USB Cable (₹199), Printer Cartridge (₹2,299), Power Bank (₹1,599), Office Chair (₹8,499), Desk Organizer (₹649), Notebook Bundle (₹499)
