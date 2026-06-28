# MarkItDown Studio — Python Backend (optional)

The web app converts most common formats **directly in your browser** — no server
required. This optional FastAPI service uses Microsoft's official
[`markitdown`](https://github.com/microsoft/markitdown) library to provide
full-fidelity conversion for **every** supported format, including PPTX, EPUB, and
audio transcription.

## Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

## Endpoints

| Method | Route             | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| `GET`  | `/health`         | Health check                                 |
| `POST` | `/convert`        | Upload a single file (multipart)             |
| `POST` | `/convert-batch`  | Upload multiple files (multipart)            |
| `GET`  | `/convert-url`    | Convert a webpage via `?url=`                |

Each conversion returns:

```json
{ "markdown": "…", "token_estimate": 1240, "original_size": 51234 }
```

## Optional: Tesseract OCR

For scanned PDFs / images, install Tesseract so MarkItDown can OCR them:

```bash
# macOS
brew install tesseract
# Debian/Ubuntu
sudo apt-get install tesseract-ocr
```
