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

function getWebDebtsDB() {
  const data = localStorage.getItem('debtsDB_v1');
  return data ? JSON.parse(data) : [];
}

function saveWebDebtsDB(data) {
  localStorage.setItem('debtsDB_v1', JSON.stringify(data));
}

function getWebStaffsDB() {
  const data = localStorage.getItem('staffsDB_v1');
  return data ? JSON.parse(data) : [];
}

function saveWebStaffsDB(data) {
  localStorage.setItem('staffsDB_v1', JSON.stringify(data));
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
    
    const queryDebts = `
      CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        coworker_name TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        is_paid INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `;
    await db.execute(queryDebts);
    
    const queryStaffs = `
      CREATE TABLE IF NOT EXISTS staffs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        whatsapp TEXT,
        total_deposit REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `;
    await db.execute(queryStaffs);
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
    localStorage.removeItem('debtsDB_v1');   // Bug #2 fix
    localStorage.removeItem('staffsDB_v1');  // Bug #2 fix
    return true;
  }
  
  if (!db) return false;
  try {
    await db.execute(`DELETE FROM attendances`);
    await db.execute(`DELETE FROM debts`);
    await db.execute(`DELETE FROM staffs`);
  } catch(e) {
    console.error(e);
  }
  return true;
}

// ================= DEBTS LOCAL LOGIC =================
export async function addDebt(id, userId, coworkerName, amount, description, createdAt, isPaid = 0, synced = 0) {
  if (isWeb) {
    const data = getWebDebtsDB();
    data.push({ id, user_id: userId, coworker_name: coworkerName, amount, description, is_paid: isPaid, created_at: createdAt, synced });
    saveWebDebtsDB(data);
    return true;
  }
  
  if (!db) return false;
  const query = `INSERT INTO debts (id, user_id, coworker_name, amount, description, is_paid, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  await db.run(query, [id, userId, coworkerName, amount, description, isPaid, createdAt, synced]);
  return true;
}

export async function getDebts(userId) {
  if (isWeb) {
    return getWebDebtsDB()
      .filter(r => r.user_id === userId)
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
  
  if (!db) return [];
  const query = `SELECT * FROM debts WHERE user_id = ? ORDER BY created_at DESC`;
  const result = await db.query(query, [userId]);
  return result.values || [];
}

export async function getUnsyncedDebts() {
  if (isWeb) {
    return getWebDebtsDB().filter(r => r.synced === 0);
  }
  
  if (!db) return [];
  const query = `SELECT * FROM debts WHERE synced = 0`;
  const result = await db.query(query);
  return result.values || [];
}

export async function markDebtAsSynced(id) {
  if (isWeb) {
    const data = getWebDebtsDB();
    const idx = data.findIndex(r => r.id === id);
    if (idx !== -1) {
      data[idx].synced = 1;
      saveWebDebtsDB(data);
    }
    return true;
  }
  
  if (!db) return false;
  const query = `UPDATE debts SET synced = 1 WHERE id = ?`;
  await db.run(query, [id]);
  return true;
}

export async function markDebtAsPaidLocal(id) {
  if (isWeb) {
    const data = getWebDebtsDB();
    const idx = data.findIndex(r => r.id === id);
    if (idx !== -1) {
      data[idx].is_paid = 1;
      // Mark as unsynced again if we want to sync the paid status
      data[idx].synced = 0;
      saveWebDebtsDB(data);
    }
    return true;
  }
  
  if (!db) return false;
  const query = `UPDATE debts SET is_paid = 1, synced = 0 WHERE id = ?`;
  await db.run(query, [id]);
  return true;
}

export async function insertPulledDebt(record) {
  if (isWeb) {
    const data = getWebDebtsDB();
    const idx = data.findIndex(r => r.id === record.id);
    if (idx === -1) {
      data.push({ ...record, synced: 1, is_paid: record.is_paid ? 1 : 0 });
    } else {
      data[idx].is_paid = record.is_paid ? 1 : 0;
      data[idx].synced = 1;
    }
    saveWebDebtsDB(data);
    return true;
  }
  
  if (!db) return false;
  
  const queryCheck = `SELECT id FROM debts WHERE id = ?`;
  const resCheck = await db.query(queryCheck, [record.id]);
  
  if (resCheck.values && resCheck.values.length > 0) {
    // Update existing
    await db.run(`UPDATE debts SET is_paid = ?, synced = 1 WHERE id = ?`, [record.is_paid ? 1 : 0, record.id]);
  } else {
    // Insert new
    await db.run(
      `INSERT INTO debts (id, user_id, coworker_name, amount, description, is_paid, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [record.id, record.user_id, record.coworker_name, record.amount, record.description, record.is_paid ? 1 : 0, record.created_at]
    );
  }
  return true;
}

// ================= STAFF LOCAL LOGIC =================
export async function addStaff(id, userId, name, whatsapp, totalDeposit, createdAt, synced = 0) {
  if (isWeb) {
    const data = getWebStaffsDB();
    data.push({ id, user_id: userId, name, whatsapp, total_deposit: totalDeposit, created_at: createdAt, synced });
    saveWebStaffsDB(data);
    return true;
  }
  
  if (!db) return false;
  const query = `INSERT INTO staffs (id, user_id, name, whatsapp, total_deposit, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  await db.run(query, [id, userId, name, whatsapp, totalDeposit, createdAt, synced]);
  return true;
}

export async function getStaffs(userId) {
  if (isWeb) {
    return getWebStaffsDB()
      .filter(r => r.user_id === userId)
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
  
  if (!db) return [];
  const query = `SELECT * FROM staffs WHERE user_id = ? ORDER BY created_at DESC`;
  const result = await db.query(query, [userId]);
  return result.values || [];
}

export async function updateStaffDepositLocal(id, depositChange) {
  if (isWeb) {
    const data = getWebStaffsDB();
    const idx = data.findIndex(r => r.id === id);
    if (idx !== -1) {
      data[idx].total_deposit += depositChange;
      data[idx].synced = 0;
      saveWebStaffsDB(data);
    }
    return true;
  }
  
  if (!db) return false;
  const query = `UPDATE staffs SET total_deposit = total_deposit + ?, synced = 0 WHERE id = ?`;
  await db.run(query, [depositChange, id]);
  return true;
}

export async function updateStaffWaLocal(id, newWa) {
  if (isWeb) {
    const data = getWebStaffsDB();
    const idx = data.findIndex(r => r.id === id);
    if (idx !== -1) {
      data[idx].whatsapp = newWa;
      data[idx].synced = 0;
      saveWebStaffsDB(data);
    }
    return true;
  }
  
  if (!db) return false;
  const query = `UPDATE staffs SET whatsapp = ?, synced = 0 WHERE id = ?`;
  await db.run(query, [newWa, id]);
  return true;
}

export async function updateStaffNameLocal(id, newName) {
  if (isWeb) {
    const data = getWebStaffsDB();
    const idx = data.findIndex(r => r.id === id);
    if (idx !== -1) {
      data[idx].name = newName;
      data[idx].synced = 0;
      saveWebStaffsDB(data);
    }
    return true;
  }
  
  if (!db) return false;
  const query = `UPDATE staffs SET name = ?, synced = 0 WHERE id = ?`;
  await db.run(query, [newName, id]);
  return true;
}

export async function getUnsyncedStaffs() {
  if (isWeb) {
    return getWebStaffsDB().filter(r => r.synced === 0);
  }
  
  if (!db) return [];
  const query = `SELECT * FROM staffs WHERE synced = 0`;
  const result = await db.query(query);
  return result.values || [];
}

export async function markStaffAsSynced(id) {
  if (isWeb) {
    const data = getWebStaffsDB();
    const idx = data.findIndex(r => r.id === id);
    if (idx !== -1) {
      data[idx].synced = 1;
      saveWebStaffsDB(data);
    }
    return true;
  }
  
  if (!db) return false;
  const query = `UPDATE staffs SET synced = 1 WHERE id = ?`;
  await db.run(query, [id]);
  return true;
}

export async function insertPulledStaff(record) {
  if (isWeb) {
    const data = getWebStaffsDB();
    const idx = data.findIndex(r => r.id === record.id);
    if (idx === -1) {
      data.push({ ...record, synced: 1 });
    } else {
      data[idx].total_deposit = record.total_deposit;
      data[idx].name = record.name;
      data[idx].whatsapp = record.whatsapp;
      data[idx].synced = 1;
    }
    saveWebStaffsDB(data);
    return true;
  }
  
  if (!db) return false;
  
  const queryCheck = `SELECT id FROM staffs WHERE id = ?`;
  const resCheck = await db.query(queryCheck, [record.id]);
  
  if (resCheck.values && resCheck.values.length > 0) {
    // Update existing
    await db.run(`UPDATE staffs SET name = ?, whatsapp = ?, total_deposit = ?, synced = 1 WHERE id = ?`, [record.name, record.whatsapp, record.total_deposit, record.id]);
  } else {
    // Insert new
    await db.run(
      `INSERT INTO staffs (id, user_id, name, whatsapp, total_deposit, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [record.id, record.user_id, record.name, record.whatsapp, record.total_deposit, record.created_at]
    );
  }
  return true;
}
