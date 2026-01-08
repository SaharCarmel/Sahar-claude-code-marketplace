import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = path.join(os.homedir(), '.e2e-tester');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const CONTAINER_INFO_PATH = path.join(DATA_DIR, 'container.json');

// Ensure data directory exists
async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(path.join(DATA_DIR, 'tests'), { recursive: true });
  await fs.mkdir(path.join(DATA_DIR, 'feedback'), { recursive: true });
  await fs.mkdir(path.join(DATA_DIR, 'images'), { recursive: true });
}

// Config operations
export async function getConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return getDefaultConfig();
  }
}

export async function saveConfig(config) {
  await ensureDataDir();
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getDefaultConfig() {
  return {
    mode: 'webapp',
    port: 3458,
    autoOpen: true,
    imageName: 'e2e-tester',
    containerName: 'e2e-tester',
  };
}

// Container info operations
export async function getContainerInfo() {
  try {
    const data = await fs.readFile(CONTAINER_INFO_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveContainerInfo(info) {
  await ensureDataDir();
  await fs.writeFile(CONTAINER_INFO_PATH, JSON.stringify(info, null, 2));
}

export async function clearContainerInfo() {
  try {
    await fs.unlink(CONTAINER_INFO_PATH);
  } catch {
    // File doesn't exist, that's ok
  }
}

// Path helpers
export function getDataDir() {
  return DATA_DIR;
}

export function getTestsDir() {
  return path.join(DATA_DIR, 'tests');
}

export function getFeedbackDir() {
  return path.join(DATA_DIR, 'feedback');
}

export function getImagesDir() {
  return path.join(DATA_DIR, 'images');
}

export { ensureDataDir };
