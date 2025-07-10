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

---

## How to Fix

### 1. **Check your Dockerfile `CMD` and `ENTRYPOINT`**
Your Dockerfile should **not** run `ng serve` or any `ng` command in the final stage.  
It should only run Nginx:

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

### 2. **Check Railway/Deploy Platform Settings**
- Make sure your deploy command is **not** set to `ng serve` or `npm start`.
- It should just start the container (which will run Nginx by default).

### 3. **Check your `package.json`**
- The `"start"` script is currently `"ng serve"`.  
- This is **not used in Docker production** (unless your platform tries to run `npm start` by default).
- If your deploy platform tries to run `npm start`, it will fail.  
- **Solution:**  
  - Either set the start script to `"start": "nginx -g 'daemon off;'"` (not recommended, as this is not standard for Node projects),  
  - Or, configure your deploy platform to just run the container as built.

---

## **Summary Table**

| Stage         | What should happen?         | What should NOT happen?         |
|---------------|----------------------------|---------------------------------|
| Build         | `ng build` (in Node)       |                                 |
| Final/Runtime | Nginx serves static files  | `ng serve`, `ng`, or `npm start`|

---

## **What To Do Next**

1. **Double-check your Dockerfile**:  
   - The final stage should only run Nginx.
2. **Check your deploy settings on Railway**:  
   - Make sure it does **not** try to run `ng serve` or `npm start`.
   - It should just run the container as built.
3. **If Railway requires a start command,** set it to:  
   ```
   nginx -g 'daemon off;'
   ```
   or leave it blank if possible.

---

### If you need to serve the Angular app with Nginx, you should **never** use `ng serve` in production.  
**`ng serve` is for development only!**

---

**If you show me your Railway deploy settings or how you trigger the container, I can give you the exact fix for your setup.**  
Let me know if you want to see a sample Railway configuration! 
