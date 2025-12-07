#!/usr/bin/env node
/**
 * Gracefully stop the plan-collab server
 * Usage: node stop-server.js [--force]
 */

import { isServerRunning, getServerInfo, clearPid } from './lib/config-store.js';
import { killProcess, waitForExit } from './lib/server-manager.js';

export default async function stopServer(args) {
  const force = args.includes('--force');

  if (!(await isServerRunning())) {
    console.log(JSON.stringify({ status: 'not_running' }));
    return;
  }

  const info = await getServerInfo();
  const { pid, port } = info;

  try {
    // Send appropriate signal
    const signal = force ? 'SIGKILL' : 'SIGTERM';
    const killed = await killProcess(pid, signal);

    if (!killed) {
      // Process already gone
      await clearPid();
      console.log(
        JSON.stringify({
          status: 'stopped',
          pid,
          port,
          note: 'Process was already terminated'
        })
      );
      return;
    }

    // Wait for process to exit
    const exited = await waitForExit(pid, force ? 5000 : 10000);

    if (!exited && !force) {
      // Escalate to SIGKILL
      await killProcess(pid, 'SIGKILL');
      await waitForExit(pid, 5000);
    }

    await clearPid();

    console.log(
      JSON.stringify({
        status: 'stopped',
        pid,
        port,
        method: force ? 'force' : 'graceful'
      })
    );
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}
