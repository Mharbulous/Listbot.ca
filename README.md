# Bookkeeper

A Vue 3 bookkeeping application with advanced file upload and processing capabilities.

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + Vuetify 3
- **Build**: Vite
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State**: Pinia
- **Styling**: Tailwind CSS
- **Testing**: Vitest

## Quick Start

```bash
npm install
npm run dev          # Standard dev server (localhost:5173)
npm run dev:bookkeeping  # SSO testing (bookkeeping.localhost:3001)
```

## Development

This project is part of a multi-app SSO architecture. See `CLAUDE.md` for detailed development guidelines and `docs/` for architecture documentation.

### Key Commands

- `npm run lint` - Lint code
- `npm run test:run` - Run tests
- `npm run build` - Production build

## Deployment Model

**Two-branch promotion model:**
- **main** - Development/integration (receives all merges from Claude Code)
- **production** - Stable releases (manually promoted from main)

### Promotion Workflow

```bash
# Promote main to production
git checkout production
git merge origin/main
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin production
git push origin v1.2.0
```

### Hotfix Strategy

```bash
# Apply specific fix to production without unreleased features
git checkout production
git cherry-pick <commit-hash>
git tag -a v1.2.1 -m "Hotfix for critical bug"
git push origin production
git push origin v1.2.1
```

See `docs/hosting/2025-11-16-Promotion.md` for full deployment details.

## Documentation

- `CLAUDE.md` - Development directives and workflow
- `docs/architecture/` - System architecture and design
- `docs/testing/` - Testing guidelines and performance analysis
- `docs/hosting/` - Deployment and hosting documentation

## License

Private project - All rights reserved
