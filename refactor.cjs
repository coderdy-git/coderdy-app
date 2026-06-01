const fs = require('fs');

let content = fs.readFileSync('src/js/app.js', 'utf8');

// Replace initialization
const initPattern = /import \{ createClient \} from '@supabase\/supabase-js';[\s\S]*?(?=document\.addEventListener)/;
const replacement = "import { AuthService, AttendanceService, UserService } from './api.js';\nimport { initDB, addAttendance, getUnsyncedAttendances, markAsSynced, getLastAttendance, getAttendances, insertPulledAttendance, clearDB } from './db.js';\n\n";
content = content.replace(initPattern, replacement);

// Replace Auth
content = content.replace(/await supabase\.auth\.getSession\(\)/g, "await AuthService.getSession()");
content = content.replace(/supabase\.auth\.onAuthStateChange\(/g, "AuthService.onAuthStateChange(");
content = content.replace(/await supabase\.auth\.signInWithOAuth\(\{[\s\S]*?\}\)/g, "await AuthService.signInWithOAuth()");
content = content.replace(/await supabase\.auth\.signInWithPasskey\(\)/g, "await AuthService.signInWithPasskey()");
content = content.replace(/await supabase\.auth\.registerPasskey\(\)/g, "await AuthService.registerPasskey()");
content = content.replace(/await supabase\.auth\.signOut\(\)/g, "await AuthService.signOut()");
content = content.replace(/supabase\.auth\.passkey\.list\(\)/g, "AuthService.listPasskeys()");
content = content.replace(/window\.PublicKeyCredential && supabase\.auth\.passkey/g, "AuthService.isPasskeySupported()");

// Replace Attendance
content = content.replace(/await supabase\s*\.from\('attendances'\)\s*\.delete\(\)\s*\.eq\('user_id', currentSessionUser\.id\)/g, "await AttendanceService.deleteUserAttendances(currentSessionUser.id)");
content = content.replace(/await supabase\.from\('attendances'\)\.insert\(records\.map/g, "await AttendanceService.insertAttendances(records.map");

const reportQuery = /await supabase\s*\.from\('attendances'\)\s*\.select\('\*'\)\s*\.eq\('user_id', currentSessionUser\.id\)\s*\.gte\('created_at', startDateTime\)\s*\.lte\('created_at', endDateTime\)\s*\.order\('created_at', \{ ascending: false \}\)/g;
content = content.replace(reportQuery, "await AttendanceService.getAttendancesByDateRange(currentSessionUser.id, startDateTime, endDateTime)");

const pullQuery = /await supabase\s*\.from\('attendances'\)\s*\.select\('\*'\)\s*\.eq\('user_id', userId\)\s*\.order\('created_at', \{ ascending: false \}\)\s*\.limit\(20\)/g;
content = content.replace(pullQuery, "await AttendanceService.getRecentAttendances(userId, 20)");

const recentQuery = /await supabase\s*\.from\('attendances'\)\s*\.select\('\*'\)\s*\.eq\('user_id', userId\)\s*\.order\('created_at', \{ ascending: false \}\)\s*\.limit\(5\)/g;
content = content.replace(recentQuery, "await AttendanceService.getRecentAttendances(userId, 5)");

const insertOne = /await supabase\.from\('attendances'\)\.insert\(\{/g;
content = content.replace(insertOne, "await AttendanceService.insertAttendances([{");

const statusEnd = /status: record\.type\s*\}\);/g;
content = content.replace(statusEnd, "status: record.type\n        }]);");

// Replace User
const roleQuery = /supabase\.from\('user_roles'\)\.select\('role'\)\.eq\('user_id', user\.id\)\.single\(\)/g;
content = content.replace(roleQuery, "UserService.getUserRole(user.id)");

fs.writeFileSync('src/js/app.js', content);
