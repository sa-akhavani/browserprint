#!/usr/bin/env python3
"""Browserprint app server/endpoint.
"""
# Stdlib imports
import datetime
import logging
import os
import uuid
from typing import List, Optional, Tuple

# Third-party imports
import uvicorn
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pydantic import BaseModel
from starlette.requests import Request
from starlette.responses import HTMLResponse
from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

# Tuning knobs
load_dotenv()
HTTP_HOST = os.environ.get("HTTP_HOST", "localhost")
HTTP_PORT = int(os.environ.get("HTTP_PORT", "8080"))
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost/browserprint")
SECRET_PREFIX = os.environ.get("SECRET_PREFIX", "/not-really-that-secret-when-testing")


# Global FastAPI/Starlette application instance
app = FastAPI(
    title="Browserprint Server API",
    description="Serves instrumented web page and collects data reported from it.",
    openapi_url=f"{SECRET_PREFIX}/openapi.json",
    docs_url=f"{SECRET_PREFIX}/docs",
    redoc_url=None,
)
app.mount("/static", StaticFiles(directory="static"), name="static")
router = APIRouter()

# Global template engine
templates = Jinja2Templates(directory="templates")

# Global handles to MongoDB (must be initialized on main event loop)
mongo_session: AsyncIOMotorClient
mongo_db: AsyncIOMotorDatabase


@app.on_event("startup")
async def startup():
    global mongo_session, mongo_db
    mongo_session = AsyncIOMotorClient(MONGO_URL)
    mongo_db = mongo_session.get_database()
    logging.info(f"session created for {MONGO_URL}")


@app.on_event("shutdown")
async def shutdown():
    logging.info("closing database session...")
    mongo_session.close()
    logging.info("done closing database session")


# Main Web Entry Points
##########################


class StatusMessage(BaseModel):
    ok: bool
    msg: Optional[str]


class BrowserprintReport(BaseModel):
    brid: uuid.UUID
    browser: dict
    features: dict


class BrowserprintFullReport(BrowserprintReport):
    when: datetime.datetime
    headers: List[Tuple[str, str]]


@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    brid = uuid.uuid4()
    result = await mongo_db["reports"].insert_one(
        {
            "state": "initiated",
            "brid": brid,
            "headers": request.headers.items(),
            "when": datetime.datetime.now(),
        }
    )
    logging.info(
        f"inserted new (empty) report record (brid={brid}) -> Mongo _id={result.inserted_id}"
    )

    return templates.TemplateResponse("index.html", {"request": request, "brid": brid})


@router.post("/report", response_model=StatusMessage)
async def post_report(report: BrowserprintReport):
    logging.info(
        f"reporting {report.brid}: got {len(report.features)}-member JSON map with {report.browser}"
    )
    result = await mongo_db["reports"].update_one(
        {"brid": report.brid, "state": "initiated"},
        {
            "$set": {
                "state": "completed",
                "browser": report.browser,
                "features": report.features,
            }
        },
    )
    if result.modified_count == 1:
        return {"ok": True}
    else:
        return {
            "ok": False,
            "msg": f"unable to find 'initiated' (i.e., incomplete) report {report.brid}",
        }


@router.get("/report", response_model=List[uuid.UUID])
async def list_reports():
    reports = (
        await mongo_db["reports"]
        .aggregate(
            [
                {"$match": {"state": "completed"}},
                {"$project": {"_id": 0, "brid": 1, "when": 1}},
                {"$sort": {"when": -1}},
            ],
            allowDiskUse=True,
        )
        .to_list(None)
    )
    return [r["brid"] for r in reports]


@router.get("/report/{brid}", response_model=BrowserprintFullReport)
async def get_report(brid: uuid.UUID):
    return await mongo_db["reports"].find_one({"brid": brid})


# Now that the router is complete, wire it up into the app
app.include_router(router, prefix=SECRET_PREFIX)


if __name__ == "__main__":
    uvicorn.run(app, host=HTTP_HOST, port=HTTP_PORT, proxy_headers=True)
