# Workflow Schema Documentation

## Overview

Workflows in FlowForge consist of a trigger and one or more actions. This document describes the schema and provides examples.

## Workflow Structure

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  version: number;
  trigger: Trigger;
  actions: Action[];
  webhookUrl?: string;
  webhookToken?: string;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Trigger Types

### 1. Webhook Trigger

Triggers workflow when HTTP request is received at the webhook URL.

```json
{
  "type": "webhook",
  "config": {
    "method": "POST",
    "authentication": "none"
  }
}
```

**Generated Webhook URL:**
```
POST https://your-domain.com/api/workflows/webhook/{token}
```

### 2. Timer Trigger (Future)

Triggers workflow on a schedule.

```json
{
  "type": "timer",
  "config": {
    "schedule": "0 9 * * *",
    "timezone": "UTC"
  }
}
```

### 3. Event Trigger (Future)

Triggers workflow based on system events.

```json
{
  "type": "event",
  "config": {
    "eventType": "user.created",
    "filters": {}
  }
}
```

## Action Types

### 1. HTTP Action

Makes HTTP requests to external APIs.

```json
{
  "type": "http",
  "config": {
    "method": "POST",
    "url": "https://api.example.com/endpoint",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_TOKEN"
    },
    "body": {
      "message": "{{input.message}}"
    },
    "timeout": 30000
  }
}
```

**Supported Methods:**
- GET
- POST
- PUT
- PATCH
- DELETE

**Features:**
- Custom headers
- Request body templating
- Timeout configuration
- Response handling

### 2. AI Action

Processes data using OpenAI.

#### Summarize Operation

```json
{
  "type": "ai",
  "config": {
    "operation": "summarize",
    "maxLength": 200
  }
}
```

**Input:** Text or JSON (will be stringified)
**Output:** Summarized text

#### Transform Operation

```json
{
  "type": "ai",
  "config": {
    "operation": "transform",
    "instruction": "Rewrite this text in a professional tone"
  }
}
```

**Input:** Text or JSON
**Output:** Transformed text

#### Extract Operation

```json
{
  "type": "ai",
  "config": {
    "operation": "extract",
    "schema": {
      "name": "Person's full name",
      "email": "Email address",
      "company": "Company name"
    }
  }
}
```

**Input:** Unstructured text
**Output:** Structured JSON matching schema

### 3. Database Action (Simplified)

Performs database operations.

```json
{
  "type": "database",
  "config": {
    "operation": "insert",
    "table": "custom_data",
    "data": {
      "field1": "{{input.value1}}",
      "field2": "{{input.value2}}"
    }
  }
}
```

**Operations:**
- insert
- update
- query

## Complete Workflow Examples

### Example 1: Webhook → AI Summarization → HTTP Post

```json
{
  "name": "Content Summarizer",
  "description": "Summarizes incoming content and posts to Slack",
  "trigger": {
    "type": "webhook",
    "config": {}
  },
  "actions": [
    {
      "type": "ai",
      "config": {
        "operation": "summarize",
        "maxLength": 150
      }
    },
    {
      "type": "http",
      "config": {
        "method": "POST",
        "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "text": "Summary: {{output}}"
        }
      }
    }
  ]
}
```

**Usage:**
```bash
curl -X POST https://your-domain.com/api/workflows/webhook/{token} \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Long article text here..."
  }'
```

### Example 2: Webhook → AI Data Extraction → Database Insert

```json
{
  "name": "Lead Capture",
  "description": "Extracts lead information from emails",
  "trigger": {
    "type": "webhook",
    "config": {}
  },
  "actions": [
    {
      "type": "ai",
      "config": {
        "operation": "extract",
        "schema": {
          "name": "Contact name",
          "email": "Email address",
          "company": "Company name",
          "interest": "Product interest"
        }
      }
    },
    {
      "type": "database",
      "config": {
        "operation": "insert",
        "table": "leads",
        "data": "{{output}}"
      }
    }
  ]
}
```

### Example 3: Webhook → AI Transform → Multiple HTTP Calls

```json
{
  "name": "Content Distributor",
  "description": "Transforms content and distributes to multiple platforms",
  "trigger": {
    "type": "webhook",
    "config": {}
  },
  "actions": [
    {
      "type": "ai",
      "config": {
        "operation": "transform",
        "instruction": "Rewrite this as a professional social media post under 280 characters"
      }
    },
    {
      "type": "http",
      "config": {
        "method": "POST",
        "url": "https://api.twitter.com/2/tweets",
        "headers": {
          "Authorization": "Bearer YOUR_TWITTER_TOKEN",
          "Content-Type": "application/json"
        },
        "body": {
          "text": "{{output}}"
        }
      }
    },
    {
      "type": "http",
      "config": {
        "method": "POST",
        "url": "https://api.linkedin.com/v2/shares",
        "headers": {
          "Authorization": "Bearer YOUR_LINKEDIN_TOKEN",
          "Content-Type": "application/json"
        },
        "body": {
          "text": "{{output}}"
        }
      }
    }
  ]
}
```

## Data Flow

Actions are executed sequentially, with each action receiving the output of the previous action as input:

```
Webhook Input → Action 1 → Action 2 → Action 3 → Final Output
     ↓              ↓           ↓           ↓
   input        output      output      output
```

**Example Flow:**
1. Webhook receives: `{ "text": "Long article..." }`
2. AI Summarize outputs: `"This is a summary..."`
3. HTTP Post receives: `"This is a summary..."`

## Variable Templating

Use `{{variable}}` syntax to reference data:

- `{{input}}` - Original webhook input
- `{{output}}` - Previous action output
- `{{input.fieldName}}` - Specific field from input
- `{{output.fieldName}}` - Specific field from output

## Error Handling

If an action fails:
- Workflow execution stops
- Error is logged in execution log
- Status is set to FAILED
- Retry logic applies (3 attempts with exponential backoff)

## Best Practices

### 1. Workflow Design
- Keep workflows focused on single purpose
- Use descriptive names and descriptions
- Test with sample data before enabling

### 2. AI Actions
- Provide clear instructions for transform operations
- Define specific schemas for extract operations
- Consider token costs for large inputs

### 3. HTTP Actions
- Always set appropriate timeouts
- Handle authentication securely
- Validate response status codes

### 4. Error Recovery
- Design workflows to be idempotent
- Use appropriate retry strategies
- Monitor execution logs

## API Endpoints

### Create Workflow
```http
POST /api/workflows
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Workflow",
  "description": "Description",
  "trigger": { ... },
  "actions": [ ... ],
  "organizationId": "org-id"
}
```

### Trigger Workflow
```http
POST /api/workflows/webhook/{token}
Content-Type: application/json

{
  "your": "data"
}
```

### Get Executions
```http
GET /api/workflows/{id}/executions
Authorization: Bearer {token}
```

## Limits

- Maximum actions per workflow: 10
- Maximum execution time: 5 minutes
- Maximum input size: 10MB
- Maximum AI input tokens: 4000

## Future Features

- Conditional logic (if/else)
- Loops and iterations
- Parallel action execution
- Custom JavaScript actions
- Workflow templates
- Visual workflow builder
