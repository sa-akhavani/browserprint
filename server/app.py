#!/usr/bin/env python3
"""Browserprint app server/endpoint.
"""
from __future__ import annotations

import os

import uvicorn
from fastapi import FastAPI
from starlette.responses import HTMLResponse

HTTP_HOST = os.environ.get("HTTP_HOST", "localhost")
HTTP_PORT = int(os.environ.get("HTTP_PORT", "8080"))

app = FastAPI(
    title="Browserprint Server API",
    description="Serves instrumented web page and collects data reported from it.",
)


@app.get("/", response_class=HTMLResponse)
async def index():
    return """\
<html>
    <head>
        <title>Browserprint</title>
    </head>
    <body>
        <h1>Browserprint</h1>
    </body>
</html>"""


if __name__ == "__main__":
    uvicorn.run(app, host=HTTP_HOST, port=HTTP_PORT)
