# AI Ad Yuugen Deployment Guide

This guide covers deployment strategies for the AI Ad Yuugen platform across different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Docker**: >= 20.10.0 (for containerized deployment)
- **Docker Compose**: >= 2.0.0 (for local container orchestration)

### Required Accounts

- **npm**: For package publishing
- **Docker Hub**: For container image hosting
- **GitHub**: For CI/CD and source control
- **Cloud Provider**: AWS, GCP, or Azure (for production deployment)

## Local Development

### Setup

```bash
# Clone repository
git clone https://github.com/ai-yuugen/platform.git
cd platform

# Install dependencies
npm ci

# Build all packages
npm run build

# Run tests
npm run test
```

### Running Services Locally

```bash
# Start all services in development mode
npm run dev

# Or start individual services
npm run dev:server      # Ad server on port 3000
npm run dev:portal      # Developer portal on port 8080
npm run dev:storybook   # Storybook on port 6006
```

## Docker Deployment

### Building Images

```bash
# Build server image
docker build -f docker/Dockerfile.server -t ai-yuugen/server:latest .

# Build portal image
docker build -f docker/Dockerfile.portal -t ai-yuugen/portal:latest .
```

### Running with Docker Compose

```bash
# Start all services
cd docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services

- **Server**: http://localhost:3000
- **Developer Portal**: http://localhost:8080
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Redis**: localhost:6379

### Environment Variables

Create a `.env.production` file in the root directory:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# API Keys
AI_YUUGEN_API_KEY=your-api-key-here
ADCP_API_KEY=your-adcp-key-here

# Database
REDIS_URL=redis://redis:6379

# ADCP Configuration
ADCP_MCP_URL=https://mcp.adcp-platform.com
ADCP_ENABLED=true

# Monitoring
PROMETHEUS_ENABLED=true
METRICS_PORT=9090

# Security
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=https://your-domain.com
```

## Cloud Deployment

### AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Push images to ECR**:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag ai-yuugen/server:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-yuugen-server:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-yuugen-server:latest

docker tag ai-yuugen/portal:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-yuugen-portal:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-yuugen-portal:latest
```

2. **Create ECS task definitions** (see `aws/ecs-task-definition.json`)

3. **Deploy to ECS**:

```bash
aws ecs update-service --cluster ai-yuugen-cluster --service ai-yuugen-server --force-new-deployment
```

#### Using Kubernetes (EKS)

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-yuugen-server
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-yuugen-portal

# Deploy to Cloud Run
gcloud run deploy ai-yuugen-server \
  --image gcr.io/PROJECT_ID/ai-yuugen-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

gcloud run deploy ai-yuugen-portal \
  --image gcr.io/PROJECT_ID/ai-yuugen-portal \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure

#### Using Azure Container Instances

```bash
# Create resource group
az group create --name ai-yuugen-rg --location eastus

# Deploy containers
az container create \
  --resource-group ai-yuugen-rg \
  --name ai-yuugen-server \
  --image aiyuugen/server:latest \
  --dns-name-label ai-yuugen-server \
  --ports 3000

az container create \
  --resource-group ai-yuugen-rg \
  --name ai-yuugen-portal \
  --image aiyuugen/portal:latest \
  --dns-name-label ai-yuugen-portal \
  --ports 8080
```

## CI/CD Pipeline

### GitHub Actions Workflows

The project includes automated CI/CD pipelines:

#### Continuous Integration (`.github/workflows/ci.yml`)

Runs on every push and pull request:
- Linting
- Type checking
- Unit tests
- E2E tests
- Security audits
- Bundle size checks

#### Release Pipeline (`.github/workflows/release.yml`)

Triggered by version tags (e.g., `v1.0.0`):
- Validates release
- Builds all packages
- Publishes to npm
- Builds and pushes Docker images
- Deploys documentation
- Sends notifications

### Creating a Release

```bash
# Prepare release
./scripts/prepare-release.sh

# Update version in package.json files
npm version patch  # or minor, major

# Create and push tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Actions will automatically:
# 1. Run all tests
# 2. Build packages
# 3. Publish to npm
# 4. Build Docker images
# 5. Deploy documentation
```

### Manual Publishing

```bash
# Dry run (test without publishing)
./scripts/publish-packages.sh --dry-run

# Publish to npm
./scripts/publish-packages.sh
```

## Monitoring and Alerting

### Prometheus Metrics

The platform exposes metrics at `/metrics` endpoint:

- **HTTP metrics**: Request rate, duration, status codes
- **Ad serving metrics**: Ad requests, impressions, clicks, CTR
- **ADCP metrics**: Signal discovery, activation, costs
- **Cache metrics**: Hit rate, miss rate, evictions
- **System metrics**: CPU, memory, disk usage

### Grafana Dashboards

Access Grafana at http://localhost:3001 (default: admin/admin)

Pre-configured dashboards:
- **Overview**: System health and key metrics
- **Ad Serving**: Ad performance and revenue
- **ADCP Integration**: Signal usage and costs
- **Performance**: Response times and throughput
- **Errors**: Error rates and types

### Alerts

Prometheus alerts are configured in `docker/prometheus-rules.yml`:

- High error rate (>5% for 5 minutes)
- High response time (>1s p95 for 5 minutes)
- Service down (>2 minutes)
- High memory usage (>90% for 5 minutes)
- High CPU usage (>80% for 5 minutes)
- Low cache hit rate (<70% for 10 minutes)
- High ad request failure rate (>10% for 5 minutes)
- ADCP integration failures
- Low disk space (<10%)
- Redis connection failures

### Setting Up Alertmanager

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: 'AI Ad Yuugen Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

## Health Checks

### Server Health Check

```bash
curl http://localhost:3000/health
# Response: {"status":"healthy","timestamp":"2025-01-01T00:00:00.000Z"}
```

### Portal Health Check

```bash
curl http://localhost:8080/health
# Response: healthy
```

### Docker Health Checks

Health checks are built into Docker containers:

```bash
# Check container health
docker ps
# Look for "healthy" status

# View health check logs
docker inspect --format='{{json .State.Health}}' ai-yuugen-server
```

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clean build cache
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Port Conflicts

```bash
# Check what's using the port
lsof -i :3000
lsof -i :8080

# Kill process
kill -9 <PID>
```

#### Docker Issues

```bash
# Clean Docker resources
docker-compose down -v
docker system prune -a

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

#### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Logs

#### Application Logs

```bash
# Server logs
docker-compose logs -f server

# Portal logs
docker-compose logs -f portal

# All logs
docker-compose logs -f
```

#### System Logs

```bash
# Prometheus logs
docker-compose logs -f prometheus

# Grafana logs
docker-compose logs -f grafana

# Redis logs
docker-compose logs -f redis
```

### Performance Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev:server

# Profile Node.js application
node --inspect packages/server/dist/index.js

# Monitor resource usage
docker stats
```

## Security Best Practices

### Environment Variables

- Never commit `.env` files
- Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
- Rotate API keys regularly
- Use different keys for different environments

### Container Security

- Run containers as non-root user (already configured)
- Keep base images updated
- Scan images for vulnerabilities
- Use minimal base images (alpine)

### Network Security

- Use HTTPS in production
- Configure CORS properly
- Implement rate limiting
- Use API authentication

### Monitoring

- Enable audit logging
- Monitor for suspicious activity
- Set up security alerts
- Regular security audits

## Backup and Recovery

### Database Backups

```bash
# Backup Redis data
docker exec ai-yuugen-redis redis-cli BGSAVE

# Copy backup file
docker cp ai-yuugen-redis:/data/dump.rdb ./backup/
```

### Configuration Backups

```bash
# Backup environment variables
cp .env.production .env.production.backup

# Backup Docker volumes
docker run --rm -v ai-yuugen_redis-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/redis-data.tar.gz /data
```

## Scaling

### Horizontal Scaling

```bash
# Scale server instances
docker-compose up -d --scale server=3

# Or in Kubernetes
kubectl scale deployment ai-yuugen-server --replicas=3
```

### Load Balancing

Use a load balancer (nginx, HAProxy, AWS ALB) to distribute traffic:

```nginx
upstream ai_yuugen_servers {
    server server1:3000;
    server server2:3000;
    server server3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://ai_yuugen_servers;
    }
}
```

## Support

For deployment support:
- **Documentation**: https://docs.ai-yuugen.com
- **Email**: support@ai-yuugen.com
- **Discord**: https://discord.gg/ai-yuugen
- **GitHub Issues**: https://github.com/ai-yuugen/platform/issues
