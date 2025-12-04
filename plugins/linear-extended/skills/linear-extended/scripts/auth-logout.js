#!/usr/bin/env node
/**
 * Clear Linear OAuth tokens (logout)
 * Usage: node auth-logout.js [--all]
 *
 * --all: Also clear client credentials
 */

import { clearTokens, loadConfig, saveConfig } from './lib/token-store.js';

async function logout() {
  try {
    const clearAll = process.argv.includes('--all');

    await clearTokens();

    if (clearAll) {
      const config = await loadConfig();
      delete config.clientId;
      delete config.clientSecret;
      await saveConfig(config);
    }

    const result = {
      success: true,
      message: clearAll
        ? 'Logged out and cleared all credentials'
        : 'Logged out (client credentials preserved)'
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

logout();
