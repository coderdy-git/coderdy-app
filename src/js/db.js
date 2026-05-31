import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

let db = null;
const isWeb = Capacitor.getPlatform() === 'web';

// --- SIMPLE WEB FALLBACK (STABLE FOR BROWSER/NGROK) ---
function getWebDB() {
  const data = localStorage.getItem('attendanceDB_v2');
  return data ? JSON.parse(data) : [];
}

function saveWebDB(data) {
  localStorage.setItem('attendanceDB_v2', JSON.stringify(data));
}
// --------------------------------------------------------

export async function initDB() {
  if (isWeb) {
    console.log("Using LocalStorage for Web (Bypassing jeep-sqlite emulator for maximum stability)");
    return;
  }
  
  // --- NATIVE ANDROID/IOS SQLITE INITIALIZATION ---
  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    db = await sqlite.createConnection("attendanceDB", false, "no-encryption", 1, false);
    await db.open();

    const query = `
      CREATE TABLE IF NOT EXISTS attendances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `;
    await db.execute(query);
    console.log('Native SQLite DB initialized and ready.');
  } catch (err) {
    console.error("Native DB Init error:", err);
    db = null;
  }
}

export async function addAttendance(userId, type) {
  const timestamp = new Date().toISOString();
  
  if (isWeb) {
    const data = getWebDB();
    data.push({ id: Date.now(), user_id: userId, timestamp, type, synced: 0 });
    saveWebDB(data);
    return true;
  }
  
  if (!db) return false;
  const query = `INSERT INTO attendances (user_id, timestamp, type, synced) VALUES (?, ?, ?, ?)`;
  await db.run(query, [userId, timestamp, type, 0]);
  return true;
}

export async function getAttendances(userId) {
  if (isWeb) {
    return getWebDB()
      .filter(r => r.user_id === userId)
      .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  
  if (!db) return [];
  const query = `SELECT * FROM attendances WHERE user_id = ? ORDER BY timestamp DESC`;
  const result = await db.query(query, [userId]);
  return result.values || [];
}

export async function getLastAttendance(userId) {
  if (isWeb) {
    const recs = getWebDB()
      .filter(r => r.user_id === userId)
      .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    return recs.length > 0 ? recs[0] : null;
  }
  
  if (!db) return null;
  const query = `SELECT * FROM attendances WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1`;
  const result = await db.query(query, [userId]);
  if (result.values && result.values.length > 0) return result.values[0];
  return null;
}

export async function getUnsyncedAttendances() {
  if (isWeb) {
    return getWebDB().filter(r => r.synced === 0);
  }
  
  if (!db) return [];
  const query = `SELECT * FROM attendances WHERE synced = 0`;
  const result = await db.query(query);
  return result.values || [];
}

export async function markAsSynced(id) {
  if (isWeb) {
    const data = getWebDB();
    const idx = data.findIndex(r => r.id === id);
    if (idx !== -1) {
      data[idx].synced = 1;
      saveWebDB(data);
    }
    return true;
  }
  
  if (!db) return false;
  const query = `UPDATE attendances SET synced = 1 WHERE id = ?`;
  await db.run(query, [id]);
  return true;
}

export async function insertPulledAttendance(record) {
  if (isWeb) {
    const data = getWebDB();
    const exists = data.find(r => Math.abs(new Date(r.timestamp).getTime() - new Date(record.timestamp).getTime()) < 1000 && r.user_id === record.user_id);
    if (!exists) {
      data.push({ id: Date.now() + Math.floor(Math.random() * 1000), user_id: record.user_id, timestamp: record.timestamp, type: record.type, synced: 1 });
      saveWebDB(data);
      return true;
    }
    return false;
  }
  
  if (!db) return false;
  
  // For SQLite, dates might also be stored slightly differently. Compare loosely or trust the strict query if it matches.
  // Actually, SQLite might store it exactly as given, but it's safer to check all.
  const queryAll = `SELECT id, timestamp FROM attendances WHERE user_id = ?`;
  const resAll = await db.query(queryAll, [record.user_id]);
  
  let sqliteExists = false;
  if (resAll.values) {
    const targetTime = new Date(record.timestamp).getTime();
    sqliteExists = resAll.values.some(r => Math.abs(new Date(r.timestamp).getTime() - targetTime) < 1000);
  }
  
  if (!sqliteExists) {
    const query = `INSERT INTO attendances (user_id, timestamp, type, synced) VALUES (?, ?, ?, ?)`;
    await db.run(query, [record.user_id, record.timestamp, record.type, 1]);
    return true;
  }
  return false;
}

export async function clearDB() {
  if (isWeb) {
    localStorage.removeItem('attendanceDB_v2');
    return true;
  }
  
  if (!db) return false;
  try {
    await db.execute(`DELETE FROM attendances`);
  } catch(e) {
    console.error(e);
  }
  return true;
}
