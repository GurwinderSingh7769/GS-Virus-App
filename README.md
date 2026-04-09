# GS-Virus — Advanced Threat Scanner

A cybersecurity-themed antivirus scanner web app powered by **FastAPI**, **React + Tailwind CSS**, and **SQLite**, with **VirusTotal API** integration.

---

## Project Structure

```
gs-virus/
├── backend/
│   ├── main.py          # FastAPI app — /scan and /history endpoints
│   ├── database.py      # SQLite helpers (init, save, fetch, delete)
│   └── requirements.txt
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx      # Main React component
    │   ├── index.js
    │   └── index.css    # Tailwind directives + scrollbar style
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## Backend Setup

### 1. Get a VirusTotal API Key
- Sign up free at https://www.virustotal.com
- Go to your profile → API Key

### 2. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Set your API key
Either set an environment variable:
```bash
export VIRUSTOTAL_API_KEY="your_actual_key_here"
```
Or replace the placeholder string in `main.py`:
```python
VIRUSTOTAL_API_KEY = "your_actual_key_here"
```

### 4. Run the server
```bash
uvicorn main:app --reload --port 8000
```

API will be live at: http://localhost:8000
Interactive docs: http://localhost:8000/docs

---

## Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Start dev server
```bash
npm start
```

App will open at: http://localhost:3000

---

## API Endpoints

| Method | Endpoint          | Description                        |
|--------|-------------------|------------------------------------|
| POST   | `/scan`           | Upload file → SHA-256 + VirusTotal |
| GET    | `/history`        | Fetch all past scan results        |
| DELETE | `/history/{id}`   | Delete a specific scan record      |

---

## Features

- **Drag & Drop** file upload zone
- **SHA-256** hashing of every uploaded file
- **VirusTotal** hash lookup (free tier: 4 requests/min)
- **Scan result** display with threat details
- **Scan History** table with status badges
- **Delete** individual records
- Deep Black + Crimson Red cybersecurity theme
- Lucide React icons throughout

---

## Notes

- VirusTotal free tier allows **4 lookups/minute** and **500/day**
- If a file hash isn't in VirusTotal's DB, you'll see "Not Found in DB" — this doesn't mean the file is safe
- For full file submission (new files), the `/files` endpoint upgrade would be needed (paid tier or extended free)
