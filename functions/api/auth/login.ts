import { readRange } from "../../_lib/sheets";
import { makeSession, COOKIE_NAME } from "../../_lib/session";

type Env = {
  GOOGLE_SHEET_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  SESSION_SECRET: string;
};

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const { email, password } = await request.json();

  // Users!A1:H => başlık + satırlar
  const data = await readRange(env, "Users!A1:H2000");
  const rows = data.values || [];
  const header = rows[0] || [];
  const body = rows.slice(1);

  const idx = (name: string) => header.findIndex((h) => h === name);

  const iEmail = idx("email");
  const iHash = idx("password_hash");
  const iSalt = idx("salt");
  const iRole = idx("role");
  const iRest = idx("restaurant");
  const iName = idx("full_name");
  const iActive = idx("is_active");

  const user = body.find((r) => (r[iEmail] || "").toLowerCase() === String(email).toLowerCase());
  if (!user) return new Response(JSON.stringify({ ok: false }), { status: 401 });

  if (String(user[iActive] || "true") !== "true") return new Response(JSON.stringify({ ok: false }), { status: 403 });

  const salt = user[iSalt] || "";
  const expected = user[iHash] || "";
  const got = await sha256Hex(String(password) + String(salt));

  if (got !== expected) return new Response(JSON.stringify({ ok: false }), { status: 401 });

  const session = await makeSession(env.SESSION_SECRET, {
    email: user[iEmail],
    full_name: user[iName],
    role: user[iRole],
    restaurant: user[iRest],
    ts: Date.now(),
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": `${COOKIE_NAME}=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
    },
  });
};
