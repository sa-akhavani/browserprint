#!/usr/bin/env python3
"""Browserprint app server/endpoint.
"""
from __future__ import annotations

import os

import uvicorn
from fastapi import FastAPI
from starlette.responses import RedirectResponse
from starlette.staticfiles import StaticFiles

HTTP_HOST = os.environ.get("HTTP_HOST", "localhost")
HTTP_PORT = int(os.environ.get("HTTP_PORT", "8080"))
DEV_MODE = "DEV_MODE" in os.environ

app = FastAPI(
    title="Browserprint Server API",
    description="Serves instrumented web page and collects data reported from it.",
)


@app.get("/", response_class=RedirectResponse)
async def index():
    return RedirectResponse("/static/allthethings.html")


app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    if DEV_MODE:
        uvicorn.run(app, host=HTTP_HOST, port=HTTP_PORT, reload=True, log_level="debug")
    else:
        uvicorn.run(app, host=HTTP_HOST, port=HTTP_PORT)
