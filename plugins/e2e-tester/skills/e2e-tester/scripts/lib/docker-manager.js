import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getConfig,
  getDataDir,
  saveContainerInfo,
  clearContainerInfo,
  getContainerInfo,
} from './config-store.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEBAPP_DIR = path.join(__dirname, '..', '..', 'webapp');

// Check if Docker is available
export async function isDockerAvailable() {
  try {
    await execAsync('docker --version');
    return true;
  } catch {
    return false;
  }
}

// Check if image exists locally
export async function imageExists(imageName = 'e2e-tester') {
  try {
    const { stdout } = await execAsync(`docker images -q ${imageName}:latest`);
    return stdout.trim() !== '';
  } catch {
    return false;
  }
}

// Build the Docker image
export async function buildImage(imageName = 'e2e-tester') {
  console.log('Building Docker image...');
  const { stdout, stderr } = await execAsync(
    `docker build -t ${imageName}:latest ${WEBAPP_DIR}`,
    { maxBuffer: 50 * 1024 * 1024 } // 50MB buffer for build output
  );
  return { stdout, stderr };
}

// Check if container is running
export async function isContainerRunning(containerName = 'e2e-tester') {
  try {
    const { stdout } = await execAsync(`docker ps -q -f name=^${containerName}$`);
    return stdout.trim() !== '';
  } catch {
    return false;
  }
}

// Start the container
export async function startContainer() {
  const config = await getConfig();
  const { port, containerName, imageName } = config;
  const dataDir = getDataDir();

  // Check if container already running
  if (await isContainerRunning(containerName)) {
    throw new Error(`Container ${containerName} is already running`);
  }

  // Check if image exists, build if not
  if (!(await imageExists(imageName))) {
    console.log('Image not found, building...');
    await buildImage(imageName);
  }

  // Remove any stopped container with same name
  try {
    await execAsync(`docker rm ${containerName} 2>/dev/null`);
  } catch {
    // Container doesn't exist, that's fine
  }

  // Run the container
  const cmd = [
    'docker run -d',
    `--name ${containerName}`,
    `-p ${port}:3458`,
    `-v "${dataDir}:/data"`,
    '-e DATA_DIR=/data',
    '-e NODE_ENV=production',
    `${imageName}:latest`,
  ].join(' ');

  const { stdout } = await execAsync(cmd);
  const containerId = stdout.trim();

  // Save container info
  await saveContainerInfo({
    containerId,
    containerName,
    port,
    startedAt: new Date().toISOString(),
  });

  return { containerId, port };
}

// Stop the container
export async function stopContainer() {
  const config = await getConfig();
  const { containerName } = config;

  try {
    await execAsync(`docker stop ${containerName}`);
    await execAsync(`docker rm ${containerName}`);
    await clearContainerInfo();
    return true;
  } catch (err) {
    // Container might not exist
    await clearContainerInfo();
    return false;
  }
}

// Get container status
export async function getContainerStatus() {
  const info = await getContainerInfo();
  if (!info) {
    return { running: false };
  }

  const running = await isContainerRunning(info.containerName);
  return {
    running,
    ...info,
  };
}

// Wait for container to be healthy
export async function waitForHealth(url, timeout = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Connection refused, keep waiting
    }

    // Wait 500ms before retry
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`Container did not become healthy within ${timeout}ms`);
}

// Get container logs
export async function getContainerLogs(containerName = 'e2e-tester', lines = 50) {
  try {
    const { stdout } = await execAsync(`docker logs --tail ${lines} ${containerName}`);
    return stdout;
  } catch {
    return null;
  }
}
