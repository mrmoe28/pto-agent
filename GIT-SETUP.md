# GitHub Setup for Parallel Development

## Initial Setup (Do Once Per Location)

### 1. Create GitHub Repository
```bash
# On GitHub.com, create a new repository called "pto-agent"
# Don't initialize with README (we already have files)
```

### 2. Connect Local Repository to GitHub
```bash
# Initialize git if not already done
git init

# Add all files
git add .
git commit -m "feat: initial commit with Neon database migration"

# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/pto-agent.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## For Second Location Setup

### Option A: Clone the Repository
```bash
# Navigate to your desired directory
cd /path/to/projects

# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/pto-agent.git
cd pto-agent

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual Neon DATABASE_URL
```

### Option B: If You Already Have the Project
```bash
# Navigate to existing project directory
cd /path/to/pto-agent

# Add remote origin (if not already added)
git remote add origin https://github.com/YOUR_USERNAME/pto-agent.git

# Pull latest changes
git pull origin main

# Push your current state
git push -u origin main
```

## Daily Workflow Commands

### Before Starting Work
```bash
git pull origin main
```

### After Making Changes
```bash
git add .
git commit -m "feat: your descriptive message"
git push origin main
```

### If Someone Else Pushed While You Were Working
```bash
git pull origin main
# If conflicts, resolve them in your editor
git add .
git commit -m "fix: resolved merge conflicts"
git push origin main
```

## Branch Strategy (Recommended for Complex Changes)

### For Major Features
```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Make changes and commit
git add .
git commit -m "feat: implement new feature"

# Push feature branch
git push origin feature/new-feature-name

# Create Pull Request on GitHub
# After review, merge to main
```

### For Quick Fixes (Direct to Main)
```bash
git add .
git commit -m "fix: quick bug fix"
git push origin main
```

## Authentication Options

### Option 1: HTTPS with Personal Access Token
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Create new token with repo permissions
3. Use token as password when prompted

### Option 2: SSH Keys (Recommended)
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG Keys → New SSH Key
# Change remote URL to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/pto-agent.git
```

## Troubleshooting

### If Git Says "Permission Denied"
- Check your GitHub username/token
- Make sure repository exists and you have write access

### If You Get "Repository Not Found"
- Verify repository name and your access
- Check if repository is public/private and your permissions

### If Merge Conflicts Occur
1. Open conflicted files in your editor
2. Look for `<<<<<<< HEAD` and `>>>>>>> branch-name` markers
3. Choose which version to keep
4. Remove the conflict markers
5. `git add .` and `git commit`

## Environment Variables
Remember to set up `.env.local` in both locations:
```bash
DATABASE_URL=your_neon_database_url_here
LOCATIONIQ_ACCESS_TOKEN=your_token_here
GOOGLE_MAPS_API_KEY=your_key_here
```