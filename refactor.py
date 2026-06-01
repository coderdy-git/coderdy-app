import re

with open('src/js/app.js', 'r') as f:
    content = f.read()

# Replace initialization
init_pattern = re.compile(r"import \{ createClient \} from '@supabase/supabase-js';\n.*?(?=document\.addEventListener)", re.DOTALL)
replacement = "import { AuthService, AttendanceService, UserService } from './api.js';\nimport { initDB, addAttendance, getUnsyncedAttendances, markAsSynced, getLastAttendance, getAttendances, insertPulledAttendance, clearDB } from './db.js';\n\n"
content = init_pattern.sub(replacement, content)

# Replace Auth
content = content.replace("await supabase.auth.getSession()", "await AuthService.getSession()")
content = content.replace("supabase.auth.onAuthStateChange(", "AuthService.onAuthStateChange(")
content = content.replace("await supabase.auth.signInWithOAuth({\n        provider: 'google',\n        options: {\n          redirectTo: window.location.origin,\n          queryParams: {\n            prompt: 'select_account'\n          }\n        }\n      })", "await AuthService.signInWithOAuth()")
content = content.replace("await supabase.auth.signInWithPasskey()", "await AuthService.signInWithPasskey()")
content = content.replace("await supabase.auth.registerPasskey()", "await AuthService.registerPasskey()")
content = content.replace("await supabase.auth.signOut()", "await AuthService.signOut()")
content = content.replace("supabase.auth.passkey.list()", "AuthService.listPasskeys()")
content = content.replace("window.PublicKeyCredential && supabase.auth.passkey", "AuthService.isPasskeySupported()")

# Replace Attendance
content = content.replace("await supabase\n        .from('attendances')\n        .delete()\n        .eq('user_id', currentSessionUser.id)", "await AttendanceService.deleteUserAttendances(currentSessionUser.id)")
content = content.replace("await supabase.from('attendances').insert(records.map", "await AttendanceService.insertAttendances(records.map")

report_query = "await supabase\n        .from('attendances')\n        .select('*')\n        .eq('user_id', currentSessionUser.id)\n        .gte('created_at', startDateTime)\n        .lte('created_at', endDateTime)\n        .order('created_at', { ascending: false })"
content = content.replace(report_query, "await AttendanceService.getAttendancesByDateRange(currentSessionUser.id, startDateTime, endDateTime)")

pull_query = "await supabase\n        .from('attendances')\n        .select('*')\n        .eq('user_id', userId)\n        .order('created_at', { ascending: false })\n        .limit(20)"
content = content.replace(pull_query, "await AttendanceService.getRecentAttendances(userId, 20)")

insert_one = "await supabase.from('attendances').insert({"
content = content.replace(insert_one, "await AttendanceService.insertAttendances([{")
content = content.replace("status: record.type\n        });", "status: record.type\n        }]);")

recent_query = "await supabase\n        .from('attendances')\n        .select('*')\n        .eq('user_id', userId)\n        .order('created_at', { ascending: false })\n        .limit(5)"
content = content.replace(recent_query, "await AttendanceService.getRecentAttendances(userId, 5)")

# Replace User
role_query = "supabase.from('user_roles').select('role').eq('user_id', user.id).single()"
content = content.replace(role_query, "UserService.getUserRole(user.id)")

with open('src/js/app.js', 'w') as f:
    f.write(content)
