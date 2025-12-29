# Sahar's Claude Code Marketplace

A curated collection of plugins that extend Claude Code's functionality with specialized skills for planning, project management, and content creation.

For more information about skills, check out:
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [How to create custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)

# About This Repository

This repository contains plugins that demonstrate practical workflows for Claude Code. These plugins range from collaborative planning tools to project management integrations to content generation utilities.

Each plugin is self-contained with its own `plugin.json` manifest and skill definitions. Browse through these plugins to understand different patterns and approaches, or install them directly into your Claude Code environment.

# Available Plugins

| Plugin | Description |
|--------|-------------|
| `plan-collab` | Collaborative plan review system with web interface for team feedback |
| `linear-extended` | Extended Linear operations including project milestones management |
| `content-studio` | Generate social media content from your coding work |

# Try in Claude Code

You can register this repository as a Claude Code plugin marketplace by running:

```
/plugin marketplace add SaharCarmel/Sahar-claude-code-marketplace
```

Then, to install a specific plugin:
1. Run `/plugin` and select `Browse and install plugins`
2. Select `sahar-marketplace`
3. Select the plugin you want to install
4. Select `Install now`

Alternatively, install plugins directly via:

```
/plugin install plan-collab@sahar-marketplace
/plugin install linear-extended@sahar-marketplace
/plugin install content-studio@sahar-marketplace
```

After installing a plugin, you can use its skills by mentioning them. For instance, if you install `plan-collab`, you can ask Claude Code to review a plan collaboratively with your team.

# Plugin Structure

Plugins follow the standard Claude Code plugin format:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata (required)
├── skills/
│   └── skill-name/
│       └── SKILL.md         # Skill instructions
├── hooks/                   # Optional lifecycle hooks
└── README.md
```

# Creating a Basic Skill

Skills are simple to create - just a folder with a `SKILL.md` file containing YAML frontmatter and instructions:

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[Add your instructions here that Claude will follow when this skill is active]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

The frontmatter requires only two fields:
- `name` - A unique identifier for your skill (lowercase, hyphens for spaces)
- `description` - A complete description of what the skill does and when to use it

# Maintenance

This is a personal marketplace maintained by Sahar Carmel. Plugins are curated based on workflow needs and quality standards.

# License

Individual plugins may have their own licenses. Check each plugin's directory for details.

---

*Built for [Claude Code](https://claude.ai/code) - Anthropic's official CLI for Claude*
