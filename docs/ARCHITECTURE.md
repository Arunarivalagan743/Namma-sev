# NamSev System Architecture

**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## 1. Overview

NamSev is a full-stack civic engagement platform designed for rural panchayat governance. The system enables citizens to report issues, track complaints, and participate in local governance through a web interface.

### 1.1 Design Principles

1. **Local-first Processing** - AI operations run locally to ensure privacy and reduce costs
2. **Graceful Degradation** - Application works without AI services
3. **Two-layer Caching** - L1 (memory) + L2 (MongoDB) for performance
4. **Serverless Compatible** - Designed for Vercel/similar platforms
5. **Security First** - PII masking, input sanitization, rate limiting

---

## 2. System Components

### 2.1 High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│    MongoDB      │
│   (React/Vite)  │     │   (Express.js)  │     │    (Atlas)      │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    Firebase     │     │   AI Services   │
│ (Authentication)│     │  (Local/API)    │
└─────────────────┘     └─────────────────┘
```

### 2.2 Backend Structure

```
/backend/src/
├── ai/                     # AI/ML services
│   ├── cache/              # Two-layer caching
│   ├── workers/            # Background jobs
│   ├── classifier.service.js
│   ├── duplicate.service.js
│   ├── enrichment.service.js
│   ├── priority.service.js
│   └── ...
├── config/                 # Configuration
│   ├── database.js
│   └── firebase.js
├── controllers/            # Request handlers
├── middleware/             # Auth, security
├── models/                 # Mongoose schemas
├── routes/                 # API routes
├── utils/                  # Shared utilities
└── server.js               # Entry point
```

### 2.3 Frontend Structure

```
/frontend/src/
├── components/             # Reusable UI
├── config/                 # Firebase config
├── context/                # React contexts
├── hooks/                  # Custom hooks
├── layouts/                # Page layouts
├── pages/                  # Page components
├── services/               # API services
├── App.jsx                 # Main app
└── main.jsx                # Entry point
```

---

## 3. Data Models

### 3.1 Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| User | User accounts | firebaseUID, role, isApproved |
| Complaint | Citizen complaints | trackingId, category, status |
| Announcement | Public notices | title, priority, expiresAt |
| ComplaintHistory | Status changes | complaintId, previousStatus |

### 3.2 Engagement Models

| Model | Purpose |
|-------|---------|
| GramSabhaMeeting | Village meetings |
| Poll | Community voting |
| GovernmentScheme | Scheme information |
| CommunityEvent | Local events |
| PanchayatWork | Public works |
| PublicSuggestion | Citizen suggestions |
| Budget | Budget information |
| FAQ | Frequently asked questions |
| EmergencyAlert | Emergency notices |

### 3.3 Multi-tenant Models

| Model | Purpose |
|-------|---------|
| Tenant | Panchayat tenants |
| TenantConfig | Tenant settings |
| SuperAdmin | Platform administrators |
| TenantAuditLog | Audit trail |
| TenantBilling | Billing records |

---

## 4. AI Services Architecture

### 4.1 Service Pipeline

```
Input → Sanitize → Preprocess → Cache Check → Inference → Cache Store → Response
```

### 4.2 Phase 1: Core Services

| Service | Purpose | Algorithm |
|---------|---------|-----------|
| Priority Scoring | Urgency detection | Rule-based keywords |
| Classification | Category suggestion | Keyword matching |
| Duplicate Detection | Find similar complaints | TF-IDF + Jaccard |
| Translation Cache | Multi-language support | Two-layer cache |

### 4.3 Phase 2: Productivity Services

| Service | Purpose |
|---------|---------|
| Semantic Search | TF-IDF search |
| Response Templates | Admin suggestions |
| Trend Detection | Z-score anomalies |
| User Verification | Fuzzy matching |

### 4.4 Phase 3: Engineering Systems

| System | Purpose |
|--------|---------|
| Job Queue | Async processing |
| Batch Processing | Scheduled jobs |
| Cleanup | Data lifecycle |
| Metrics | Monitoring |
| Warmup | Cold-start optimization |

### 4.5 Phase 4: Advanced AI

| Service | Purpose |
|---------|---------|
| Context Enrichment | Improve complaint quality |
| Semantic Duplicates | Vector similarity |
| Summarization | Auto-generate summaries |

### 4.6 Phase 5: Validation

| System | Purpose |
|--------|---------|
| Evaluation | Track accuracy |
| Feedback | User ratings |
| Drift Detection | Model monitoring |
| Demo Mode | Testing tools |

---

## 5. Security Architecture

### 5.1 Authentication Flow

1. User authenticates via Firebase
2. Firebase issues JWT token
3. Backend verifies token via Firebase Admin SDK
4. User role checked against MongoDB

### 5.2 Authorization Levels

| Role | Capabilities |
|------|--------------|
| Citizen | Submit/view own complaints |
| Admin | Manage all complaints, users |
| Super Admin | Multi-tenant management |

### 5.3 Security Controls

- **Input Sanitization** - Max 5000 chars, HTML/JS stripped
- **PII Masking** - Aadhaar, phone numbers masked
- **Rate Limiting** - 30 AI requests/min/user
- **Prompt Injection** - Pattern detection

---

## 6. Caching Strategy

### 6.1 Two-Layer Cache

```
Request → L1 (LRU Memory) → L2 (MongoDB) → Compute → Store
              5min TTL          30-day TTL
```

### 6.2 Cache Hit Rates

- L1: ~95% for hot data
- L2: ~80% for warm data
- Combined: ~90%

---

## 7. Performance Targets

| Metric | Target | Typical |
|--------|--------|---------|
| P95 Latency | <120ms | ~95ms |
| Memory | <45MB | ~42MB |
| Cold Start | <1.5s | ~1.2s |
| Cache Hit Rate | >85% | ~90% |

---

## 8. Deployment Architecture

### 8.1 Environments

| Environment | Platform | Purpose |
|-------------|----------|---------|
| Development | Local | Development |
| Production | Vercel | Live system |

### 8.2 Environment Variables

See `.env.example` files in `/backend` and `/frontend`.

---

## 9. References

- [API Reference](./API_REFERENCE.md)
- [AI Systems](./AI_SYSTEMS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Operations Guide](./OPERATIONS.md)

