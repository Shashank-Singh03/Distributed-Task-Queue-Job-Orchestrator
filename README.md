# Distributed Task Queue & Job Orchestrator

Production-grade distributed task queue system built with Python, FastAPI, and Redis Streams.

## Features

- **Distributed Task Queue** - Handle 10k+ jobs/min with horizontal scaling
- **Redis Streams + Consumer Groups** - At-least-once delivery guarantee
- **FastAPI Control Plane** - RESTful API for job lifecycle management
- **Retry & Backoff** - Exponential backoff with configurable retry limits
- **Dead Letter Queue** - Automatic handling of failed jobs after max retries
- **Docker Ready** - Containerized deployment with Nginx reverse proxy
- **AWS EC2 Ready** - Designed for zero-downtime rolling updates

## Project Structure

```
app/
  config.py              # Configuration management
  models.py              # Pydantic models and enums
  redis_client.py        # Async Redis client
  api/                   # FastAPI routes
  worker/                # Worker processes
docker/                  # Docker configuration
ui/                      # React frontend
```

## Quick Start

### Prerequisites

- Python 3.10+
- Redis 7+
- Docker & Docker Compose (for containerized deployment)

### Local Development

#### Quick Start (Recommended)

Run both backend and frontend together:

**Windows:**
```powershell
.\run-dev.ps1
```

**Linux/Mac:**
```bash
chmod +x run-dev.sh
./run-dev.sh
```

This will:
- Start Redis, API, Worker, and Nginx via Docker Compose
- Start the React frontend development server
- Make everything available at:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:8000
  - Nginx (proxied): http://localhost:80

To stop all services:
```powershell
.\stop-dev.ps1
```
or
```bash
./stop-dev.sh
```

#### Manual Setup

1. Install backend dependencies:
```bash
pip install -r requirements.txt
```

2. Install frontend dependencies:
```bash
cd ui
npm install
```

3. Start backend services:
```bash
cd docker
docker-compose up -d
```

4. Start frontend:
```bash
cd ui
npm run dev
```

## Configuration

See `.env.example` for all configuration options. Key settings:

- `REDIS_URL` - Redis connection string
- `JOB_STREAM` - Redis stream name for jobs
- `DLQ_STREAM` - Dead letter queue stream name
- `MAX_RETRIES` - Maximum retry attempts
- `INITIAL_BACKOFF_MS` - Initial backoff delay in milliseconds
- `MAX_BACKOFF_MS` - Maximum backoff delay in milliseconds

## API Endpoints

### Health
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Jobs
- `POST /jobs` - Create a new job
- `GET /jobs/{job_id}` - Get job status
- `GET /jobs` - List jobs (paginated)
- `POST /jobs/{job_id}/cancel` - Cancel a job

### Metrics
- `GET /metrics` - Job counts by status and DLQ depth

## Deployment

### Render + Netlify/Vercel (Recommended for Quick Deployment)

This deployment approach uses Render for the backend and Netlify/Vercel for the frontend, with no Docker required.

#### Backend (Render)

1. **Create a new Web Service on Render:**
   - Connect your GitHub repository
   - Select "Web Service" type
   - Environment: Python

2. **Configure Build & Start:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command (Option 1 - Recommended):** `./render_backend_start.sh`
   - **Start Command (Option 2 - Alternative):** `uvicorn app.api.main:app --host 0.0.0.0 --port $PORT`
   
   **Note:** If you get "No such file or directory" error, use Option 2 (direct command) instead.

3. **Set Environment Variables:**
   - `REDIS_URL` - Your Redis connection string (Render Redis or external)
   - `FRONTEND_ORIGIN` - Your frontend URL (e.g., `https://your-app.netlify.app`)
   - `ENVIRONMENT` - Set to `production` to disable dev endpoints

4. **Deploy:**
   - Render will automatically build and deploy on every push to main
   - Your backend will be available at `https://your-service.onrender.com`

**Note:** Make sure `render_backend_start.sh` is executable. Render will handle this automatically, but if deploying manually, run:
```bash
chmod +x render_backend_start.sh
```

#### Frontend (Netlify or Vercel)

**For Netlify:**

1. **Create a new site:**
   - Connect your GitHub repository
   - Base directory: `ui`
   - Build command: `npm run build`
   - Publish directory: `ui/dist`

2. **Set Environment Variables:**
   - `VITE_API_BASE_URL` - Your Render backend URL (e.g., `https://your-service.onrender.com`)

3. **Deploy:**
   - Netlify will automatically build and deploy on every push to main

**For Vercel:**

1. **Import your repository:**
   - Select the repository
   - Root directory: `ui`
   - Framework preset: Vite

2. **Set Environment Variables:**
   - `VITE_API_BASE_URL` - Your Render backend URL (e.g., `https://your-service.onrender.com`)

3. **Deploy:**
   - Vercel will automatically build and deploy on every push to main

#### Local Development with Proxy

For local development, the frontend uses a proxy to the backend:

**Backend:**
```bash
uvicorn app.api.main:app --reload --port 8000
```

**Frontend:**
```bash
cd ui
npm run dev
```

The frontend will proxy `/api/*` requests to `http://localhost:8000`, so API calls work seamlessly in development without CORS issues.

### Docker Compose (Local)

1. Start all services:
```bash
cd docker
docker-compose up -d
```

2. Verify services are running:
```bash
docker-compose ps
```

3. Test the API:
```bash
curl http://localhost/health/live
```

### Load Testing

### Using Locust

A Locust load test script is provided in `scripts/load_test/locustfile.py`.

**Prerequisites:**
```bash
pip install locust
```

**Run Load Test:**
```bash
# Start backend services first
cd docker
docker-compose up -d

# Run Locust
cd ../scripts/load_test
locust -f locustfile.py --host=http://localhost:8000

# Open browser to http://localhost:8089
# Configure users and spawn rate, then start test
```

**Observe Throughput:**
- Monitor `/metrics` endpoint for `jobs_created_total` and `jobs_completed_total`
- Check worker logs for processing rate
- Use Locust dashboard to see request rates

**Example Test Scenarios:**
- **Light Load:** 10 users, spawn rate 2
- **Medium Load:** 50 users, spawn rate 5
- **Heavy Load:** 200 users, spawn rate 10

### Synthetic Job Generation

For quick testing without load tools, use the dev endpoint:

```bash
# Generate 1000 synthetic jobs
curl -X POST http://localhost:8000/dev/generate-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "count": 1000,
    "partition_key_prefix": "test",
    "task_type": "synthetic",
    "payload_template": {"test": true}
  }'
```

**Note:** This endpoint is disabled in production (`environment=production`).

## AWS EC2 Deployment

#### Deployment Topology

The system is designed for deployment on AWS EC2 with the following architecture:

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (ALB/NLB)     │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼──────┐         ┌────────▼──────┐
        │   EC2-1      │         │    EC2-2      │
        │              │         │               │
        │  ┌────────┐  │         │  ┌────────┐   │
        │  │ Nginx  │  │         │  │ Nginx  │   │
        │  └───┬────┘  │         │  └───┬────┘   │
        │      │       │         │      │        │
        │  ┌───▼────┐ │         │  ┌───▼────┐    │
        │  │  API   │ │         │  │  API  │    │
        │  └───┬────┘ │         │  └───┬────┘    │
        │      │       │         │      │        │
        │  ┌───▼────┐ │         │  ┌───▼────┐    │
        │  │ Worker │ │         │  │ Worker │    │
        │  └───┬────┘ │         │  └───┬────┘    │
        │      │       │         │      │        │
        └──────┼───────┘         └──────┼────────┘
               │                         │
               └──────────┬───────────────┘
                         │
                  ┌──────▼──────┐
                  │ Redis       │
                  │ (ElastiCache)│
                  └──────────────┘
```

**Components:**
- **Load Balancer**: AWS Application Load Balancer (ALB) or Network Load Balancer (NLB)
- **EC2 Instances**: 2+ instances running the full stack (Nginx, API, Worker)
- **Redis**: AWS ElastiCache for Redis (or self-managed Redis cluster)

#### EC2 Instance Setup

1. **Launch EC2 Instances:**
   - Use Amazon Linux 2 or Ubuntu 22.04 LTS
   - Minimum: t3.medium (2 vCPU, 4GB RAM)
   - Recommended: t3.large or larger for production
   - Security Group: Allow HTTP (80), HTTPS (443), and SSH (22)

2. **Install Dependencies:**
```bash
# Update system
sudo yum update -y  # Amazon Linux
# or
sudo apt-get update && sudo apt-get upgrade -y  # Ubuntu

# Install Docker
sudo yum install docker -y  # Amazon Linux
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. **Deploy Application:**
```bash
# Clone repository
git clone <repository-url>
cd DTQ

# Configure environment
cp .env.example .env
# Edit .env with production settings:
# - REDIS_URL pointing to ElastiCache endpoint
# - ENVIRONMENT=production

# Build and start services
cd docker
docker-compose up -d --build
```

#### Load Balancer Configuration

1. **Create Target Group:**
   - Protocol: HTTP
   - Port: 80
   - Health Check Path: `/health/ready`
   - Health Check Interval: 30 seconds
   - Unhealthy Threshold: 3

2. **Register EC2 Instances:**
   - Add all EC2 instances to the target group
   - Ensure instances pass health checks

3. **Configure Listener:**
   - HTTP (80) → Target Group
   - Optional: HTTPS (443) with SSL certificate

#### Rolling Update Strategy

Zero-downtime deployments using rolling updates:

1. **Prepare New Version:**
```bash
# On deployment server or CI/CD
git pull origin main
docker-compose build
```

2. **Deploy to Instance 1:**
```bash
# SSH to EC2-1
cd /path/to/DTQ

# Drain instance from load balancer
# (Remove from target group via AWS Console/CLI)

# Wait for in-flight requests to complete (30-60 seconds)

# Deploy new version
git pull origin main
cd docker
docker-compose down
docker-compose up -d --build

# Verify health
curl http://localhost/health/ready

# Re-register instance to load balancer
# (Add back to target group via AWS Console/CLI)

# Wait for health checks to pass
```

3. **Deploy to Instance 2:**
   - Repeat steps from Instance 1

4. **Verification:**
```bash
# Check all instances are healthy
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Test API endpoints
curl https://<load-balancer-dns>/health/live
curl https://<load-balancer-dns>/metrics/
```

#### Redis Setup

**Option 1: AWS ElastiCache (Recommended)**
- Create ElastiCache Redis cluster
- Update `REDIS_URL` in `.env` to ElastiCache endpoint
- Ensure EC2 security group allows access to ElastiCache

**Option 2: Self-Managed Redis**
- Deploy Redis on dedicated EC2 instance or cluster
- Use Redis Sentinel for high availability
- Configure Redis persistence (AOF)

#### Monitoring & Observability

1. **Health Checks:**
   - `/health/live` - Liveness probe (Kubernetes/ECS)
   - `/health/ready` - Readiness probe

2. **Metrics:**
   - `/metrics/` - Job counts by status, DLQ depth
   - Integrate with CloudWatch or Prometheus

3. **Logging:**
   - Container logs: `docker-compose logs -f api worker`
   - CloudWatch Logs: Configure log drivers

#### Scaling Considerations

- **Horizontal Scaling**: Add more EC2 instances behind load balancer
- **Worker Scaling**: Increase worker replicas per instance or add dedicated worker instances
- **Redis Scaling**: Use ElastiCache cluster mode for Redis scaling
- **Auto Scaling**: Configure ASG based on CPU/memory metrics

#### Security Best Practices

1. **Network Security:**
   - Use VPC with private subnets for EC2 instances
   - Use security groups to restrict access
   - Enable SSL/TLS termination at load balancer

2. **Secrets Management:**
   - Use AWS Secrets Manager or Parameter Store for sensitive config
   - Never commit `.env` files to version control

3. **Access Control:**
   - Use IAM roles for EC2 instances
   - Restrict SSH access to bastion host

## License

MIT

