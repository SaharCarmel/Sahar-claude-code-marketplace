import { stopContainer, isContainerRunning } from './lib/docker-manager.js';
import { getConfig } from './lib/config-store.js';

export default async function main() {
  try {
    const config = await getConfig();

    // Check if running
    if (!(await isContainerRunning(config.containerName))) {
      console.log(
        JSON.stringify({
          success: true,
          message: 'Container is not running',
        })
      );
      return;
    }

    console.error('Stopping E2E Tester container...');

    const stopped = await stopContainer();

    if (stopped) {
      console.log(
        JSON.stringify({
          success: true,
          message: 'Container stopped and removed successfully',
        })
      );
    } else {
      console.log(
        JSON.stringify({
          success: true,
          message: 'Container was already stopped',
        })
      );
    }
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
