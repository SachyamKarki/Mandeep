// Login accounts and their signed-in sessions.
import "server-only";
import { query } from "@/lib/db";

export type AppUser = {
  user_id: number;
  full_name: string;
  email: string;
  role: "admin" | "staff";
  is_active: number;
  locked: number;
  last_login_at: string | null;
  created_at: string;
  sessions: number;
};

export const USERS_SQL = `SELECT u.user_id, u.full_name, u.email, u.role, u.is_active,
       COALESCE(u.locked_until > NOW(), 0) AS locked,
       u.last_login_at, u.created_at,
       COUNT(s.token_hash) AS sessions
FROM app_user u
LEFT JOIN user_session s ON s.user_id = u.user_id AND s.expires_at > NOW()
GROUP BY u.user_id
ORDER BY u.role = 'admin' DESC, u.is_active DESC, u.full_name`;

export const getUsers = () => query<AppUser>(USERS_SQL);

export type UserSession = { token_hash: string; created_at: string; expires_at: string; user_agent: string | null };

export const MY_SESSIONS_SQL = `SELECT token_hash, created_at, expires_at, user_agent
FROM user_session
WHERE user_id = ? AND expires_at > NOW()
ORDER BY created_at DESC`;

export const getSessionsFor = (userId: number) => query<UserSession>(MY_SESSIONS_SQL, [userId]);
