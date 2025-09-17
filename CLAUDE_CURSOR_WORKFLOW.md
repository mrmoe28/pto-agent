# Claude + Cursor Workflow Documentation

## 🎯 Overview
This document captures the proven workflow for using Claude AI with Cursor IDE to build production-ready applications efficiently. This workflow was successfully used to implement a complete Clerk authentication system for a Next.js application.

## 🚀 The Claude + Cursor Workflow

### Phase 1: Project Analysis & Planning
1. **Examine Project Structure**
   - Use `list_dir` to understand the codebase layout
   - Read key configuration files (`package.json`, `tsconfig.json`, etc.)
   - Identify existing patterns and conventions

2. **Create Task Management**
   - Use `todo_write` to break down complex tasks
   - Set clear, actionable todo items with status tracking
   - Update todos as work progresses

3. **Research & Documentation First**
   - Always check official documentation before implementing
   - Use `web_search` for current best practices
   - Reference official docs before making changes

### Phase 2: Implementation Strategy
1. **Read Before Writing**
   - Always use `read_file` to understand existing code
   - Examine related files to understand patterns
   - Check for existing implementations before creating new ones

2. **Incremental Development**
   - Make small, focused changes
   - Test frequently with `run_terminal_cmd`
   - Fix issues immediately before moving forward

3. **Parallel Tool Usage**
   - Use multiple tools simultaneously when possible
   - Read multiple files in parallel
   - Batch operations for efficiency

### Phase 3: Quality Assurance
1. **Linting & Error Checking**
   - Use `read_lints` after making changes
   - Fix all linting errors before proceeding
   - Ensure TypeScript compliance

2. **Testing & Validation**
   - Test builds with `npm run build`
   - Test development server with `npm run dev`
   - Verify functionality end-to-end

3. **Documentation & Knowledge Capture**
   - Document solutions to common problems
   - Create troubleshooting guides
   - Save reusable patterns and configurations

## 🛠️ Essential Tools & Commands

### File Operations
```bash
# Read files to understand structure
read_file target_file="path/to/file"

# Read multiple files in parallel
read_file target_file="file1" + read_file target_file="file2"

# Search for patterns
grep pattern="search_term" path="directory"
codebase_search query="semantic search query"
```

### Code Editing
```bash
# Make targeted changes
search_replace file_path="path" old_string="old" new_string="new"

# Multiple edits in one operation
MultiEdit file_path="path" edits=[{old_string, new_string}, ...]

# Create new files
write file_path="path" contents="content"
```

### Development & Testing
```bash
# Check project status
run_terminal_cmd command="git status"
run_terminal_cmd command="npm run build"
run_terminal_cmd command="npm run dev"

# Check for errors
read_lints paths=["file1", "file2"]
```

### Task Management
```bash
# Create task list
todo_write merge=false todos=[{id, content, status}, ...]

# Update progress
todo_write merge=true todos=[{id, status: "completed"}]
```

## 📋 Reusable Workflow Templates

### Template 1: Authentication Setup
```markdown
## Authentication Implementation Checklist

### Phase 1: Analysis
- [ ] Examine existing auth setup
- [ ] Check package.json for auth libraries
- [ ] Review middleware configuration
- [ ] Identify auth patterns in codebase

### Phase 2: Configuration
- [ ] Set up environment variables
- [ ] Configure middleware
- [ ] Update root layout with providers
- [ ] Set up route protection

### Phase 3: UI Implementation
- [ ] Create sign-in page
- [ ] Create sign-up page
- [ ] Implement forgot password
- [ ] Add navigation between auth pages

### Phase 4: Testing & Documentation
- [ ] Test all auth flows
- [ ] Fix linting errors
- [ ] Create documentation
- [ ] Test in production environment
```

### Template 2: Feature Development
```markdown
## Feature Development Workflow

### 1. Research Phase
- [ ] Check official documentation
- [ ] Research best practices
- [ ] Identify existing patterns in codebase

### 2. Planning Phase
- [ ] Break down into small tasks
- [ ] Create todo list
- [ ] Identify dependencies

### 3. Implementation Phase
- [ ] Read existing code first
- [ ] Make incremental changes
- [ ] Test frequently
- [ ] Fix issues immediately

### 4. Quality Assurance
- [ ] Run linting
- [ ] Test builds
- [ ] Verify functionality
- [ ] Update documentation
```

## 🔧 Cursor-Specific Optimizations

### 1. Use Cursor's AI Features
- Leverage Cursor's built-in AI for quick code suggestions
- Use Cursor's chat for immediate questions
- Combine with Claude for complex architectural decisions

### 2. File Management
- Use Cursor's file explorer for quick navigation
- Leverage Cursor's search across files
- Use Cursor's git integration for version control

### 3. Code Editing
- Use Cursor's multi-cursor editing
- Leverage Cursor's refactoring tools
- Use Cursor's IntelliSense for autocomplete

## 📚 Knowledge Base Patterns

### Problem-Solution Documentation
```markdown
## Common Issues & Solutions

### Issue: "Publishable key not valid" Error
**Cause**: Incorrect or missing API keys
**Solution**: 
1. Check .env.local file (takes precedence over .env)
2. Verify keys match dashboard
3. Ensure proper environment variable loading

### Issue: Build Errors After Changes
**Cause**: Linting or TypeScript errors
**Solution**:
1. Run `read_lints` to identify issues
2. Fix errors incrementally
3. Test build after each fix
```

### Reusable Code Patterns
```typescript
// Authentication Middleware Pattern
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

// Custom Auth Page Pattern
'use client'
import { useSignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function AuthPage() {
  // Implementation with proper error handling
}
```

## 🎯 Success Metrics

### Efficiency Indicators
- ✅ Tasks completed without major rework
- ✅ Minimal back-and-forth on requirements
- ✅ Clean, production-ready code
- ✅ Comprehensive documentation

### Quality Indicators
- ✅ All linting errors resolved
- ✅ TypeScript compliance
- ✅ Proper error handling
- ✅ Responsive design
- ✅ Accessibility considerations

## 🚀 Applying This Workflow to New Projects

### 1. Project Setup
```bash
# Clone or create new project
git clone <repository>
cd <project-directory>

# Install dependencies
npm install

# Check project structure
list_dir target_directory="."
```

### 2. Initial Analysis
```bash
# Read key files
read_file target_file="package.json"
read_file target_file="README.md"
read_file target_file="tsconfig.json"

# Understand existing patterns
codebase_search query="How is authentication handled?"
codebase_search query="What UI patterns are used?"
```

### 3. Create Project-Specific Todos
```bash
# Break down the project into manageable tasks
todo_write merge=false todos=[
  {id: "analyze-structure", content: "Analyze project structure and patterns", status: "in_progress"},
  {id: "setup-auth", content: "Set up authentication system", status: "pending"},
  {id: "create-ui", content: "Create user interface components", status: "pending"},
  {id: "test-integration", content: "Test and validate integration", status: "pending"}
]
```

### 4. Follow the Workflow
- Use the templates above
- Apply the same tool usage patterns
- Document solutions as you go
- Test frequently and fix issues immediately

## 📝 Best Practices

### 1. Always Start with Understanding
- Read existing code before making changes
- Understand the project's patterns and conventions
- Check documentation before implementing

### 2. Incremental Development
- Make small, focused changes
- Test after each change
- Fix issues immediately

### 3. Documentation as You Go
- Document solutions to problems
- Create reusable patterns
- Update documentation with each feature

### 4. Quality First
- Fix linting errors immediately
- Ensure TypeScript compliance
- Test thoroughly before moving on

---

**This workflow was successfully used to implement a complete Clerk authentication system with custom UI, middleware configuration, and comprehensive documentation in a Next.js application.**

**Last Updated**: September 16, 2025  
**Status**: ✅ Proven and Reusable
