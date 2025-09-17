#!/bin/bash

# Local Python Scraper Setup Script
# This runs the scraper directly without Docker

echo "🐍 Setting up Python scraper locally..."

# Check if Python 3.11+ is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python $PYTHON_VERSION found. Python 3.8+ is required."
    exit 1
fi

echo "✅ Python $PYTHON_VERSION found"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements-py39.txt

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
playwright install chromium

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs data

# Copy environment file
if [ ! -f .env ]; then
    echo "📋 Creating environment file..."
    cp docker.env .env
    echo "⚠️  Please edit .env file with your actual API keys before continuing."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To run the scraper:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Edit .env file with your API keys"
echo "  3. Run scraper: python main.py"
echo "  4. Run scheduler: python scheduler.py"
echo ""
echo "🔧 Management commands:"
echo "  - One-time scrape: python main.py"
echo "  - Start scheduler: python scheduler.py"
echo "  - Deactivate venv: deactivate"
