import { getGoogleAccessToken } from "./googleAuth";

type Env = {
  GOOGLE_SHEET_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
};

const API = "https://sheets.googleapis.com/v4/spreadsheets";

async function gsFetch(env: Env, url: string, init?: RequestInit) {
  const token = await getGoogleAccessToken(env);
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function readRange(env: Env, a1: string) {
  const url = `${API}/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(a1)}`;
  return gsFetch(env, url) as Promise<{ values?: string[][] }>;
}

export async function appendRow(env: Env, sheetName: string, row: (string | number)[]) {
  const range = `${sheetName}!A:Z`;
  const url = `${API}/${env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  return gsFetch(env, url, { method: "POST", body: JSON.stringify({ values: [row.map(String)] }) });
}
