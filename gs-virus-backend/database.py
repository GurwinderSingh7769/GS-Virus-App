import sqlite3
from typing import List, Dict, Any

DB_PATH = "gs_virus.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            filename  TEXT    NOT NULL,
            file_hash TEXT    NOT NULL,
            result    TEXT    NOT NULL,
            timestamp TEXT    NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    print("[GS-Virus] Database initialized.")

def save_scan(record: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO scans (filename, file_hash, result, timestamp) VALUES (?, ?, ?, ?)",
        (record["filename"], record["file_hash"], record["result"], record["timestamp"])
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def get_history() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scans ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_scan_by_id(scan_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0

def get_stats() -> Dict[str, int]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total FROM scans")
    total = cursor.fetchone()["total"]
    cursor.execute("SELECT COUNT(*) as infected FROM scans WHERE result = 'Infected'")
    infected = cursor.fetchone()["infected"]
    cursor.execute("SELECT COUNT(*) as clean FROM scans WHERE result = 'Clean'")
    clean = cursor.fetchone()["clean"]
    conn.close()
    return {"total": total, "infected": infected, "clean": clean}
