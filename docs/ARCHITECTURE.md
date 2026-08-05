# FlowForge Architecture Documentation

## System Overview

FlowForge is a production-ready, multi-tenant SaaS automation platform built with modern technologies and best practices. The system follows a microservices-inspired architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (React + TypeScript + TailwindCSS)     │   │
│  │  - Server-Side Rendering (SSR)                           │   │
│  │  - Client-Side State Management (Zustand)                │   │
│  │  - API Client (Axios + React Query)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Reverse Proxy Layer                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Nginx                                                    │   │
│  │  - Load Balancing                                        │   │
│  │  - SSL Termination                                       │   │
│  │  - Rate Limiting                                         │   │
│  │  - Static File Caching                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│     API Server Layer         │   │    Worker Service Layer      │
│  ┌────────────────────────┐  │   │  ┌────────────────────────┐  │
│  │  Express.js + TypeScript│  │   │  │  BullMQ Workers        │  │
│  │  - RESTful API         │  │   │  │  - Workflow Execution  │  │
│  │  - JWT Authentication  │  │   │  │  - AI Processing       │  │
│  │  - RBAC Authorization  │  │   │  │  - HTTP Actions        │  │
│  │  - Input Validation    │  │   │  │  - Database Actions    │  │
│  │  - Rate Limiting       │  │   │  └────────────────────────┘  │
│  └────────────────────────┘  │   └──────────────────────────────┘
└──────────────────────────────┘                 │
                    │                            │
                    │                            │
         ┌──────────┼────────────────────────────┤
         │          │                            │
         ▼          ▼                            ▼
┌─────────────┐ ┌──────────┐          ┌──────────────────┐
│ PostgreSQL  │ │  Redis   │          │  External APIs   │
│  Database   │ │  Cache & │          │  - OpenAI        │
│  - Prisma   │ │  Queue   │          │  - Webhooks      │
│  - Multi-   │ │  - BullMQ│          │  - HTTP Services │
│    tenant   │ │  - Session│         └──────────────────┘
└─────────────┘ └──────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7 + BullMQ
- **Authentication**: JWT (Access + Refresh Tokens)
- **Validation**: Zod
- **Logging**: Winston
- **AI Integration**: OpenAI API

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Process Manager**: PM2 (optional)

## Core Components

### 1. Authentication System

**Flow:**
```
User Registration → Password Hashing (bcrypt) → User Creation → 
Organization Creation → JWT Token Generation → Refresh Token Storage
```

**Features:**
- Email/password authentication
- JWT access tokens (15min expiry)
- Refresh tokens (7 days expiry)
- Password reset flow
- Email verification (simulated)
- Secure cookie handling

**Security:**
- bcrypt with 12 salt rounds
- HTTP-only cookies for refresh tokens
- Token rotation on refresh
- Rate limiting on auth endpoints

### 2. Multi-Tenant Architecture

**Data Isolation:**
- Organization-based tenancy
- Row-level security via Prisma
- User-Organization membership model
- Role-Based Access Control (RBAC)

**Roles:**
- **ADMIN**: Full organization access
- **MEMBER**: Limited organization access

### 3. Workflow Engine

**Workflow Structure:**
```json
{
  "id": "workflow-id",
  "name": "My Workflow",
  "trigger": {
    "type": "webhook",
    "config": { ... }
  },
  "actions": [
    {
      "type": "ai",
      "config": {
        "operation": "summarize"
      }
    },
    {
      "type": "http",
      "config": {
        "method": "POST",
        "url": "https://api.example.com/endpoint"
      }
    }
  ]
}
```

**Trigger Types:**
- **Webhook**: HTTP endpoint trigger
- **Timer**: Scheduled execution (future)
- **Event**: Event-driven trigger (future)

**Action Types:**
- **HTTP**: Make HTTP requests
- **AI**: OpenAI processing (summarize, transform, extract)
- **Database**: Database operations

### 4. Queue System

**Architecture:**
```
Webhook Request → Create Execution Log → Enqueue Job → 
Worker Picks Job → Execute Actions → Update Execution Log → 
Update Usage Metrics
```

**Features:**
- Async job processing with BullMQ
- Configurable concurrency (5 workers)
- Automatic retries (3 attempts)
- Exponential backoff
- Job progress tracking
- Failed job retention

### 5. AI Processing

**Supported Operations:**
- **Summarize**: Text summarization
- **Transform**: Text transformation with instructions
- **Extract**: Structured data extraction

**Cost Tracking:**
- Token usage monitoring
- Cost estimation per execution
- Organization-level usage aggregation

### 6. Usage Tracking & Billing

**Metrics Tracked:**
- API calls per organization
- Workflow executions
- AI tokens consumed
- Estimated costs

**Aggregation:**
- Daily metrics per organization
- Historical data retention
- Real-time usage updates

## Database Schema

### Core Tables

**users**
- User authentication and profile
- Email verification status
- Active/inactive flag

**organizations**
- Multi-tenant organization data
- Unique slug for identification

**organization_members**
- User-Organization relationship
- Role assignment (ADMIN/MEMBER)

**workflows**
- Workflow definitions (JSON)
- Webhook configuration
- Enable/disable status
- Version tracking

**execution_logs**
- Workflow execution history
- Input/output data
- Status tracking
- AI usage metrics

**usage_metrics**
- Daily usage aggregation
- Cost estimation
- Organization-level metrics

**refresh_tokens**
- JWT refresh token storage
- Expiration tracking

**password_reset_tokens**
- Password reset flow
- One-time use tokens

## API Design

### RESTful Principles
- Resource-based URLs
- HTTP methods (GET, POST, PATCH, DELETE)
- Consistent response format
- Proper status codes

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": []
  }
}
```

## Security Measures

### Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Organization-level data isolation
- Refresh token rotation

### Input Validation
- Zod schema validation
- SQL injection prevention (Prisma)
- XSS protection
- CORS configuration

### Rate Limiting
- API endpoints: 100 req/15min
- Auth endpoints: 5 req/15min
- Webhooks: 60 req/min

### Security Headers
- Helmet.js for secure headers
- HTTPS enforcement (production)
- Secure cookie flags
- CSRF protection

## Scalability Strategy

### Horizontal Scaling

**API Servers:**
- Stateless design
- Load balancing via Nginx
- Session storage in Redis
- Multiple instances behind LB

**Workers:**
- Independent worker processes
- Scale based on queue depth
- Distributed job processing

**Database:**
- Read replicas for read-heavy ops
- Connection pooling
- Query optimization
- Proper indexing

### Vertical Scaling
- Increase container resources
- Optimize database queries
- Implement caching layers
- Background job processing

### Performance Optimization
- CDN for static assets
- Database query optimization
- Redis caching
- Gzip compression
- HTTP/2 support

## Monitoring & Logging

### Logging Strategy
- Structured logging (Winston)
- Log levels: error, warn, info, debug
- Separate log files by level
- Log rotation and retention

### Metrics to Monitor
- API response times
- Queue depth and processing time
- Database query performance
- Error rates
- Resource utilization (CPU, memory)

### Health Checks
- API server health endpoint
- Database connectivity
- Redis connectivity
- Worker process status

## Deployment

### Development
```bash
docker-compose up -d postgres redis
npm run dev (backend)
npm run worker (backend)
npm run dev (frontend)
```

### Production
```bash
docker-compose up -d
```

### Environment Variables
- Separate configs per environment
- Secret management
- Environment validation on startup

## Future Enhancements

### Phase 2
- Email service integration
- Timer-based triggers
- More action types (Slack, Email, etc.)
- Workflow templates
- Visual workflow builder

### Phase 3
- Webhook signature verification
- API key authentication
- Webhook retry logic
- Workflow versioning UI
- Advanced analytics dashboard

### Phase 4
- Multi-region deployment
- Real-time collaboration
- Workflow marketplace
- Custom integrations SDK
- Advanced AI operations

## Best Practices

### Code Organization
- Clean Architecture principles
- Separation of concerns
- DRY (Don't Repeat Yourself)
- SOLID principles

### Error Handling
- Custom error classes
- Global error handler
- Proper error logging
- User-friendly error messages

### Testing Strategy
- Unit tests for services
- Integration tests for APIs
- E2E tests for critical flows
- Test coverage > 80%

### Documentation
- Code comments for complex logic
- API documentation
- Architecture documentation
- Deployment guides

## Conclusion

FlowForge is designed as a production-ready platform with scalability, security, and maintainability as core principles. The architecture supports horizontal scaling, provides robust error handling, and implements industry-standard security practices.
