/**
 * Token storage and management for Linear OAuth
 * Stores tokens in ~/.linear-extended/config.json
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const CONFIG_DIR = path.join(os.homedir(), '.linear-extended');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

// Linear OAuth endpoints
export const OAUTH_AUTHORIZE_URL = 'https://linear.app/oauth/authorize';
export const OAUTH_TOKEN_URL = 'https://api.linear.app/oauth/token';

// These will be set by the user or embedded in auth-login.js
// For now, we'll read from environment or config
export async function getClientCredentials() {
  const config = await loadConfig();
  return {
    clientId: process.env.LINEAR_CLIENT_ID || config.clientId,
    clientSecret: process.env.LINEAR_CLIENT_SECRET || config.clientSecret
  };
}

/**
 * Generate PKCE code verifier (43-128 characters)
 */
export function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge from verifier
 */
export function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Load config from disk
 */
export async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Save config to disk
 */
export async function saveConfig(config) {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

/**
 * Save OAuth tokens
 */
export async function saveTokens(tokens) {
  const config = await loadConfig();
  config.accessToken = tokens.access_token;
  config.refreshToken = tokens.refresh_token;
  config.expiresAt = Date.now() + (tokens.expires_in * 1000);
  config.scope = tokens.scope;
  config.tokenType = tokens.token_type;
  await saveConfig(config);
}

/**
 * Clear stored tokens (logout)
 */
export async function clearTokens() {
  const config = await loadConfig();
  delete config.accessToken;
  delete config.refreshToken;
  delete config.expiresAt;
  delete config.scope;
  delete config.tokenType;
  await saveConfig(config);
}

/**
 * Refresh the access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = await getClientCredentials();

  if (!clientId || !clientSecret) {
    throw new Error('Client credentials not configured. Run auth-login.js first.');
  }

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const tokens = await response.json();
  await saveTokens(tokens);
  return tokens.access_token;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForToken(code, codeVerifier, redirectUri) {
  const { clientId, clientSecret } = await getClientCredentials();

  if (!clientId || !clientSecret) {
    throw new Error('Client credentials not configured.');
  }

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens = await response.json();
  await saveTokens(tokens);
  return tokens;
}

/**
 * Get a valid access token, refreshing if necessary
 * Falls back to LINEAR_API_KEY environment variable
 */
export async function getAccessToken() {
  // First check for environment variable (backwards compatibility)
  if (process.env.LINEAR_API_KEY) {
    return process.env.LINEAR_API_KEY;
  }

  const config = await loadConfig();

  if (!config.accessToken) {
    throw new Error('Not authenticated. Run auth-login.js first, or set LINEAR_API_KEY environment variable.');
  }

  // Check if token is expired (with 5 minute buffer)
  const bufferMs = 5 * 60 * 1000;
  if (config.expiresAt && Date.now() > (config.expiresAt - bufferMs)) {
    if (config.refreshToken) {
      try {
        return await refreshAccessToken(config.refreshToken);
      } catch (err) {
        throw new Error(`Token expired and refresh failed: ${err.message}. Run auth-login.js again.`);
      }
    } else {
      throw new Error('Token expired and no refresh token available. Run auth-login.js again.');
    }
  }

  return config.accessToken;
}

/**
 * Check if currently authenticated
 */
export async function isAuthenticated() {
  if (process.env.LINEAR_API_KEY) {
    return { authenticated: true, method: 'api_key' };
  }

  const config = await loadConfig();

  if (!config.accessToken) {
    return { authenticated: false };
  }

  const bufferMs = 5 * 60 * 1000;
  const expired = config.expiresAt && Date.now() > (config.expiresAt - bufferMs);
  const canRefresh = !!config.refreshToken;

  return {
    authenticated: !expired || canRefresh,
    method: 'oauth',
    expired,
    canRefresh,
    expiresAt: config.expiresAt ? new Date(config.expiresAt).toISOString() : null,
    scope: config.scope
  };
}

/**
 * Save client credentials to config
 */
export async function saveClientCredentials(clientId, clientSecret) {
  const config = await loadConfig();
  config.clientId = clientId;
  config.clientSecret = clientSecret;
  await saveConfig(config);
}
