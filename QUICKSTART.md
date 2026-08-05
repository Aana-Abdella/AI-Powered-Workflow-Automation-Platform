# FlowForge Quick Start Guide

Get FlowForge up and running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Step 1: Clone & Configure

```bash
# Clone repository
git clone <repository-url>
cd flowforge

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Step 2: Set Environment Variables

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
```

## Step 3: Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Wait for services to be healthy (30-60 seconds)
docker-compose ps

# Run database migrations
docker-compose exec api npx prisma migrate deploy
```

## Step 4: Access Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health

## Step 5: Create Your First Workflow

### 1. Register an Account

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

Save the `accessToken` from the response.

### 2. Create a Workflow

```bash
curl -X POST http://localhost:4000/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Content Summarizer",
    "description": "Summarizes incoming content using AI",
    "organizationId": "YOUR_ORG_ID",
    "trigger": {
      "type": "webhook",
      "config": {}
    },
    "actions": [
      {
        "type": "ai",
        "config": {
          "operation": "summarize",
          "maxLength": 200
        }
      }
    ]
  }'
```

Save the `webhookToken` from the response.

### 3. Trigger the Workflow

```bash
curl -X POST http://localhost:4000/api/workflows/webhook/YOUR_WEBHOOK_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Artificial intelligence is transforming how we build software. Modern AI systems can understand context, generate code, and even help with complex problem-solving. The integration of AI into development workflows is becoming increasingly common, with tools that assist in everything from code completion to automated testing. This represents a fundamental shift in how software is created and maintained."
  }'
```

### 4. Check Execution Results

```bash
curl -X GET http://localhost:4000/api/workflows/YOUR_WORKFLOW_ID/executions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f frontend
```

### Restart Services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart api
```

### Stop Services

```bash
docker-compose down
```

### Database Management

```bash
# Access database
docker-compose exec postgres psql -U flowforge

# Run migrations
docker-compose exec api npx prisma migrate deploy

# Open Prisma Studio
docker-compose exec api npx prisma studio
```

## Example Workflows

### 1. AI Content Summarizer

```json
{
  "name": "Content Summarizer",
  "trigger": { "type": "webhook", "config": {} },
  "actions": [
    {
      "type": "ai",
      "config": {
        "operation": "summarize",
        "maxLength": 150
      }
    }
  ]
}
```

### 2. Data Extractor + HTTP Post

```json
{
  "name": "Lead Capture",
  "trigger": { "type": "webhook", "config": {} },
  "actions": [
    {
      "type": "ai",
      "config": {
        "operation": "extract",
        "schema": {
          "name": "Contact name",
          "email": "Email address",
          "company": "Company name"
        }
      }
    },
    {
      "type": "http",
      "config": {
        "method": "POST",
        "url": "https://your-crm.com/api/leads",
        "headers": {
          "Authorization": "Bearer YOUR_TOKEN"
        }
      }
    }
  ]
}
```

### 3. Content Transformer

```json
{
  "name": "Professional Rewriter",
  "trigger": { "type": "webhook", "config": {} },
  "actions": [
    {
      "type": "ai",
      "config": {
        "operation": "transform",
        "instruction": "Rewrite this text in a professional business tone"
      }
    }
  ]
}
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker ps

# Check logs for errors
docker-compose logs

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check connection
docker-compose exec postgres psql -U flowforge -c "SELECT 1"
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose logs worker

# Restart worker
docker-compose restart worker

# Check Redis
docker-compose exec redis redis-cli ping
```

### OpenAI API Errors

- Verify your API key is correct
- Check you have credits in your OpenAI account
- Review rate limits on your OpenAI plan

## Next Steps

1. **Explore the Dashboard**: Visit http://localhost:3000 and log in
2. **Read Documentation**: Check out `docs/WORKFLOW_SCHEMA.md`
3. **Review Architecture**: See `ARCHITECTURE.md` for system design
4. **Deploy to Production**: Follow `docs/DEPLOYMENT.md`

## Development Mode

For local development without Docker:

```bash
# Start infrastructure
docker-compose up -d postgres redis

# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev          # Terminal 1
npm run worker       # Terminal 2

# Frontend
cd frontend
npm install
npm run dev          # Terminal 3
```

## Useful Links

- **API Documentation**: http://localhost:4000/api/health
- **Prisma Studio**: Run `docker-compose exec api npx prisma studio`
- **Logs Directory**: `backend/logs/`

## Support

- **Issues**: [GitHub Issues](repository-url/issues)
- **Documentation**: See `docs/` directory
- **Email**: support@flowforge.com

## Security Notes

⚠️ **Important for Production:**

1. Change default JWT secrets
2. Use strong passwords
3. Enable HTTPS
4. Configure firewall
5. Set up monitoring
6. Regular backups

See `docs/DEPLOYMENT.md` for complete production setup.

---

**Congratulations!** 🎉 You now have FlowForge running locally. Start building intelligent automation workflows!
