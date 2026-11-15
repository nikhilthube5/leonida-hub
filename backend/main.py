from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI(title="Leonida Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_KEY = "yash123"

def init_db():
    conn = sqlite3.connect("leonida.db")
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS cheats (id INTEGER PRIMARY KEY, title TEXT, category TEXT, ps5 TEXT, xbox TEXT, locked INTEGER)")
    c.execute("CREATE TABLE IF NOT EXISTS map_pins (id INTEGER PRIMARY KEY, title TEXT, type TEXT, x REAL, y REAL, desc TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS scam_keywords (id INTEGER PRIMARY KEY, keyword TEXT)")
    
    c.execute("SELECT COUNT(*) FROM cheats")
    if c.fetchone()[0] == 0:
        sample_cheats = [
            ("Full Health & Armor", "Player", "CIRCLE, L1, TRIANGLE, R2, X, SQUARE, CIRCLE, RIGHT, SQUARE, L1, L1, L1", "B, LB, Y, RT, A, X, B, RIGHT, X, LB, LB, LB", 0),
            ("Spawn Comet Sports Car", "Vehicles", "R1, CIRCLE, R2, RIGHT, L1, L2, X, X, SQUARE, R1", "RB, B, RT, RIGHT, LB, LT, A, A, X, RB", 0),
            ("Lower Wanted Level", "Police", "R1, R1, CIRCLE, R2, RIGHT, LEFT, RIGHT, LEFT, RIGHT, LEFT", "RB, RB, B, RT, RIGHT, LEFT, RIGHT, LEFT, RIGHT, LEFT", 0),
            ("Super Jump (Secret)", "Special", "LEFT, LEFT, TRIANGLE, TRIANGLE, RIGHT, RIGHT, LEFT, RIGHT, SQUARE, R1, R2", "LEFT, LEFT, Y, Y, RIGHT, RIGHT, LEFT, RIGHT, X, RB, RT", 1),
            ("Explosive Bullets (Secret)", "Weapons", "RIGHT, SQUARE, X, LEFT, R1, R2, LEFT, RIGHT, RIGHT, L1, L1, L1", "RIGHT, X, A, LEFT, RB, RT, LEFT, RIGHT, RIGHT, LB, LB, LB", 1)
        ]
        c.executemany("INSERT INTO cheats (title, category, ps5, xbox, locked) VALUES (?, ?, ?, ?, ?)", sample_cheats)

    c.execute("SELECT COUNT(*) FROM map_pins")
    if c.fetchone()[0] == 0:
        sample_pins = [
            ("Vice Beach Hypercar", "car", 72.5, 45.0, "Rare Pegassi Supercar spawns here after midnight."),
            ("Secret Military Bunker", "weapon", 28.0, 32.0, "Heavy Railgun & Armor stash inside."),
            ("Leonida UFO Easter Egg", "easter", 50.0, 78.0, "Visible at 3:00 AM during stormy weather.")
        ]
        c.executemany("INSERT INTO map_pins (title, type, x, y, desc) VALUES (?, ?, ?, ?, ?)", sample_pins)
    
    conn.commit()
    conn.close()

init_db()

class ScanRequest(BaseModel):
    query: str

class CheatCreate(BaseModel):
    admin_key: str
    title: str
    category: str
    ps5: str
    xbox: str
    locked: int = 0

class PinCreate(BaseModel):
    admin_key: str
    title: str
    type: str
    x: float
    y: float
    desc: str

class ScamKeywordCreate(BaseModel):
    admin_key: str
    keyword: str

@app.post("/api/scan")
def scan_link(req: ScanRequest):
    q = req.query.lower().strip()
    conn = sqlite3.connect("leonida.db")
    custom_flags = [r[0].lower() for r in conn.execute("SELECT keyword FROM scam_keywords").fetchall()]
    conn.close()

    red_flags = [".apk", ".exe", "android", "ios", "mobile", "crack", "torrent", "free download", "mod", "beta key", "mediafire", "mega.nz"] + custom_flags
    safe_domains = ["rockstargames.com", "playstation.com", "xbox.com", "store.steampowered.com"]

    if any(safe in q for safe in safe_domains) and not any(flag in q for flag in red_flags):
        return {
            "status": "SAFE",
            "risk_score": "0%",
            "message": "Official / Verified Gaming Domain detected.",
            "action": "Safe to browse."
        }
    
    if any(flag in q for flag in red_flags) or "gta6" in q or "gta 6" in q:
        return {
            "status": "DANGER",
            "risk_score": "98% HIGH RISK",
            "message": "FAKE / MALWARE ALERT: GTA 6 is ONLY on PS5 & Xbox Series X/S. Any Android APK, PC Crack, or Free Installer is a Trojan/Stealer!",
            "action": "DO NOT DOWNLOAD. Scan your device immediately."
        }

    return {
        "status": "WARNING",
        "risk_score": "65% SUSPICIOUS",
        "message": "Unverified third-party source. Never enter your PSN/Xbox login or download files from unknown links.",
        "action": "Verify on Rockstar Games official site first."
    }

@app.get("/api/cheats")
def get_cheats():
    conn = sqlite3.connect("leonida.db")
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM cheats ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/cheats")
def add_cheat(item: CheatCreate):
    if item.admin_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Wrong Admin Password")
    conn = sqlite3.connect("leonida.db")
    conn.execute("INSERT INTO cheats (title, category, ps5, xbox, locked) VALUES (?, ?, ?, ?, ?)",
                 (item.title, item.category, item.ps5, item.xbox, item.locked))
    conn.commit()
    conn.close()
    return {"message": "Cheat added!"}

@app.get("/api/pins")
def get_pins():
    conn = sqlite3.connect("leonida.db")
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM map_pins ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/pins")
def add_pin(item: PinCreate):
    if item.admin_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Wrong Admin Password")
    conn = sqlite3.connect("leonida.db")
    conn.execute("INSERT INTO map_pins (title, type, x, y, desc) VALUES (?, ?, ?, ?, ?)",
                 (item.title, item.type, item.x, item.y, item.desc))
    conn.commit()
    conn.close()
    return {"message": "Map pin added!"}

@app.post("/api/scam-keywords")
def add_scam_keyword(item: ScamKeywordCreate):
    if item.admin_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Wrong Admin Password")
    conn = sqlite3.connect("leonida.db")
    conn.execute("INSERT INTO scam_keywords (keyword) VALUES (?)", (item.keyword,))
    conn.commit()
    conn.close()
    return {"message": "Scam keyword added!"}
