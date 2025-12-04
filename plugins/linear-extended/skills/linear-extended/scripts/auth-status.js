#!/usr/bin/env node
/**
 * Check Linear authentication status
 * Usage: node auth-status.js
 */

import { isAuthenticated, loadConfig } from './lib/token-store.js';

async function checkStatus() {
  try {
    const status = await isAuthenticated();
    const config = await loadConfig();

    const result = {
      authenticated: status.authenticated,
      method: status.method || null
    };

    if (status.method === 'api_key') {
      result.message = 'Using LINEAR_API_KEY environment variable';
    } else if (status.method === 'oauth') {
      result.expiresAt = status.expiresAt;
      result.expired = status.expired;
      result.canRefresh = status.canRefresh;
      result.scope = status.scope;

      if (status.expired && status.canRefresh) {
        result.message = 'Token expired but can be refreshed automatically';
      } else if (status.expired) {
        result.message = 'Token expired. Run auth-login.js to re-authenticate';
      } else {
        result.message = 'Authenticated via OAuth';
      }
    } else {
      result.message = 'Not authenticated. Run auth-login.js or set LINEAR_API_KEY';
    }

    // Include whether client credentials are configured
    result.clientConfigured = !!(config.clientId && config.clientSecret);

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

checkStatus();
