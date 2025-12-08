# Plan Collab Webapp

Collaborative plan review UI with inline comments and questions.

## Source Repository

This webapp is based on: `git@github.com:SaharCarmel/readwise-studio.git`

### Syncing Changes

**To sync changes TO the source repo:**
1. Clone readwise-studio separately
2. Copy changed files from this webapp folder
3. Commit and push to readwise-studio

**To sync changes FROM the source repo:**
1. Pull latest from readwise-studio
2. Copy changed files to this webapp folder
3. Commit to the marketplace repo

## Development

```bash
# Start API server
npm run server

# Start dev server (in another terminal)
npm run dev

# Or start both
npm start
```

## Usage

Open the webapp with a plan file:
```
http://localhost:8080?plan=/path/to/your/plan.md
```

## Tech Stack

- Vite
- TypeScript
- React
- shadcn/ui
- Tailwind CSS v3
