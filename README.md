**Chatbot Application**
A full-stack chatbot application built with React, Nhost Authentication, Hasura GraphQL, and n8n workflow automation.
**Deployed URL:**[melodious-peony-e2b29d.netlify.app]
**G-Drive Link(Visual Proofs):**[https://drive.google.com/drive/folders/1l1aCB1sa6EL2xpVUj8W9Y6VjxA1Ysllb?usp=sharing]
🎯 **Overview**
This chatbot application demonstrates a complete implementation of modern web development practices with:

Secure Authentication using Nhost Auth
Real-time Communication via GraphQL subscriptions
AI-Powered Chatbot integrated through n8n workflows
Row-Level Security ensuring data privacy
GraphQL-Only Architecture for all client-server communication

🏗️ **Architecture**
System Architecture Flow
User Frontend (React) 
    ↓ GraphQL Only
Nhost Auth + Hasura GraphQL
    ↓ Hasura Actions
n8n Workflow
    ↓ HTTP Request
OpenRouter AI API
    ↓ Response
Database (PostgreSQL)
**Component Architecture**
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Nhost/Hasura   │    │   n8n Workflow  │
│                 │    │                 │    │                 │
│ • Auth UI       │◄──►│ • Authentication│◄──►│ • Webhook       │
│ • Chat List     │    │ • GraphQL API   │    │ • AI Integration│
│ • Messages      │    │ • Subscriptions │    │ • Data Validation│
│ • Real-time UI  │    │ • Permissions   │    │ • Response Logic│
└─────────────────┘    └─────────────────┘    └─────────────────┘
**Features**
**Authentication**

✅ Email-based sign up/sign in
✅ Protected routes
✅ Automatic token refresh
✅ Secure logout

**Chat System**

✅ Create new chat conversations
✅ Real-time message updates
✅ Message history persistence
✅ User-specific chat isolation

**AI Chatbot**

✅ OpenRouter AI integration
✅ Context-aware responses
✅ Secure API key management
✅ Error handling & fallbacks

**Security**

✅ Row-Level Security (RLS)
✅ JWT-based authentication
✅ Role-based permissions
✅ Input validation

🛠️ Tech Stack
**Frontend**

React 18 - UI framework
TypeScript - Type safety
Tailwind CSS - Styling
GraphQL CodeGen - Type-safe GraphQL
Apollo Client - GraphQL client

**Backend**

Nhost - Backend-as-a-Service
Hasura - GraphQL engine
PostgreSQL - Database
n8n - Workflow automation

**AI & External Services**

OpenRouter - AI API gateway
Meta Llama 3.2 - Language model

**Deployment**
Netlify - Frontend hosting
Nhost Cloud - Backend hosting

🗄️ **Database Schema**
**Tables Structure**
**chats Table**
ColumnTypeDescriptionidUUIDPrimary keyuser_idUUIDForeign key to auth.userstitleTEXTChat titlecreated_atTIMESTAMPTZCreation timestampupdated_atTIMESTAMPTZLast update timestamp
**messages Table**
ColumnTypeDescriptionidUUIDPrimary keychat_idUUIDForeign key to chatscontentTEXTMessage contentis_botBOOLEANWhether message is from botcreated_atTIMESTAMPTZCreation timestamp
Relationships
sqlchats.user_id → auth.users.id (many-to-one)
messages.chat_id → chats.id (many-to-one)
🔐 Authentication & Permissions
Row-Level Security (RLS)

Netlify - Frontend hosting
Nhost Cloud - Backend hosting

**Hasura Permissions**
**User Role Permissions**
chats: select, insert, update with row-level filtering
messages: select, insert with chat ownership validation
Actions: sendMessage with authentication required

🔄 **n8n Workflow**
Complete Workflow Summary
The n8n workflow consists of 10 interconnected nodes that handle the complete chatbot interaction pipeline:
Webhook → Code 1 → HTTP 1 → Code 2 → HTTP 2 → Code 3 → HTTP 3 → Code 4 → HTTP 4 → Code 5

**Detailed Node Breakdown**
Webhook Node - Receives data from Hasura Action

Method: POST
Authentication: Bearer token validation
Captures user session and message data


Code 1 - Validates user authentication and extracts data

Extracts user ID from session variables
Validates JWT token authenticity
Prepares data for ownership verification


HTTP 1 - Validates chat ownership in database

GraphQL query to Hasura Console
Verifies user owns the specified chat_id
Security layer against unauthorized access


Code 2 - Processes validation response

Checks database validation results
Handles ownership verification logic
Prepares for chat history retrieval


HTTP 2 - Gets chat history for context

GraphQL query to fetch previous messages
Retrieves conversation context
Builds message history for AI context


Code 3 - Prepares AI request with history

Combines user message with chat history
Formats messages for OpenRouter API
Sets conversation parameters


HTTP 3 - Calls OpenRouter AI API

API Key: OpenRouter authentication for Llama 3.2 integration
Model: meta-llama/llama-3.2-3b-instruct:free
Parameters: Temperature 0.7, Max tokens 1000


Code 4 - Processes AI response

Extracts AI response content
Validates response format
Prepares for database storage


HTTP 4 - Saves AI response to database

GraphQL mutation via Hasura Console
Inserts AI message into messages table
Updates chat timestamp


Code 5 - Returns formatted response to Hasura

Formats final response payload
Returns success status and AI message
Completes the Action workflow



**API Integration Details**
OpenRouter Configuration

Service: OpenRouter API Gateway
Model: Meta Llama 3.2 (3B parameters, instruction-tuned)
Authentication: API Key stored in n8n credentials
Endpoint: https://openrouter.ai/api/v1/chat/completions

**Hasura GraphQL Integration**

Authentication: JWT token validation
Queries: Chat ownership verification, message history retrieval
Mutations: Save AI responses, update chat records
Real-time: GraphQL subscriptions for live updates

**Workflow Security Features**

JWT Validation: Every request validates user authentication
Ownership Verification: Database checks ensure users can only access their chats
API Key Security: OpenRouter credentials securely stored in n8n
Input Sanitization: All user inputs validated and sanitized
Error Handling: Comprehensive error handling at each step

**💻Frontend Implementation**
**Project Structure**
CHATBOT APP/
├── node_modules/
├── src/
│   ├── components/
│   │   ├── AuthForm.jsx
│   │   ├── AuthGuard.jsx
│   │   ├── ChatApp.jsx
│   │   ├── ChatList.jsx
│   │   └── ChatWindow.jsx
│   ├── lib/
│   │   ├── apollo.js
│   │   └── nhost.js
│   ├── App.css
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package-lock.json
├── package.json
└── vite.config.js

🔒 Security
**Authentication Flow**

1.User signs in with email/password
2.Nhost generates JWT token
3.Token included in all GraphQL requests
4.Hasura validates token and extracts user ID
5.RLS policies enforce data isolation

**Data Protection**

1.Encryption: All data encrypted in transit and at rest
2.Input Validation: Server-side validation for all inputs
3.XSS Protection: React's built-in XSS protection
4.CSRF Protection: JWT tokens prevent CSRF attacks

**API Security**

Rate Limiting: Implemented at Hasura level
CORS: Configured for production domain only
Environment Variables: Sensitive data in environment variables

Backend Configuration

Nhost: Production environment configured
Hasura: Environment variables set
n8n: Webhook URLs updated for production

📊 Performance Optimizations
Frontend

Code splitting with React.lazy()
Memoization with React.memo()
GraphQL query optimization
Image lazy loading

Backend

Database indexing on foreign keys
GraphQL query complexity analysis
Subscription batching
Connection pooling

🧪 Testing
Test Coverage

Unit tests for components
Integration tests for GraphQL operations
E2E tests for user flows
n8n workflow testing

Test Commands
bashnpm test                    # Run unit tests
npm run test:integration   # Run integration tests
npm run test:e2e          # Run E2E tests
📈 Monitoring & Analytics
Error Tracking

Frontend error boundaries
Hasura error logs
n8n execution logs
Real-time error alerts

Performance Monitoring

Core Web Vitals tracking
GraphQL query performance
Database query optimization
User engagement metrics

🔧 Troubleshooting
Common Issues
Authentication Problems
bash# Clear browser storage
localStorage.clear();
sessionStorage.clear();

# Check JWT token validity
jwt.io
GraphQL Errors
bash# Enable debug mode
HASURA_GRAPHQL_DEV_MODE=true

# Check permissions
Hasura Console → Data → Permissions
n8n Workflow Issues
bash# Check webhook URL
curl -X POST your_webhook_url

# Verify API keys
OpenRouter Dashboard → API Keys
👥 Contributing
Development Workflow

**Fork the repository**
**Create feature branch**
**Make changes with tests**
**Submit pull request**
**Code review process**

🙏 Acknowledgments

1.**Nhost for authentication and backend services**
2.**Hasura for GraphQL engine**
3.**OpenRouter for AI API access**
4.**n8n for workflow automation**
5.**Netlify for hosting platform**
