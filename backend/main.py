"""
MarkItDown Studio — full conversion backend (optional, self-hosted).

The hosted web app converts common formats (PDF, DOCX, XLSX, CSV, JSON, HTML,
TXT, images, URLs) entirely in the browser. For full-fidelity conversion of
every format Microsoft MarkItDown supports — including PPTX, EPUB, and audio
transcription — run this FastAPI service and point the frontend at it.

Setup:
    pip install markitdown fastapi uvicorn python-multipart
    uvicorn main:app --reload

The service runs on http://127.0.0.1:8000
"""

from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from markitdown import MarkItDown

app = FastAPI(title="MarkItDown Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

md = MarkItDown()
MAX_SIZE = 25 * 1024 * 1024  # 25 MB


def estimate_tokens(text: str) -> int:
    return max(0, len(text) // 4)


def convert_bytes(data: bytes, filename: str) -> dict:
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds the 25MB limit.")
    try:
        result = md.convert_stream(BytesIO(data), file_extension=filename)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"Conversion failed: {exc}") from exc
    markdown = result.text_content or ""
    return {
        "markdown": markdown,
        "token_estimate": estimate_tokens(markdown),
        "original_size": len(data),
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/convert")
async def convert(file: UploadFile = File(...)) -> dict:
    data = await file.read()
    return convert_bytes(data, file.filename or "upload")


@app.post("/convert-batch")
async def convert_batch(files: list[UploadFile] = File(...)) -> list[dict]:
    out = []
    for f in files:
        data = await f.read()
        try:
            out.append({"filename": f.filename, **convert_bytes(data, f.filename or "upload")})
        except HTTPException as exc:
            out.append({"filename": f.filename, "error": exc.detail})
    return out


@app.get("/convert-url")
def convert_url(url: str) -> dict:
    try:
        result = md.convert(url)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"Conversion failed: {exc}") from exc
    markdown = result.text_content or ""
    return {
        "markdown": markdown,
        "token_estimate": estimate_tokens(markdown),
        "original_size": len(markdown.encode("utf-8")),
    }
