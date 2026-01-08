import { exec } from 'child_process';
import { promisify } from 'util';
import {
  startContainer,
  isDockerAvailable,
  waitForHealth,
  isContainerRunning,
} from './lib/docker-manager.js';
import { getConfig } from './lib/config-store.js';

const execAsync = promisify(exec);

export default async function main(args) {
  // Parse args
  const portArg = args.find((a) => a.startsWith('--port='));
  const noOpen = args.includes('--no-open');

  try {
    // Check Docker availability
    if (!(await isDockerAvailable())) {
      console.log(
        JSON.stringify({
          success: false,
          error: 'Docker is not available. Please install Docker and try again.',
        })
      );
      process.exit(1);
    }

    const config = await getConfig();
    const port = portArg ? parseInt(portArg.split('=')[1], 10) : config.port;

    // Check if already running
    if (await isContainerRunning(config.containerName)) {
      console.log(
        JSON.stringify({
          success: true,
          message: 'Container already running',
          port,
          url: `http://localhost:${port}`,
        })
      );
      return;
    }

    console.error('Starting E2E Tester container...');

    // Start container
    const { containerId } = await startContainer();

    // Wait for health
    const url = `http://localhost:${port}`;
    console.error('Waiting for container to be healthy...');
    await waitForHealth(url, 60000);

    console.error('Container is ready!');

    // Open browser if configured
    if (config.autoOpen && !noOpen) {
      try {
        const openCmd =
          process.platform === 'darwin'
            ? 'open'
            : process.platform === 'win32'
              ? 'start'
              : 'xdg-open';
        await execAsync(`${openCmd} ${url}`);
        console.error(`Opened browser at ${url}`);
      } catch {
        console.error(`Please open ${url} in your browser`);
      }
    }

    console.log(
      JSON.stringify({
        success: true,
        containerId,
        port,
        url,
        message: 'E2E Tester container started successfully',
      })
    );
  } catch (err) {
    console.log(
      JSON.stringify({
        success: false,
        error: err.message,
      })
    );
    process.exit(1);
  }
}
