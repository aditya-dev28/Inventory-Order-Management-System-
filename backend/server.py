"""FastAPI application entry-point for Inventory & Order Management System."""
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.routes import customers as customers_routes  # noqa: E402
from app.routes import dashboard as dashboard_routes  # noqa: E402
from app.routes import orders as orders_routes  # noqa: E402
from app.routes import products as products_routes  # noqa: E402
from app.seed import seed_if_empty, backfill_seed_addresses  # noqa: E402
from sqlalchemy import text  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("inventory")

app = FastAPI(title="Inventory & Order Management API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Idempotent migration: add new columns to customers if missing
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at "
            "TIMESTAMPTZ NOT NULL DEFAULT NOW()"
        ))
        conn.execute(text(
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line1 "
            "VARCHAR(255) NOT NULL DEFAULT ''"
        ))
        conn.execute(text(
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255)"
        ))
        conn.execute(text(
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS city "
            "VARCHAR(100) NOT NULL DEFAULT ''"
        ))
        conn.execute(text(
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS state "
            "VARCHAR(100) NOT NULL DEFAULT ''"
        ))
        conn.execute(text(
            "ALTER TABLE customers ADD COLUMN IF NOT EXISTS postal_code "
            "VARCHAR(20) NOT NULL DEFAULT ''"
        ))
    logger.info("Database tables ensured.")

    if os.environ.get("AUTO_SEED", "false").lower() == "true":
        db = SessionLocal()
        try:
            seed_if_empty(db)
            backfill_seed_addresses(db)
            logger.info("Seed data applied (if database was empty).")
        finally:
            db.close()


# Validation error formatter -> 422 with clear messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for err in exc.errors():
        loc = ".".join(str(p) for p in err.get("loc", []) if p != "body")
        errors.append({"field": loc, "message": err.get("msg", "Invalid value")})
    return JSONResponse(status_code=422, content={"detail": "Validation error", "errors": errors})


# All API routes under /api
api_router = APIRouter(prefix="/api")


@api_router.get("/")
def root() -> dict:
    return {"message": "Inventory & Order Management API", "status": "ok"}


@api_router.get("/health")
def health() -> dict:
    return {"status": "healthy"}


api_router.include_router(products_routes.router)
api_router.include_router(customers_routes.router)
api_router.include_router(orders_routes.router)
api_router.include_router(dashboard_routes.router)

app.include_router(api_router)
