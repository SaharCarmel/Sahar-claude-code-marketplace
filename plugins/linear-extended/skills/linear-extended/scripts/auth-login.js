#!/usr/bin/env node
/**
 * Linear OAuth Device Flow Login
 * Usage: node auth-login.js [--client-id <id>] [--client-secret <secret>]
 *
 * First time: Provide client credentials (will be saved)
 * After that: Just run without arguments
 */

import readline from 'readline';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  exchangeCodeForToken,
  saveClientCredentials,
  getClientCredentials,
  OAUTH_AUTHORIZE_URL
} from './lib/token-store.js';

// Parse command line arguments
function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--client-id' && args[i + 1]) {
      result.clientId = args[++i];
    } else if (args[i] === '--client-secret' && args[i + 1]) {
      result.clientSecret = args[++i];
    }
  }
  return result;
}

// Prompt user for input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr // Use stderr so JSON output isn't mixed
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function login() {
  try {
    const args = parseArgs(process.argv.slice(2));

    // Get or set client credentials
    let { clientId, clientSecret } = await getClientCredentials();

    if (args.clientId) {
      clientId = args.clientId;
    }
    if (args.clientSecret) {
      clientSecret = args.clientSecret;
    }

    // If credentials provided via args, save them
    if (args.clientId || args.clientSecret) {
      if (!clientId || !clientSecret) {
        console.error(JSON.stringify({
          error: 'Both --client-id and --client-secret are required when setting credentials'
        }));
        process.exit(1);
      }
      await saveClientCredentials(clientId, clientSecret);
    }

    // Check if we have credentials
    if (!clientId || !clientSecret) {
      console.error(JSON.stringify({
        error: 'No client credentials configured. First run with: node auth-login.js --client-id <id> --client-secret <secret>',
        help: 'Create an OAuth app at Linear Settings > API > OAuth Applications'
      }));
      process.exit(1);
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // For device flow, we use the special OOB redirect URI
    const redirectUri = 'urn:ietf:wg:oauth:2.0:oob';

    // Build authorization URL
    const authUrl = new URL(OAUTH_AUTHORIZE_URL);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'read,write');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Output instructions to stderr so they don't mix with JSON
    console.error('\n========================================');
    console.error('Linear OAuth Authentication');
    console.error('========================================\n');
    console.error('Step 1: Open this URL in your browser:\n');
    console.error(authUrl.toString());
    console.error('\nStep 2: Log in and authorize the application');
    console.error('Step 3: Copy the authorization code shown on the page\n');

    // Prompt for code
    const code = await prompt('Paste the authorization code here: ');

    if (!code) {
      console.error(JSON.stringify({ error: 'No authorization code provided' }));
      process.exit(1);
    }

    // Exchange code for tokens
    console.error('\nExchanging code for tokens...');
    const tokens = await exchangeCodeForToken(code, codeVerifier, redirectUri);

    console.log(JSON.stringify({
      success: true,
      message: 'Successfully authenticated with Linear!',
      expiresIn: tokens.expires_in,
      scope: tokens.scope
    }, null, 2));

  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

login();
