# content-studio

**Ship code, ship content - without the writing grind.**

You love building. Writing about it? Not so much. content-studio generates social media posts from your coding work - it reads your git history, learns your writing style, and creates platform-optimized content so you can keep building in public without the content creation overhead.

## The Problem

- Building is fun, writing about it is tedious
- Hard to maintain a posting cadence while shipping features
- The interesting story of your work gets lost after you ship
- Each platform has different rules and best practices

## Features

| Feature | Description |
|---------|-------------|
| **Git-Powered Content** | Extracts stories from your commits, PRs, and branches |
| **Style Learning** | Learns your personal voice from examples and feedback |
| **Multi-Platform** | LinkedIn posts, X threads, Reddit posts - all optimized |
| **Minimal Intervention** | Creates drafts from context, only asks when needed |
| **Continuous Learning** | Gets better with every piece of feedback you give |

## Installation

```
/plugin install content-studio@sahar-marketplace
```

## Usage

Just tell Claude what you want to share:

```
"Create a LinkedIn post about the OAuth feature I just shipped"
"Write an X thread about today's debugging session"
"Create a Reddit post for r/webdev about this API optimization"
```

Claude will:
1. Analyze your recent git activity
2. Extract the interesting story
3. Apply your writing style
4. Format for the target platform

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Your Code  │────▶│ Git Context │────▶│Style Profile│────▶│  Draft Post │
│  (commits)  │     │ (extracted) │     │  (learned)  │     │ (platform)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                               ▲
                                               │
                                        ┌──────┴──────┐
                                        │  Feedback   │
                                        │  (ratings)  │
                                        └─────────────┘
```

### First-Time Setup

1. **Provide examples**: Share 2-5 posts you've written (or let Claude scrape your profile)
2. **Confirm your style**: Claude shows you the detected patterns
3. **Start creating**: From now on, just ask for content

### Daily Workflow

1. **Ask naturally**: "Create a LinkedIn post about the feature I just shipped"
2. **Claude gathers context**: Reads your git history silently
3. **Draft appears**: Shows what it found and the draft it created
4. **Refine if needed**: Request changes until you're happy
5. **Give feedback**: Rate the post 1-5 after publishing (improves future content)

## Platform Support

### LinkedIn
- Hook in first 1-2 lines (critical for engagement)
- Up to 3000 characters
- 3-5 hashtags at the end
- Ends with a question CTA

### X (Twitter)
- Thread format (3-10 tweets)
- 280 chars per tweet
- No hashtags in thread body
- Final tweet has the CTA

### Reddit
- Always includes TL;DR
- Matches subreddit tone
- Markdown formatting
- Ends with genuine question

## Style Profile

Your writing style is stored in `~/.content-studio/style-profile.json`:

- **Tone**: casual, professional, humorous
- **Structure**: how you open, build, and close
- **Vocabulary**: terms you use and avoid
- **Platform tweaks**: per-platform preferences

The profile improves every time you give feedback.

## Requirements

- Node.js 18+
- Git (for context extraction)
- GitHub CLI `gh` (optional, for PR context)
- Chrome (optional, for profile scraping)

---

*Part of [Sahar's Claude Code Marketplace](https://github.com/SaharCarmel/Sahar-claude-code-marketplace)*
