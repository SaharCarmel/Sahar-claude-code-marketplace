import { getContainerStatus, getContainerLogs } from './lib/docker-manager.js';
import { checkHealth } from './lib/api-client.js';

export default async function main(args) {
  const showLogs = args.includes('--logs');
  const logLines = args.find((a) => a.startsWith('--lines='));
  const lines = logLines ? parseInt(logLines.split('=')[1], 10) : 20;

  try {
    const status = await getContainerStatus();

    if (!status.running) {
      console.log(
        JSON.stringify({
          running: false,
          message: 'Container is not running',
        })
      );
      return;
    }

    // Check API health
    const health = await checkHealth();

    const result = {
      running: true,
      containerId: status.containerId,
      containerName: status.containerName,
      port: status.port,
      startedAt: status.startedAt,
      url: `http://localhost:${status.port}`,
      apiHealthy: health.healthy,
    };

    if (!health.healthy) {
      result.healthError = health.error;
    }

    if (showLogs) {
      const logs = await getContainerLogs(status.containerName, lines);
      result.logs = logs;
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.log(
      JSON.stringify({
        running: false,
        error: err.message,
      })
    );
    process.exit(1);
  }
}
