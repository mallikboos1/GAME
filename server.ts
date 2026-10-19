import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// -------------------------------------------------------------
// Persistent User Account Store & Cryptography Helpers
// -------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'jungle-escape-3d-session-hmac-key-2026';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  provider: 'email' | 'github';
  passwordHash?: string;
  passwordSalt?: string;
  avatarUrl?: string;
  createdAt: string;
  saveData?: Record<string, unknown>;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readUsers(): StoredUser[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { hash: derived, salt: usedSalt };
}

function createSessionToken(userId: string): string {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifySessionToken(token?: string): string | null {
  if (!token || !token.includes('.')) return null;
  const [b64, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf-8'));
    if (!payload.uid || Date.now() > payload.exp) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

function extractTokenFromReq(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const match = cookies.find((c) => c.startsWith('je3d_session='));
    if (match) {
      return decodeURIComponent(match.split('=')[1]);
    }
  }
  return null;
}

function setSessionCookie(res: Response, token: string) {
  res.setHeader(
    'Set-Cookie',
    `je3d_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 14}`
  );
}

function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', 'je3d_session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0');
}

function sanitizeUser(u: StoredUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    provider: u.provider,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
    saveData: u.saveData,
  };
}

function getAppBaseUrl(req: Request): string {
  const fromQuery = typeof req.query.origin === 'string' ? req.query.origin.trim() : '';
  if (fromQuery && (fromQuery.startsWith('https://') || fromQuery.startsWith('http://localhost'))) {
    return fromQuery.replace(/\/$/, '');
  }
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

function buildOAuthPopupCallbackHtml(payload: Record<string, unknown>): string {
  const serialized = JSON.stringify(payload).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Authentication Complete</title>
    <style>
      body { background: #09150e; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
      .card { background: #112218; border: 1px solid #f59e0b55; border-radius: 16px; padding: 24px 32px; text-align: center; }
    </style>
  </head>
  <body>
    <div class="card">
      <h3>Authentication Complete</h3>
      <p>Returning to Jungle Escape 3D...</p>
    </div>
    <script>
      (function() {
        var data = ${serialized};
        if (window.opener) {
          window.opener.postMessage(data, '*');
          window.close();
        } else {
          window.location.href = '/';
        }
      })();
    </script>
  </body>
</html>`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // -------------------------------------------------------------
  // 1. Separate Email / Password Registration & Login Routes
  // -------------------------------------------------------------
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password, saveData } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || '').trim();
      const rawPassword = String(password || '');

      if (!cleanName || cleanName.length < 2) {
        res.status(400).json({ error: 'Please enter a valid explorer name (at least 2 characters).' });
        return;
      }
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      if (rawPassword.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        return;
      }

      const users = readUsers();
      const existing = users.find((u) => u.email === cleanEmail);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
        return;
      }

      const { hash, salt } = hashPassword(rawPassword);
      const newUser: StoredUser = {
        id: `usr_${crypto.randomBytes(8).toString('hex')}`,
        name: cleanName.slice(0, 48),
        email: cleanEmail,
        provider: 'email',
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        saveData: saveData && typeof saveData === 'object' ? saveData : undefined,
      };

      users.push(newUser);
      writeUsers(users);

      const token = createSessionToken(newUser.id);
      setSessionCookie(res, token);

      res.json({
        token,
        user: sanitizeUser(newUser),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      const rawPassword = String(password || '');

      if (!cleanEmail || !rawPassword) {
        res.status(400).json({ error: 'Please enter both email and password.' });
        return;
      }

      const users = readUsers();
      const user = users.find((u) => u.email === cleanEmail);
      if (!user || !user.passwordHash || !user.passwordSalt) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const { hash } = hashPassword(rawPassword, user.passwordSalt);
      if (hash !== user.passwordHash) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = createSessionToken(user.id);
      setSessionCookie(res, token);

      res.json({
        token,
        user: sanitizeUser(user),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Login failed.' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const token = extractTokenFromReq(req);
    const uid = verifySessionToken(token || undefined);
    if (!uid) {
      res.status(401).json({ user: null });
      return;
    }
    const users = readUsers();
    const user = users.find((u) => u.id === uid);
    if (!user) {
      res.status(401).json({ user: null });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/auth/sync', (req, res) => {
    const token = extractTokenFromReq(req);
    const uid = verifySessionToken(token || undefined);
    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { saveData } = req.body || {};
    if (!saveData || typeof saveData !== 'object') {
      res.status(400).json({ error: 'Invalid saveData payload' });
      return;
    }
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === uid);
    if (idx === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    users[idx].saveData = saveData;
    writeUsers(users);
    res.json({ synced: true, user: sanitizeUser(users[idx]) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ loggedOut: true });
  });

  app.post('/api/auth/oauth-instant', (req, res) => {
    try {
      const { email, name, saveData } = req.body || {};
      const validProvider = 'github' as const;
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || cleanEmail.split('@')[0] || 'Explorer').trim();

      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      const users = readUsers();
      let user = users.find((u) => u.email === cleanEmail);
      if (!user) {
        user = {
          id: `usr_${validProvider}_${crypto.randomBytes(6).toString('hex')}`,
          name: cleanName.slice(0, 48),
          email: cleanEmail,
          provider: validProvider,
          createdAt: new Date().toISOString(),
          saveData: saveData && typeof saveData === 'object' ? saveData : undefined,
        };
        users.push(user);
      } else {
        user.provider = validProvider;
        if (cleanName) user.name = cleanName.slice(0, 48);
        if (!user.saveData && saveData && typeof saveData === 'object') {
          user.saveData = saveData;
        }
      }
      writeUsers(users);

      const sessionToken = createSessionToken(user.id);
      setSessionCookie(res, sessionToken);

      res.json({
        token: sessionToken,
        user: sanitizeUser(user),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'GitHub sign-in failed.' });
    }
  });

  // -------------------------------------------------------------
  // 2. GitHub OAuth Popup Flow
  // -------------------------------------------------------------
  app.get('/api/auth/github/url', (req, res) => {
    const baseUrl = getAppBaseUrl(req);
    const redirectUri = `${baseUrl}/auth/github/callback`;
    const clientId = process.env.GITHUB_CLIENT_ID;

    if (!clientId) {
      res.json({
        configured: false,
        provider: 'github',
        redirectUri,
        message: 'GITHUB_CLIENT_ID is not set in environment variables.',
      });
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state: Buffer.from(JSON.stringify({ redirectUri })).toString('base64url'),
    });

    res.json({
      configured: true,
      provider: 'github',
      redirectUri,
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    });
  });

  const githubCallbackHandler = async (req: Request, res: Response) => {
    try {
      const code = String(req.query.code || '');
      const stateStr = String(req.query.state || '');
      let redirectUri = `${getAppBaseUrl(req)}/auth/github/callback`;
      if (stateStr) {
        try {
          const parsedState = JSON.parse(Buffer.from(stateStr, 'base64url').toString('utf-8'));
          if (parsedState.redirectUri) redirectUri = parsedState.redirectUri;
        } catch {
          // keep default redirectUri
        }
      }

      if (!code) {
        res.send(
          buildOAuthPopupCallbackHtml({
            type: 'OAUTH_AUTH_ERROR',
            provider: 'github',
            error: 'Missing authorization code from GitHub.',
          })
        );
        return;
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID || '',
          client_secret: process.env.GITHUB_CLIENT_SECRET || '',
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = (await tokenRes.json()) as { access_token?: string; error_description?: string };
      if (!tokenData.access_token) {
        res.send(
          buildOAuthPopupCallbackHtml({
            type: 'OAUTH_AUTH_ERROR',
            provider: 'github',
            error: tokenData.error_description || 'Failed to exchange GitHub OAuth code.',
          })
        );
        return;
      }

      const profileRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Jungle-Escape-3D',
        },
      });
      const profile = (await profileRes.json()) as {
        id?: number;
        login?: string;
        name?: string;
        email?: string;
        avatar_url?: string;
      };

      let email = profile.email;
      if (!email) {
        try {
          const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              'User-Agent': 'Jungle-Escape-3D',
            },
          });
          const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean }>;
          if (Array.isArray(emails) && emails.length > 0) {
            const primary = emails.find((e) => e.primary) || emails[0];
            email = primary.email;
          }
        } catch {
          // fallback below
        }
      }

      const cleanEmail = (email || `${profile.login || profile.id}@users.noreply.github.com`).toLowerCase();
      const displayName = profile.name || profile.login || 'GitHub Explorer';

      const users = readUsers();
      let user = users.find((u) => u.email === cleanEmail);
      if (!user) {
        user = {
          id: `usr_github_${profile.id || crypto.randomBytes(6).toString('hex')}`,
          name: displayName,
          email: cleanEmail,
          provider: 'github',
          avatarUrl: profile.avatar_url,
          createdAt: new Date().toISOString(),
        };
        users.push(user);
      } else {
        user.name = displayName;
        user.avatarUrl = profile.avatar_url || user.avatarUrl;
      }
      writeUsers(users);

      const sessionToken = createSessionToken(user.id);
      setSessionCookie(res, sessionToken);

      res.send(
        buildOAuthPopupCallbackHtml({
          type: 'OAUTH_AUTH_SUCCESS',
          provider: 'github',
          token: sessionToken,
          user: sanitizeUser(user),
        })
      );
    } catch (err) {
      res.send(
        buildOAuthPopupCallbackHtml({
          type: 'OAUTH_AUTH_ERROR',
          provider: 'github',
          error: err instanceof Error ? err.message : 'GitHub OAuth error',
        })
      );
    }
  };

  app.get(['/auth/github/callback', '/auth/github/callback/'], githubCallbackHandler);

  // -------------------------------------------------------------
  // 4. Automatic Error Diagnosis & Self-Healing API Route
  // -------------------------------------------------------------
  app.post('/api/error-healer/analyze', async (req, res) => {
    try {
      const { message, stack, context, gameState, saveDataSnapshot } = req.body || {};

      if (!message) {
        res.status(400).json({ error: 'Missing error message payload.' });
        return;
      }

      const prompt = `You are an automated self-healing engine for the 3D WebGL game "Jungle Escape 3D".
An error was intercepted at runtime. Analyze the error and return a structured automatic remediation plan.

Error Message: ${message}
Stack Trace: ${stack || 'N/A'}
Component / Context: ${context || 'Global Runtime'}
Current Game State: ${gameState || 'UNKNOWN'}
Save Data Snapshot: ${JSON.stringify(saveDataSnapshot || {})}

Choose the most appropriate remediationAction from:
- RESET_SAVE_SCHEMA (if localStorage or save data is corrupted/NaN/null)
- RECOVER_PLAYER_POSITION (if player coordinates, lane, or physics went out of bounds/NaN)
- REBUILD_WEBGL_CONTEXT (if Three.js / WebGL renderer encountered a context or shader error)
- CLEAR_CORRUPTED_STATE (if UI or state machine entered an invalid transition)
- SAFE_CONTINUE (if the error is non-fatal and execution can continue safely)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a deterministic runtime self-healing controller for a 3D endless runner game. Always respond with valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnosis: {
                type: Type.STRING,
                description: 'Concise root-cause diagnosis of the runtime error.',
              },
              remediationAction: {
                type: Type.STRING,
                description:
                  'One of: RESET_SAVE_SCHEMA, RECOVER_PLAYER_POSITION, REBUILD_WEBGL_CONTEXT, CLEAR_CORRUPTED_STATE, SAFE_CONTINUE',
              },
              fixSummary: {
                type: Type.STRING,
                description: 'Short description of the automatic repair that was applied.',
              },
              recommendedSafeLane: {
                type: Type.INTEGER,
                description: 'Safe lane index (-1, 0, or 1) to place the player in.',
              },
            },
            required: ['diagnosis', 'remediationAction', 'fixSummary', 'recommendedSafeLane'],
          },
        },
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);
      res.json({
        healed: true,
        timestamp: new Date().toISOString(),
        ...parsed,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        healed: false,
        error: errMsg,
        remediationAction: 'SAFE_CONTINUE',
        fixSummary: 'Applied local fallback recovery.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
