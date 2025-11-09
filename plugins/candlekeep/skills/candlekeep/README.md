# Candlekeep Skill

A personal knowledge base system that gives AI agents direct access to your books.

## Quick Start

### Installation

1. **Install Python dependencies**:
   ```bash
   cd plugins/candlekeep/skills/candlekeep
   uv sync
   ```

2. **Initialize Candlekeep**:
   ```bash
   uv run candlekeep init
   ```
   
   This creates `~/.candlekeep/` with database and configuration.

## Usage

### Add Books to Your Library

**Add a PDF:**
```bash
uv run candlekeep add-pdf ~/Documents/my-book.pdf \
  --title "Book Title" \
  --author "Author Name" \
  --tags "programming,reference"
```

**Add a Markdown file:**
```bash
uv run candlekeep add-markdown ~/Documents/notes.md \
  --title "My Notes" \
  --tags "documentation"
```

### List Your Books

```bash
uv run candlekeep list
```

**Output:**
```
Books in library:
ID: 1
Title: The Pragmatic Programmer
Author: David Thomas, Andrew Hunt
Pages: 352
Format: pdf
Tags: programming, software-engineering
```

### Query Your Library

Once books are added, simply ask Claude questions in natural language:

**Example Questions:**
- "Do I have any books on Python? Show me what they say about decorators"
- "What does my software architecture book say about microservices?"
- "List all books tagged with 'machine-learning'"

**Claude will automatically:**
1. List available books
2. Show table of contents
3. Extract relevant pages
4. Provide answers with page citations

## Available Commands

All commands use `uv run candlekeep` from the skill directory.

### `init`
Initialize the Candlekeep database and configuration.

### `add-pdf <file_path>`
Add a PDF book to your library.

**Options:**
- `--title` - Book title (optional, extracted from metadata if not provided)
- `--author` - Author name (optional)
- `--tags` - Comma-separated tags (optional)

### `add-markdown <file_path>`
Add a Markdown document to your library.

**Options:**
- `--title` - Document title (required)
- `--author` - Author name (optional)
- `--tags` - Comma-separated tags (optional)

### `list`
List all books in your library with metadata.

### `toc <book_id>`
Show the table of contents for a specific book.

```bash
uv run candlekeep toc 1
```

### `query <book_id> <start_page> <end_page>`
Extract content from specific pages of a book.

```bash
uv run candlekeep query 1 10 15
```

**Returns:** Text content from pages 10-15 with page markers.

## How It Works

### Progressive Disclosure Pattern

Candlekeep uses a token-efficient approach:

1. **Discovery** - Lists book titles/metadata (~20-50 tokens per book)
2. **Navigation** - Shows table of contents when needed
3. **Extraction** - Fetches only requested page ranges
4. **Citation** - Includes page markers for precise references

This keeps context usage minimal while providing comprehensive access.

### Privacy & Storage

- **All data stored locally** in `~/.candlekeep/candlekeep.db` (SQLite)
- **No external API calls** - purely local processing
- **Content stored as chunks** with page-level granularity
- **Efficient indexing** by title, author, tags, and content

## File Structure

```
~/.candlekeep/
├── candlekeep.db       # SQLite database
└── config.json         # Configuration

plugins/candlekeep/skills/candlekeep/
├── SKILL.md            # Skill definition for Claude
├── README.md           # This file
├── pyproject.toml      # Python dependencies
├── alembic/            # Database migrations
└── src/
    └── candlekeep/
        ├── cli.py              # Command-line interface
        ├── commands/           # Command implementations
        ├── db/                 # Database models
        ├── parsers/            # PDF/Markdown parsers
        └── utils/              # Utilities
```

## Requirements

- **Python**: >=3.10
- **UV**: >=0.1.0 (package manager)

## Troubleshooting

### "Database not found"

Run `uv run candlekeep init` to initialize the database.

### "PDF parsing failed"

Ensure the PDF is not corrupted and has extractable text. Some scanned PDFs without OCR won't work.

### "Dependencies not installed"

Run `uv sync` from the skill directory to install all dependencies.

### "Command not found: candlekeep"

Make sure you're running commands with `uv run candlekeep` prefix from the skill directory.

## Tips for Great Results

1. **Use descriptive tags** - Makes it easier for Claude to find relevant books
2. **Add complete metadata** - Helps with discovery and citation
3. **Break large documents** - Consider splitting very large books into volumes
4. **Regular queries** - Reference books frequently to maximize value
5. **Organize by topic** - Use consistent tagging schemes

## Support

For issues or questions:
- Review the [Plugin README](../../README.md) for installation help
- Check the SKILL.md for Claude's internal documentation
- Verify database exists at `~/.candlekeep/candlekeep.db`

---

**Created by**: Sahar Carmel  
**License**: MIT
