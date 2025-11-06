# Sahar's Claude Code Marketplace

A curated collection of Claude Code plugins for personal use and sharing.

## What is this?

This is a personal [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) - a centralized catalog of plugins that extend Claude Code's functionality. It enables version management, easy distribution, and organized plugin discovery.

## Using this Marketplace

### In Claude Code

To use plugins from this marketplace in your Claude Code setup:

1. **Add the marketplace to your project:**

   Create or update `.claude/config.json` in your project:

   ```json
   {
     "marketplaces": [
       {
         "name": "sahar-marketplace",
         "source": "github",
         "repo": "SaharCarmel/Sahar-claude-code-marketplace"
       }
     ]
   }
   ```

2. **Install plugins:**

   Once the marketplace is configured, Claude Code will be able to discover and install plugins from this catalog.

### Directly from GitHub

Alternatively, you can reference individual plugin repositories directly without using the marketplace.

## Available Plugins

Currently, this marketplace is starting empty and will be populated with curated plugins over time.

Check `.claude-plugin/marketplace.json` for the complete list of available plugins.

## Marketplace Structure

```
Sahar-claude-code-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # Plugin catalog
├── schema/
│   └── marketplace-schema.json   # JSON schema for validation
├── scripts/
│   ├── add-plugin.sh            # Helper to add new plugins
│   └── validate.sh              # Validate marketplace.json
└── README.md                     # This file
```

## Adding Plugins to this Marketplace

### Manual Method

1. Edit `.claude-plugin/marketplace.json`
2. Add a new entry to the `plugins` array:

```json
{
  "name": "my-plugin",
  "description": "What this plugin does",
  "version": "1.0.0",
  "author": "Your Name",
  "source": {
    "type": "github",
    "repo": "username/plugin-repo"
  }
}
```

3. Validate the JSON structure
4. Commit and push

### Using the Helper Script

```bash
./scripts/add-plugin.sh
```

The script will interactively prompt for plugin details and update the marketplace.json file.

## Plugin Sources

Plugins can be sourced from:

- **GitHub repositories:** `{"type": "github", "repo": "owner/repo"}`
- **Git URLs:** `{"type": "url", "url": "https://gitlab.com/user/plugin.git"}`
- **Local paths:** `"./plugins/my-plugin"` (relative to marketplace root)

## Validation

To validate the marketplace structure:

```bash
./scripts/validate.sh
```

This checks that the marketplace.json file conforms to the Claude Code marketplace schema.

## Plugin Development

Interested in creating plugins for Claude Code? Check out:

- [Claude Code Plugin Documentation](https://code.claude.com/docs/en/plugins)
- [Plugin Marketplace Documentation](https://code.claude.com/docs/en/plugin-marketplaces)

## Maintenance

This is a private personal marketplace maintained by Sahar Carmel. Plugins are curated based on personal workflow needs and quality standards.

## License

Individual plugins may have their own licenses. Check each plugin's repository for details.

---

*Built for Claude Code - Anthropic's official CLI for Claude*
