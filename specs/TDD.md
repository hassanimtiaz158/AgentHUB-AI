# AgentHub AI — Technical Design Document (TDD)

## 1. System Overview

AgentHub AI is a multi-agent coordination platform that connects clients, freelancers, and AI agents. The system uses Aicoo as the coordination layer to manage identity, context sharing, request routing, and cross-agent communication.

## 2. Architecture

```text
Client Browser
    |
    v
Frontend App
    |
    v
Backend API - FastAPI
    |
    |---- AI Analyzer Service
    |---- Agent Matching Service
    |---- Task Routing Service
    |---- Context Memory Service
    |---- Aicoo Integration Service
    |
    v
Database - Supabase PostgreSQL
    |
    v
Aicoo API / Infrastructure
```

## 3. Main Components

### 3.1 Frontend
Responsible for:
- Landing page
- Project submission form
- Agent matching results
- Team workspace
- Task status dashboard
- AI standup summary

### 3.2 Backend API
Responsible for:
- User profile management
- Project creation
- AI project analysis
- Agent recommendation
- Aicoo API communication
- Context storage
- Task routing

### 3.3 AI Analyzer Service
Input:
- Project title
- Description
- Required skills
- Budget
- Deadline

Output:
- Required roles
- Difficulty level
- Task breakdown
- Recommended agents
- Project summary

### 3.4 Agent Matching Service
Matches project needs with agents based on:
- Skills
- Role
- Availability
- Past experience
- Agent context
- User preferences

### 3.5 Aicoo Integration Service
Handles:
- Agent identity registration
- Cross-agent request routing
- Context sharing
- Message passing
- Team coordination workflows

### 3.6 Context Memory Service
Stores:
- User profiles
- Agent profiles
- Project briefs
- Task history
- Message summaries
- Reusable project context

## 4. Database Schema

### users

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | User name |
| email | TEXT | User email |
| role | TEXT | Freelancer, client, founder |
| created_at | TIMESTAMP | Created date |

### agents

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Linked user |
| agent_name | TEXT | Agent display name |
| agent_role | TEXT | Frontend, Backend, AI, Design, QA |
| skills | TEXT[] | Agent skills |
| availability | TEXT | Available / Busy |
| aicoo_agent_id | TEXT | Aicoo identity reference |

### projects

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| client_id | UUID | Project owner |
| title | TEXT | Project title |
| description | TEXT | Project details |
| budget | TEXT | Budget range |
| deadline | DATE | Deadline |
| status | TEXT | Draft, Matching, Active, Completed |

### tasks

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| project_id | UUID | Linked project |
| assigned_agent_id | UUID | Assigned agent |
| title | TEXT | Task name |
| description | TEXT | Task details |
| status | TEXT | Todo, In Progress, Done |

### contexts

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| project_id | UUID | Linked project |
| context_type | TEXT | Brief, Message, Summary, Decision |
| content | TEXT | Stored context |
| allowed_agents | TEXT[] | Agents allowed to access |

## 5. API Endpoints

### Auth / Users

```http
POST /api/users
GET /api/users/{user_id}
```

### Agents

```http
POST /api/agents
GET /api/agents
GET /api/agents/{agent_id}
```

### Projects

```http
POST /api/projects
GET /api/projects
GET /api/projects/{project_id}
```

### AI Analysis

```http
POST /api/projects/{project_id}/analyze
```

### Matching

```http
POST /api/projects/{project_id}/match-agents
```

### Routing

```http
POST /api/projects/{project_id}/route-task
```

### Context

```http
POST /api/projects/{project_id}/context
GET /api/projects/{project_id}/context
```

### Standup

```http
GET /api/projects/{project_id}/standup-summary
```

## 6. Aicoo API Usage

AgentHub AI should use Aicoo for:

### 6.1 Agent Identity
Create or map each platform agent to an Aicoo identity.

Example:
```json
{
  "agent_name": "Frontend Agent",
  "owner": "Hasan Ali",
  "skills": ["React", "Tailwind", "UI"]
}
```

### 6.2 Request Routing
When a project needs frontend work, route the task to the best frontend agent through Aicoo.

### 6.3 Context Sharing
Share only allowed context between agents.

Example:
```json
{
  "project_id": "123",
  "context": "Client wants SaaS-level dashboard UI.",
  "allowed_agents": ["frontend_agent", "ui_agent"]
}
```

### 6.4 Cross-Agent Communication
Allow agents from different users to ask each other questions and share updates.

## 7. Example Agent Workflow

1. Client submits project.
2. Backend sends project description to AI Analyzer.
3. AI Analyzer creates task breakdown.
4. Matching Service finds relevant agents.
5. Aicoo routes tasks to matched agents.
6. Agents respond with availability.
7. Context Memory stores shared project context.
8. Workspace shows team and task progress.
9. AI COO generates standup summary.

## 8. Security Requirements

- Store API keys in environment variables
- Never expose Aicoo API key in frontend
- Validate all API inputs
- Use role-based access to project context
- Only share context with allowed agents
- Use HTTPS in deployment
- Add rate limiting for public endpoints

## 9. Environment Variables

```env
AICOO_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AI_API_KEY=
DATABASE_URL=
```

## 10. Error Handling

The system should handle:
- Aicoo API failure
- AI model timeout
- Missing user profile
- No matching agents found
- Invalid project data
- Unauthorized context access

## 11. Testing Plan

### Unit Tests
- Test project analyzer
- Test agent matching
- Test task routing
- Test context permission logic

### Integration Tests
- Create project → analyze → match agents → route task
- Create context → share with selected agents
- Generate standup summary

### Manual Demo Test
- Open landing page
- Submit project
- View matched agents
- Open workspace
- View AI standup summary

## 12. Deployment Plan

### Frontend
Deploy on Vercel.

### Backend
Deploy on Render.

### Database
Use Supabase PostgreSQL.

### Demo Mode
For hackathon demo, use mock Aicoo responses if real API limits are reached.

## 13. MVP Timeline

### Day 1
- Build UI
- Create database schema
- Create backend endpoints

### Day 2
- Add AI project analyzer
- Add agent matching
- Add Aicoo integration

### Day 3
- Build workspace
- Add standup summary
- Record demo video
- Submit on Devpost
