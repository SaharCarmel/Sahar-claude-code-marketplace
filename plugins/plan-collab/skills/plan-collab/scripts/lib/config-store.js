/**
 * Configuration and state management for plan-collab
 * Stores in ~/.plan-collab/config.json
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.plan-collab');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const PID_PATH = path.join(CONFIG_DIR, 'server.pid');

/**
 * Ensure config directory exists with secure permissions
 */
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Load configuration from disk
 */
export async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      port: null,
      activePlan: null,
      lastSync: null,
      autoOpen: true
    };
  }
}

/**
 * Save configuration to disk
 */
export async function saveConfig(config) {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

/**
 * Update specific config values
 */
export async function updateConfig(updates) {
  const config = await loadConfig();
  const newConfig = { ...config, ...updates };
  await saveConfig(newConfig);
  return newConfig;
}

/**
 * Save server PID
 */
export async function savePid(pid, port) {
  await ensureConfigDir();
  const data = JSON.stringify({ pid, port, startedAt: new Date().toISOString() });
  await fs.writeFile(PID_PATH, data, { mode: 0o600 });
}

/**
 * Load server PID info
 */
export async function loadPid() {
  try {
    const data = await fs.readFile(PID_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Clear PID file
 */
export async function clearPid() {
  try {
    await fs.unlink(PID_PATH);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Check if server process is running
 */
export async function isServerRunning() {
  const pidInfo = await loadPid();
  if (!pidInfo || !pidInfo.pid) return false;

  try {
    // Signal 0 checks if process exists without killing it
    process.kill(pidInfo.pid, 0);
    return true;
  } catch {
    // Process not running, clean up stale PID
    await clearPid();
    return false;
  }
}

/**
 * Get server info if running
 */
export async function getServerInfo() {
  const running = await isServerRunning();
  if (!running) return null;

  const pidInfo = await loadPid();
  return {
    pid: pidInfo.pid,
    port: pidInfo.port,
    startedAt: pidInfo.startedAt,
    url: `http://localhost:${pidInfo.port}`
  };
}

export { CONFIG_DIR, CONFIG_PATH, PID_PATH };
