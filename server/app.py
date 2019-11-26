#!/usr/bin/env python3
"""Browserprint app server/endpoint.
"""
from __future__ import annotations

# Stdlib imports
import datetime
import logging
import os
import uuid
from numbers import Number
from typing import List, Optional, Tuple

# Third-party imports
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
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

# Global FastAPI/Starlette application instance
app = FastAPI(
    title="Browserprint Server API",
    description="Serves instrumented web page and collects data reported from it.",
)
app.mount("/static", StaticFiles(directory="static"), name="static")

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


# Web/API handlers
###################


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


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    brid = uuid.uuid4()
    result = await mongo_db["reports"].insert_one(
        {
            "brid": brid,
            "headers": request.headers.items(),
            "when": datetime.datetime.now(),
        }
    )
    logging.info(
        f"inserted new (empty) report record (brid={brid}) -> Mongo _id={result.inserted_id}"
    )

    return templates.TemplateResponse("index.html", {"request": request, "brid": brid})


@app.post("/report", response_model=StatusMessage)
async def post_report(report: BrowserprintReport):
    logging.info(
        f"reporting {report.brid}: got {len(report.features)}-member JSON map with {report.browser}"
    )
    result = await mongo_db["reports"].update_one(
        {"brid": report.brid, "features": {"$exists": False}},
        {"$set": {"browser": report.browser, "features": report.features,}},
    )
    if result.modified_count == 1:
        return {"ok": True}
    else:
        return {"ok": False, "msg": f"unable to find unfulfilled report {report.brid}"}


@app.get("/report", response_model=List[uuid.UUID])
async def list_reports():
    reports = (
        await mongo_db["reports"]
        .find({}, {"_id": 0, "brid": 1, "when": 1})
        .sort([("when", -1)])
        .to_list(None)
    )
    return [r["brid"] for r in reports]


@app.get("/report/{brid}", response_model=BrowserprintFullReport)
async def get_report(brid: uuid.UUID):
    return await mongo_db["reports"].find_one({"brid": brid})


if __name__ == "__main__":
    uvicorn.run(app, host=HTTP_HOST, port=HTTP_PORT)
