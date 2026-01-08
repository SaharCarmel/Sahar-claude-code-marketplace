import { getConfig, saveConfig, getDefaultConfig } from './lib/config-store.js';

function parseArgs(args) {
  const result = {
    action: 'show',
    key: null,
    value: null,
    reset: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'get' && args[i + 1]) {
      result.action = 'get';
      result.key = args[++i];
    } else if (arg === 'set' && args[i + 1] && args[i + 2]) {
      result.action = 'set';
      result.key = args[++i];
      result.value = args[++i];
    } else if (arg === '--reset') {
      result.reset = true;
    }
  }

  return result;
}

export default async function main(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
config - View or set E2E Tester configuration

Usage:
  node cli.js config                    Show all configuration
  node cli.js config get <key>          Get a specific value
  node cli.js config set <key> <value>  Set a value
  node cli.js config --reset            Reset to defaults

Configuration Keys:
  mode          Testing mode: "webapp" or "linear"
  port          Port for webapp (default: 3458)
  autoOpen      Auto-open browser: true/false
  imageName     Docker image name
  containerName Docker container name

Examples:
  node cli.js config
  node cli.js config get port
  node cli.js config set port 3459
  node cli.js config set autoOpen false
  node cli.js config --reset
`);
    return;
  }

  const { action, key, value, reset } = parseArgs(args);

  try {
    // Reset configuration
    if (reset) {
      const defaultConfig = getDefaultConfig();
      await saveConfig(defaultConfig);
      console.log(
        JSON.stringify({
          success: true,
          message: 'Configuration reset to defaults',
          config: defaultConfig,
        })
      );
      return;
    }

    const config = await getConfig();

    // Show all configuration
    if (action === 'show') {
      console.log(JSON.stringify({ success: true, config }, null, 2));
      return;
    }

    // Get specific key
    if (action === 'get') {
      if (!(key in config)) {
        console.log(
          JSON.stringify({
            success: false,
            error: `Unknown configuration key: ${key}`,
          })
        );
        process.exit(1);
      }
      console.log(JSON.stringify({ success: true, key, value: config[key] }));
      return;
    }

    // Set specific key
    if (action === 'set') {
      const validKeys = ['mode', 'port', 'autoOpen', 'imageName', 'containerName'];
      if (!validKeys.includes(key)) {
        console.log(
          JSON.stringify({
            success: false,
            error: `Invalid key: ${key}. Valid keys: ${validKeys.join(', ')}`,
          })
        );
        process.exit(1);
      }

      // Type coercion
      let typedValue = value;
      if (key === 'port') {
        typedValue = parseInt(value, 10);
        if (isNaN(typedValue) || typedValue < 1 || typedValue > 65535) {
          console.log(
            JSON.stringify({
              success: false,
              error: 'Port must be a number between 1 and 65535',
            })
          );
          process.exit(1);
        }
      } else if (key === 'autoOpen') {
        typedValue = value === 'true';
      } else if (key === 'mode') {
        if (!['webapp', 'linear'].includes(value)) {
          console.log(
            JSON.stringify({
              success: false,
              error: 'Mode must be "webapp" or "linear"',
            })
          );
          process.exit(1);
        }
      }

      config[key] = typedValue;
      await saveConfig(config);

      console.log(
        JSON.stringify({
          success: true,
          message: `Set ${key} = ${typedValue}`,
          config,
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
