#!/usr/bin/env python3
"""Browserprint app server/endpoint.
"""
from __future__ import annotations

# Stdlib imports
import logging
import os
import uuid
from numbers import Number
from typing import List, Mapping, Optional, Union

# Third-party imports
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from starlette.requests import Request
from starlette.responses import Response
from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

# Tuning knobs
HTTP_HOST = os.environ.get("HTTP_HOST", "localhost")
HTTP_PORT = int(os.environ.get("HTTP_PORT", "8080"))

# Global FastAPI/Starlette application instance
app = FastAPI(
    title="Browserprint Server API",
    description="Serves instrumented web page and collects data reported from it.",
)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Global template engine
templates = Jinja2Templates(directory="templates")


# Web/API handlers
###################


class StatusMessage(BaseModel):
    ok: bool
    msg: Optional[str]


class BrowserprintReport(BaseModel):
    uuid: uuid.UUID
    browser: dict
    features: dict


@app.get("/", response_class=Response)
async def index(request: Request) -> Response:
    return templates.TemplateResponse(
        "index.html", {"request": request, "uuid": uuid.uuid4()}
    )


@app.post("/report", response_model=StatusMessage)
async def post_report(report: BrowserprintReport):
    logging.info(
        f"reporting {report.uuid}: got {len(report.features)}-member JSON map with {report.browser}"
    )
    return {
        "ok": True,
        "msg": f"we got your report for {report.uuid}",
    }


@app.get("/report", response_model=List[uuid.UUID])
async def list_reports():
    return []


@app.get("/report/{uuid}", response_model=BrowserprintReport)
async def get_report(uuid: uuid.UUID):
    return {
        "uuid": uuid,
        "browser": {"nacho": "browser",},
        "features": {},
    }


if __name__ == "__main__":
    uvicorn.run(app, host=HTTP_HOST, port=HTTP_PORT)
