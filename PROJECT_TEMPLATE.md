# Project Template for Claude + Cursor Workflow

## 🚀 Quick Start Checklist

### Phase 1: Project Analysis
- [ ] `list_dir` to understand project structure
- [ ] `read_file` on key config files (package.json, tsconfig.json, etc.)
- [ ] `codebase_search` to understand existing patterns
- [ ] `grep` to find specific implementations

### Phase 2: Task Planning
- [ ] `todo_write` to create task breakdown
- [ ] Identify dependencies between tasks
- [ ] Set clear, actionable todo items
- [ ] Update todos as work progresses

### Phase 3: Implementation
- [ ] Read existing code before making changes
- [ ] Make incremental changes
- [ ] Test frequently with `run_terminal_cmd`
- [ ] Fix issues immediately

### Phase 4: Quality Assurance
- [ ] `read_lints` to check for errors
- [ ] `npm run build` to test compilation
- [ ] `npm run dev` to test development server
- [ ] Verify functionality end-to-end

## 📋 Common Task Templates

### Authentication Setup
```markdown
## Auth Implementation Checklist
- [ ] Examine existing auth setup
- [ ] Check package.json for auth libraries
- [ ] Set up environment variables
- [ ] Configure middleware
- [ ] Create sign-in/sign-up pages
- [ ] Implement forgot password
- [ ] Test auth flows
- [ ] Document configuration
```

### Feature Development
```markdown
## Feature Development Checklist
- [ ] Research official documentation
- [ ] Understand existing patterns
- [ ] Plan implementation approach
- [ ] Create UI components
- [ ] Implement functionality
- [ ] Add error handling
- [ ] Test thoroughly
- [ ] Update documentation
```

### Bug Fixing
```markdown
## Bug Fix Checklist
- [ ] Reproduce the issue
- [ ] Identify root cause
- [ ] Check for similar issues in codebase
- [ ] Implement fix
- [ ] Test fix thoroughly
- [ ] Document solution
- [ ] Update tests if needed
```

## 🛠️ Essential Commands

### File Operations
```bash
# Read files
read_file target_file="path/to/file"

# Search patterns
grep pattern="search_term" path="directory"
codebase_search query="semantic search"

# Edit files
search_replace file_path="path" old_string="old" new_string="new"
MultiEdit file_path="path" edits=[{old_string, new_string}]
```

### Development
```bash
# Check status
run_terminal_cmd command="git status"
run_terminal_cmd command="npm run build"
run_terminal_cmd command="npm run dev"

# Check errors
read_lints paths=["file1", "file2"]
```

### Task Management
```bash
# Create todos
todo_write merge=false todos=[{id, content, status}]

# Update progress
todo_write merge=true todos=[{id, status: "completed"}]
```

## 📚 Reusable Patterns

### Error Handling
```typescript
try {
  // Implementation
} catch (error) {
  console.error('Error description:', error)
  // Handle error appropriately
}
```

### Loading States
```typescript
const [isLoading, setIsLoading] = useState(false)

if (isLoading) {
  return <LoadingSpinner />
}
```

### Environment Variables
```typescript
// Always check if variables exist
const apiKey = process.env.NEXT_PUBLIC_API_KEY
if (!apiKey) {
  throw new Error('API key not found')
}
```

## 🎯 Success Metrics

### Code Quality
- ✅ No linting errors
- ✅ TypeScript compliance
- ✅ Proper error handling
- ✅ Clean, readable code

### Functionality
- ✅ All features working
- ✅ Responsive design
- ✅ Proper loading states
- ✅ Error messages for users

### Documentation
- ✅ Clear setup instructions
- ✅ Troubleshooting guide
- ✅ Code comments where needed
- ✅ README updated

## 🔄 Workflow Optimization

### Parallel Operations
- Read multiple files simultaneously
- Batch related tool calls
- Use parallel searches when possible

### Incremental Development
- Make small, focused changes
- Test after each change
- Fix issues immediately
- Don't move on until current task is complete

### Knowledge Capture
- Document solutions to problems
- Save reusable code patterns
- Create troubleshooting guides
- Update documentation continuously

---

**Copy this template to new projects and customize as needed. This workflow has been proven effective for building production-ready applications with Claude + Cursor.**
