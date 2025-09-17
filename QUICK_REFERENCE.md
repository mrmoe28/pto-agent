# Claude + Cursor Quick Reference

## 🚀 Essential Commands

### Project Analysis
```bash
list_dir target_directory="."
read_file target_file="package.json"
codebase_search query="How is authentication handled?"
grep pattern="import.*auth" path="src"
```

### Task Management
```bash
# Create task list
todo_write merge=false todos=[
  {id: "task1", content: "Description", status: "in_progress"},
  {id: "task2", content: "Description", status: "pending"}
]

# Update progress
todo_write merge=true todos=[{id: "task1", status: "completed"}]
```

### File Operations
```bash
# Read files
read_file target_file="src/app/layout.tsx"

# Edit files
search_replace file_path="src/app/page.tsx" old_string="old" new_string="new"

# Multiple edits
MultiEdit file_path="src/app/layout.tsx" edits=[
  {old_string: "old1", new_string: "new1"},
  {old_string: "old2", new_string: "new2"}
]
```

### Development & Testing
```bash
# Check status
run_terminal_cmd command="git status"
run_terminal_cmd command="npm run build"
run_terminal_cmd command="npm run dev"

# Check errors
read_lints paths=["src/app"]
```

## 📋 Common Workflows

### 1. New Feature Development
1. `codebase_search` to understand patterns
2. `read_file` on related files
3. `todo_write` to plan tasks
4. Implement incrementally
5. `read_lints` to check errors
6. `run_terminal_cmd` to test

### 2. Bug Fixing
1. `grep` to find issue location
2. `read_file` to understand context
3. `search_replace` to fix
4. `run_terminal_cmd` to test
5. `read_lints` to verify

### 3. Authentication Setup
1. Check existing auth with `codebase_search`
2. Read auth-related files
3. Set up environment variables
4. Configure middleware
5. Create auth pages
6. Test auth flows

## 🎯 Best Practices

### Always Do First
- Read existing code before changing
- Check official documentation
- Create todo list for complex tasks
- Test frequently

### Code Quality
- Fix linting errors immediately
- Use proper error handling
- Add loading states
- Make responsive designs

### Documentation
- Document solutions to problems
- Create troubleshooting guides
- Update README with changes
- Comment complex code

## 🔧 Tool Combinations

### Parallel File Reading
```bash
read_file target_file="file1" + read_file target_file="file2" + read_file target_file="file3"
```

### Search + Read Pattern
```bash
grep pattern="pattern" path="src" + read_file target_file="found_file"
```

### Build + Lint Pattern
```bash
run_terminal_cmd command="npm run build" + read_lints paths=["src"]
```

## 📚 Common Patterns

### Error Handling
```typescript
try {
  // Implementation
} catch (error) {
  console.error('Context:', error)
  // Handle error
}
```

### Loading States
```typescript
const [isLoading, setIsLoading] = useState(false)
if (isLoading) return <LoadingSpinner />
```

### Environment Variables
```typescript
const apiKey = process.env.NEXT_PUBLIC_API_KEY
if (!apiKey) throw new Error('API key required')
```

## 🚨 Troubleshooting

### Build Errors
1. `read_lints` to find issues
2. Fix errors incrementally
3. `run_terminal_cmd command="npm run build"` to test

### Runtime Errors
1. `run_terminal_cmd command="npm run dev"` to start server
2. Check browser console
3. Check server logs
4. Fix and test

### Git Issues
1. `run_terminal_cmd command="git status"`
2. `run_terminal_cmd command="git diff"`
3. Resolve conflicts
4. Test changes

---

**Keep this reference handy for quick access to common commands and patterns!**
