# Parallel Development Sync Guide

## Quick Sync Commands

### Before Starting Work (ALWAYS DO THIS FIRST)
```bash
git pull origin main
```

### After Making Changes
```bash
git add .
git commit -m "type: description"
git push origin main
```

### If You Get Conflicts
```bash
git pull origin main
# Fix conflicts in VS Code/Cursor
git add .
git commit -m "fix: resolved merge conflicts"
git push origin main
```

## Commit Message Format
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, missing semicolons, etc
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `test:` - Adding missing tests
- `chore:` - Changes to build process or auxiliary tools

## Working Areas (To Avoid Conflicts)

### Location 1 Focus Areas
- Frontend components (`/src/components/`)
- UI/UX improvements
- Styling updates

### Location 2 Focus Areas
- API routes (`/src/app/api/`)
- Database logic (`/src/lib/`)
- Backend functionality

## Important Files to Keep Synced
1. `.env.local` - Database credentials (not in git)
2. `package.json` - Dependencies
3. `schema.sql` - Database structure
4. `CLAUDE.md` - AI instructions

## Database URL (Update in Both Locations)
```
DATABASE_URL=postgresql://[user]:[password]@[host].neon.tech/[database]?sslmode=require
```

## Quick Status Check
```bash
git status
git log --oneline -5
```

## Emergency Reset (If Things Go Wrong)
```bash
# Save your work first!
git stash
git pull origin main --rebase
git stash pop
```

## Tips
- Commit frequently with small changes
- Pull before starting new work
- Push immediately after commits
- Communicate which files you're working on
- Use descriptive commit messages