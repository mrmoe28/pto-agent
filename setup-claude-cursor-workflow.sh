#!/bin/bash

# Claude + Cursor Workflow Setup Script
# This script sets up the proven workflow files in a new project

echo "🚀 Setting up Claude + Cursor Workflow..."

# Create workflow documentation directory
mkdir -p .claude-cursor-workflow

# Copy workflow files
echo "📋 Copying workflow documentation..."
cp CLAUDE_CURSOR_WORKFLOW.md .claude-cursor-workflow/
cp PROJECT_TEMPLATE.md .claude-cursor-workflow/
cp QUICK_REFERENCE.md .claude-cursor-workflow/

# Copy Cursor rules
echo "⚙️ Setting up Cursor rules..."
cp .cursorrules .claude-cursor-workflow/

# Create project-specific todo template
echo "📝 Creating project-specific templates..."
cat > .claude-cursor-workflow/project-todos.md << 'EOF'
# Project-Specific Todos

## Phase 1: Analysis
- [ ] Understand project structure
- [ ] Identify existing patterns
- [ ] Check dependencies and configuration

## Phase 2: Planning
- [ ] Break down requirements into tasks
- [ ] Identify dependencies between tasks
- [ ] Set up development environment

## Phase 3: Implementation
- [ ] Implement core features
- [ ] Add error handling
- [ ] Implement responsive design

## Phase 4: Quality Assurance
- [ ] Fix linting errors
- [ ] Test functionality
- [ ] Update documentation

## Phase 5: Deployment
- [ ] Test in production environment
- [ ] Monitor for issues
- [ ] Document deployment process
EOF

# Create a quick start script
echo "🔧 Creating quick start script..."
cat > .claude-cursor-workflow/quick-start.sh << 'EOF'
#!/bin/bash

echo "🚀 Claude + Cursor Quick Start"
echo "================================"
echo ""
echo "1. Read the workflow documentation:"
echo "   - CLAUDE_CURSOR_WORKFLOW.md (Complete guide)"
echo "   - PROJECT_TEMPLATE.md (Project-specific template)"
echo "   - QUICK_REFERENCE.md (Command reference)"
echo ""
echo "2. Start with project analysis:"
echo "   - Use 'list_dir' to understand structure"
echo "   - Use 'read_file' on key config files"
echo "   - Use 'codebase_search' to understand patterns"
echo ""
echo "3. Create your task list:"
echo "   - Use 'todo_write' to break down work"
echo "   - Update todos as you progress"
echo ""
echo "4. Follow the incremental development approach:"
echo "   - Read before writing"
echo "   - Test frequently"
echo "   - Fix issues immediately"
echo ""
echo "Happy coding! 🎉"
EOF

chmod +x .claude-cursor-workflow/quick-start.sh

# Create a README for the workflow
echo "📖 Creating workflow README..."
cat > .claude-cursor-workflow/README.md << 'EOF'
# Claude + Cursor Workflow

This directory contains the proven workflow for using Claude AI with Cursor IDE to build production-ready applications.

## Files

- `CLAUDE_CURSOR_WORKFLOW.md` - Complete workflow documentation
- `PROJECT_TEMPLATE.md` - Reusable project template
- `QUICK_REFERENCE.md` - Quick command reference
- `.cursorrules` - Cursor IDE rules
- `project-todos.md` - Project-specific todo template
- `quick-start.sh` - Quick start script

## Quick Start

1. Run `./quick-start.sh` for a quick overview
2. Read `CLAUDE_CURSOR_WORKFLOW.md` for complete documentation
3. Use `PROJECT_TEMPLATE.md` as a checklist for new projects
4. Reference `QUICK_REFERENCE.md` for common commands

## Proven Success

This workflow was successfully used to implement:
- Complete Clerk authentication system
- Custom sign-in/sign-up pages
- Forgot password functionality
- Middleware configuration
- Comprehensive documentation

## Customization

Feel free to customize these templates for your specific project needs. The core principles remain the same:
- Read before writing
- Test frequently
- Document solutions
- Follow incremental development
EOF

echo ""
echo "✅ Claude + Cursor Workflow setup complete!"
echo ""
echo "📁 Files created in .claude-cursor-workflow/:"
echo "   - CLAUDE_CURSOR_WORKFLOW.md (Complete guide)"
echo "   - PROJECT_TEMPLATE.md (Project template)"
echo "   - QUICK_REFERENCE.md (Command reference)"
echo "   - .cursorrules (Cursor IDE rules)"
echo "   - project-todos.md (Todo template)"
echo "   - quick-start.sh (Quick start script)"
echo "   - README.md (Workflow overview)"
echo ""
echo "🚀 To get started:"
echo "   cd .claude-cursor-workflow"
echo "   ./quick-start.sh"
echo ""
echo "Happy coding! 🎉"
