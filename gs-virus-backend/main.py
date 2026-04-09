import hashlib
import httpx
import os
from dotenv import load_dotenv

load_dotenv()
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from database import init_db, save_scan, get_history

app = FastAPI(title="GS-Virus Scanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "YOUR_VIRUSTOTAL_API_KEY_HERE")
VT_URL = "https://www.virustotal.com/api/v3/files/{}"

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
async def root():
    return {"message": "GS-Virus Scanner API is running"}

@app.post("/scan")
async def scan_file(file: UploadFile = File(...)):
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    filename = file.filename

    result = "Unknown"
    details = {}

    try:
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                VT_URL.format(file_hash),
                headers=headers
            )

        if response.status_code == 200:
            data = response.json()
            stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
            malicious = stats.get("malicious", 0)
            suspicious = stats.get("suspicious", 0)
            total = sum(stats.values()) if stats else 0

            if malicious > 0 or suspicious > 0:
                result = "Infected"
                details = {
                    "malicious": malicious,
                    "suspicious": suspicious,
                    "total_engines": total
                }
            else:
                result = "Clean"
                details = {"total_engines": total}

        elif response.status_code == 404:
            result = "Not Found in DB"
            details = {"note": "Hash not found in VirusTotal database. File may be new or unknown."}

        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid VirusTotal API key.")

        else:
            result = "Scan Error"
            details = {"status_code": response.status_code}

    except httpx.RequestError as e:
        result = "Network Error"
        details = {"error": str(e)}

    scan_record = {
        "filename": filename,
        "file_hash": file_hash,
        "result": result,
        "timestamp": datetime.utcnow().isoformat()
    }
    save_scan(scan_record)

    return {
        "filename": filename,
        "file_hash": file_hash,
        "result": result,
        "details": details,
        "timestamp": scan_record["timestamp"]
    }

@app.get("/history")
async def scan_history():
    records = get_history()
    return {"history": records}

@app.delete("/history/{scan_id}")
async def delete_scan(scan_id: int):
    from database import delete_scan_by_id
    deleted = delete_scan_by_id(scan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scan record not found.")
    return {"message": "Scan record deleted successfully."}
