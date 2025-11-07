# Candlekeep Plugin

> Give AI agents direct access to your personal library of books

Candlekeep is a Claude Code plugin that provides a personal knowledge base system, allowing Claude to query and reference your book collection with precise citations and table of contents navigation.

## What is Candlekeep?

Named after the legendary library fortress in Dungeons & Dragons, Candlekeep transforms your books into a queryable knowledge base that Claude can access. Instead of relying solely on training data, Claude can reference actual content from your personal library, providing grounded, citable responses.

**Key Features:**
- 📚 **PDF & Markdown Support** - Add books in multiple formats
- 🔍 **Table of Contents Navigation** - Browse book structure before extracting content
- 📄 **Precise Page Extraction** - Request specific page ranges with page markers
- 🗄️ **Local-First Storage** - All data stored locally in SQLite
- 🔐 **Privacy-Focused** - No data transmitted externally
- ⚡ **Token-Efficient** - Progressive disclosure pattern minimizes context usage

## Installation

### Prerequisites

1. **Python 3.10 or higher**
   ```bash
   python3 --version
   ```

2. **UV Package Manager**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

### Install Plugin

1. **Add the Sahar marketplace** (if not already added):
   ```bash
   /plugin marketplace add saharcarmel/Sahar-claude-code-marketplace
   ```

2. **Install Candlekeep**:
   ```bash
   /plugin install candlekeep@sahar-marketplace
   ```

3. **Install Python dependencies**:
   ```bash
   cd ~/.claude/skills/candlekeep
   uv sync
   ```

4. **Initialize Candlekeep**:
   ```bash
   uv run candlekeep init
   ```

## Quick Start

### Add Your First Book

```bash
cd ~/.claude/skills/candlekeep
uv run candlekeep add-pdf ~/Documents/my-book.pdf
```

### Query Your Library

Once books are added, simply ask Claude questions:

**Example:** "Do I have any books on software testing? If so, what do they say about test-driven development?"

Claude will:
1. List available books
2. Check table of contents
3. Extract relevant pages
4. Provide an answer with citations

## Available Commands

All commands are executed via the skill - Claude will invoke them automatically when appropriate.

### List Books
```bash
uv run candlekeep list
```
Shows all books with ID, title, author, page count, and tags.

### Get Table of Contents
```bash
uv run candlekeep toc <book-id>
```
Returns hierarchical TOC for navigation.

### Extract Pages
```bash
uv run candlekeep pages <book-id> <start-page> <end-page>
```
Extracts specific page range with page markers.

### Add PDF
```bash
uv run candlekeep add-pdf /path/to/book.pdf
```
Converts PDF to markdown and adds to library.

### Add Markdown
```bash
uv run candlekeep add-md /path/to/book.md
```
Adds markdown book with YAML frontmatter.

## How It Works

### Progressive Disclosure Pattern

Candlekeep follows a token-efficient workflow:

1. **List** → See what books are available
2. **TOC** → Navigate to relevant sections
3. **Pages** → Extract only needed content

This minimizes token usage while providing precise, relevant information.

### Storage Model

```
~/.candlekeep/
├── config.yaml          # Configuration
├── candlekeep.db       # SQLite database (metadata only)
├── library/            # Converted markdown files
│   └── book-slug/
│       └── content.md  # Book content with page markers
└── originals/          # Original PDF/MD files (optional)
```

**Key Design Decisions:**
- Metadata in SQLite for fast queries
- Content in markdown files for simplicity
- SHA256 deduplication prevents duplicates
- Page markers enable precise extraction

## Usage Examples

### Research Assistant

**You:** "I'm debugging a concurrency issue. Do I have any books on parallel programming?"

**Claude:**
1. Lists books, finds "Java Concurrency in Practice"
2. Checks TOC for concurrency debugging section
3. Extracts pages 287-293
4. Provides debugging strategies with citations

### Study Companion

**You:** "What does my database textbook say about ACID properties?"

**Claude:**
1. Identifies database textbook in library
2. Navigates TOC to transactions chapter
3. Extracts ACID properties section
4. Summarizes with page references

### Writing Research

**You:** "Find quotes about software design from my collection"

**Claude:**
1. Lists books in software design category
2. Searches multiple books' TOCs
3. Extracts relevant passages
4. Provides quotes with proper citations

## Current Status

Candlekeep is in **early development** (40% complete, Phase 2 finished):

✅ **Implemented:**
- PDF and Markdown parsing with page markers
- SQLite database with metadata
- Table of contents extraction
- Deduplication via SHA256
- Basic CLI commands

⏳ **Planned:**
- Full-text search across library
- Note-taking and annotations
- Session tracking (which books used together)
- Connection mapping (knowledge patterns)
- Advanced query capabilities

## Troubleshooting

### "UV not found"
Install UV package manager:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### "Candlekeep not initialized"
Run initialization:
```bash
cd ~/.claude/skills/candlekeep
uv run candlekeep init
```

### "Python version error"
Candlekeep requires Python 3.10+. Update Python:
```bash
python3 --version  # Should be 3.10 or higher
```

### "Book ID not found"
List all books to see valid IDs:
```bash
uv run candlekeep list
```

## Architecture

### Technology Stack
- **Language:** Python 3.10+
- **Package Manager:** UV (not pip)
- **CLI Framework:** Typer (type-hint based)
- **Database:** SQLite + SQLAlchemy ORM
- **Migrations:** Alembic
- **PDF Parsing:** PyMuPDF + pymupdf4llm
- **Markdown:** python-frontmatter
- **Terminal UI:** Rich

### Plugin Components
```
plugins/candlekeep/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── skills/candlekeep/
│   ├── SKILL.md            # Skill definition for Claude
│   ├── README.md           # This file
│   ├── pyproject.toml      # Python dependencies
│   ├── alembic/            # Database migrations
│   └── src/candlekeep/     # Python source code
└── README.md               # Plugin overview
```

## Philosophy

**"Books as Context, Not Data"**

Candlekeep doesn't train AI on books - it gives AI the ability to *reference* books, just like humans do. This maintains:

- **Provenance** - Always know where information came from
- **Accuracy** - Ground responses in actual text
- **Privacy** - Your library stays local
- **Flexibility** - Change your library, change the advice

Your book collection shapes your knowledge. Candlekeep makes that knowledge accessible to AI agents.

## Contributing

Candlekeep is under active development. The main repository is at:
https://github.com/saharcarmel/candlekeep

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- File an issue on the Candlekeep repository
- Contact: sahar@example.com

---

**Happy Reading!** 📚
