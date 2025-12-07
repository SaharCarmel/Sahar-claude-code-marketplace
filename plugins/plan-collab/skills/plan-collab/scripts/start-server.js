#!/usr/bin/env node
/**
 * Start the plan-collab web server
 * Usage: node start-server.js [--port <port>]
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  loadConfig,
  updateConfig,
  savePid,
  isServerRunning,
  getServerInfo
} from './lib/config-store.js';
import { findAvailablePort, waitForServer, openBrowser } from './lib/server-manager.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEBAPP_DIR = join(__dirname, '..', 'webapp');

export default async function startServer(args) {
  // Check if already running
  if (await isServerRunning()) {
    const info = await getServerInfo();
    console.log(
      JSON.stringify({
        status: 'already_running',
        ...info
      })
    );
    return;
  }

  // Parse port argument
  const portIndex = args.indexOf('--port');
  let port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : null;

  // Find available port if not specified
  if (!port) {
    port = await findAvailablePort(3847);
  }

  const noBrowser = args.includes('--no-browser');

  try {
    // Start Next.js in production mode
    const serverProcess = spawn('npm', ['run', 'start'], {
      cwd: WEBAPP_DIR,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PORT: String(port) }
    });

    // Collect stderr for error reporting
    let stderr = '';
    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle early exit
    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(
          JSON.stringify({
            error: `Server exited with code ${code}`,
            stderr: stderr.slice(0, 500)
          })
        );
        process.exit(1);
      }
    });

    // Wait for server to be ready
    try {
      await waitForServer(port, 30000);
    } catch (err) {
      // Kill the process if it didn't start properly
      try {
        process.kill(serverProcess.pid, 'SIGTERM');
      } catch {}
      throw new Error(`Server failed to start: ${err.message}`);
    }

    // Save PID and config
    await savePid(serverProcess.pid, port);
    await updateConfig({ port });

    // Detach the process so it continues running
    serverProcess.unref();

    const url = `http://localhost:${port}`;

    // Open browser unless disabled
    if (!noBrowser) {
      await openBrowser(url);
    }

    console.log(
      JSON.stringify({
        status: 'started',
        pid: serverProcess.pid,
        port,
        url
      })
    );
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}
