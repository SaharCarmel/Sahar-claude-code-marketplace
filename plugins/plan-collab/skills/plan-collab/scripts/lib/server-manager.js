/**
 * Server process management utilities
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';

const execAsync = promisify(exec);

/**
 * Check if a port is available
 */
export function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

/**
 * Find an available port starting from preferred
 */
export async function findAvailablePort(preferred = 3847) {
  const range = [preferred, ...Array.from({ length: 20 }, (_, i) => preferred + i + 1)];

  for (const port of range) {
    if (await checkPort(port)) {
      return port;
    }
  }

  throw new Error(`No available port found in range ${preferred}-${preferred + 20}`);
}

/**
 * Check if a port has a running server
 */
export async function isPortResponding(port, timeout = 2000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`http://localhost:${port}/api/health`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for server to be ready
 */
export async function waitForServer(port, timeout = 30000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await isPortResponding(port)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`Server failed to start within ${timeout}ms`);
}

/**
 * Open URL in default browser
 */
export async function openBrowser(url) {
  const platform = process.platform;
  let cmd;

  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  try {
    await execAsync(cmd);
    return true;
  } catch (err) {
    console.error(`Failed to open browser: ${err.message}`);
    return false;
  }
}

/**
 * Kill a process by PID
 */
export async function killProcess(pid, signal = 'SIGTERM') {
  try {
    process.kill(pid, signal);
    return true;
  } catch (err) {
    if (err.code === 'ESRCH') {
      return false; // Process doesn't exist
    }
    throw err;
  }
}

/**
 * Wait for process to exit
 */
export async function waitForExit(pid, timeout = 10000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      process.kill(pid, 0);
      await new Promise((r) => setTimeout(r, 200));
    } catch {
      return true; // Process exited
    }
  }

  return false; // Timeout
}
