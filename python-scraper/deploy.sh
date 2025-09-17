#!/bin/bash

# Permit Office Scraper Deployment Script
# This script sets up and deploys the Python scraper using Docker Compose

set -e  # Exit on any error

echo "🚀 Starting Permit Office Scraper Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs data

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating environment file..."
    cp docker.env .env
    echo "⚠️  Please edit .env file with your actual API keys before continuing."
    echo "   Press Enter when ready to continue..."
    read
fi

# Build the Docker images
echo "🔨 Building Docker images..."
docker-compose build

# Start the services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
echo "  - Scraper: docker-compose logs scraper"
echo "  - Scheduler: docker-compose logs scheduler"
echo "  - Database: docker-compose logs postgres"
echo ""
echo "🔧 Management Commands:"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - View logs: docker-compose logs -f"
echo "  - Run one-time scrape: docker-compose run scraper python main.py"
echo ""
echo "🌐 Database Connection:"
echo "  - Host: localhost"
echo "  - Port: 5432"
echo "  - Database: permit_offices"
echo "  - Username: scraper"
echo "  - Password: scraper_password"
echo ""
echo "📈 Next Steps:"
echo "  1. Check logs to ensure scraping is working"
echo "  2. Verify data in the database"
echo "  3. Test integration with your web application"
echo "  4. Configure additional scraping targets in config.py"
