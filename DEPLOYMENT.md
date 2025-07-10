# Angular Frontend Deployment Guide

This guide explains how to deploy your Angular application using Docker and Nginx.

## Prerequisites

- Docker installed on your system
- Git (for version control)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and run the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 2: Using Docker directly

```bash
# Build the Docker image
docker build -t burger-queen-frontend .

# Run the container
docker run -d -p 80:80 --name burger-queen-frontend burger-queen-frontend

# View logs
docker logs burger-queen-frontend

# Stop the container
docker stop burger-queen-frontend
```

### Option 3: Using the deployment script

```bash
# Make the script executable (Linux/Mac)
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

## Accessing Your Application

Once deployed, your application will be available at:
- **Local**: http://localhost
- **Health Check**: http://localhost/health

## Configuration

### Nginx Configuration

The `nginx.conf` file includes:
- Angular routing support (SPA fallback)
- Gzip compression
- Security headers
- Static asset caching
- API proxy configuration (if needed)
- Health check endpoint

### Environment Variables

You can customize the deployment by setting environment variables in the `docker-compose.yml` file.

## Troubleshooting

### Common Issues

1. **Port 80 already in use**
   ```bash
   # Change the port in docker-compose.yml
   ports:
     - "8080:80"  # Use port 8080 instead
   ```

2. **Build fails due to memory issues**
   ```bash
   # Increase Docker memory limit or use the existing build script
   npm run build:prod
   ```

3. **Application not loading**
   ```bash
   # Check container logs
   docker logs burger-queen-frontend
   
   # Check if container is running
   docker ps
   ```

### Health Check

The application includes a health check endpoint at `/health` that returns a simple "healthy" response.

## Production Deployment

For production deployment:

1. **Use a reverse proxy** (like Traefik or Nginx) in front of the container
2. **Set up SSL/TLS** certificates
3. **Configure environment-specific settings**
4. **Set up monitoring and logging**
5. **Use a container registry** (Docker Hub, AWS ECR, etc.)

## File Structure

```
frontend/
├── Dockerfile          # Multi-stage Docker build
├── nginx.conf          # Nginx configuration
├── docker-compose.yml  # Docker Compose configuration
├── deploy.sh          # Deployment script
├── .dockerignore      # Files to exclude from Docker build
└── DEPLOYMENT.md      # This file
```

## Support

If you encounter issues:
1. Check the container logs: `docker logs burger-queen-frontend`
2. Verify the build process: `docker build -t burger-queen-frontend .`
3. Test the application locally first: `npm run build && npm run start` 