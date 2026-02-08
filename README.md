# NamSev

**AI-Powered Civic Engagement Platform for Panchayat Governance**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

NamSev (நம்மசேவ - "Our Service") is a comprehensive civic engagement platform designed for rural panchayat governance. It enables citizens to submit complaints, track resolution status, participate in local governance, and stay informed about community activities.

### Key Capabilities

- **Complaint Management** - Submit, track, and resolve citizen complaints
- **AI-Powered Processing** - 17 AI services for intelligent assistance
- **Multi-language Support** - Tamil, Hindi, English, Telugu, Kannada, Malayalam
- **Real-time Tracking** - Unique tracking IDs for transparency
- **Admin Dashboard** - Complete management interface
- **Community Engagement** - Meetings, polls, schemes, events

---

## Features

### For Citizens
- User registration with Aadhaar verification
- Complaint submission across 10 categories
- AI-assisted context enrichment
- Duplicate detection before submission
- Real-time status tracking
- Automated complaint summaries
- Community participation (polls, suggestions)

### For Administrators
- User approval workflow
- Complaint management with AI suggestions
- Priority scoring and classification
- Analytics and trend detection
- AI quality monitoring dashboard
- Announcement management

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | Firebase Auth |
| AI/ML | TF-IDF, Rule-based engines |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Namma-sev

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Configuration

**Backend** (`/backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/namsev_db
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email
ADMIN_EMAIL=admin@yourpanchayat.gov.in
```

**Frontend** (`/frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_ADMIN_EMAIL=admin@yourpanchayat.gov.in
```

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│    MongoDB      │
│   (React/Vite)  │     │   (Express.js)  │     │    (Atlas)      │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    Firebase     │     │   AI Services   │
│ (Authentication)│     │  (17 modules)   │
└─────────────────┘     └─────────────────┘
```

### Project Structure

```
/
├── backend/
│   └── src/
│       ├── ai/           # AI services
│       ├── controllers/  # Request handlers
│       ├── models/       # Database schemas
│       ├── routes/       # API routes
│       └── utils/        # Utilities
├── frontend/
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Page components
│       └── services/     # API services
└── docs/                 # Documentation
```

---

## AI Services

NamSev includes 17 AI services:

| Category | Services |
|----------|----------|
| Core | Priority scoring, Classification, Duplicate detection |
| Productivity | Semantic search, Templates, Trends |
| Engineering | Job queue, Batch processing, Metrics |
| Advanced | Enrichment, Semantic duplicates, Summarization |
| Validation | Evaluation, Feedback, Drift detection |

See [AI Systems Documentation](docs/AI_SYSTEMS.md) for details.

---

## API Reference

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/complaints` | Submit complaint |
| GET | `/api/complaints/my-complaints` | Get user complaints |
| GET | `/api/admin/dashboard` | Admin dashboard |
| GET | `/api/health` | Health check |

See [API Reference](docs/API_REFERENCE.md) for complete documentation.

---

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables
4. Deploy

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

---

## Security

- Firebase JWT authentication
- Role-based access control
- PII masking in AI processing
- Input sanitization
- Rate limiting

See [Security Documentation](docs/SECURITY.md) for details.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design |
| [API Reference](docs/API_REFERENCE.md) | API documentation |
| [AI Systems](docs/AI_SYSTEMS.md) | AI services guide |
| [Deployment](docs/DEPLOYMENT.md) | Deployment guide |
| [Operations](docs/OPERATIONS.md) | Operations runbook |
| [Security](docs/SECURITY.md) | Security details |
| [Contributing](docs/CONTRIBUTING.md) | Contribution guide |
| [Changelog](docs/CHANGELOG.md) | Version history |

---

## Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Cold Start | <2s | ~1.4s |
| P95 Latency | <150ms | ~95ms |
| Memory | <65MB | ~51MB |
| Cache Hit Rate | >85% | ~90% |

---

## Contributing

See [Contributing Guide](docs/CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built for Tirupur Panchayat civic governance.

---

**NamSev** - நம்மசேவ - *Empowering Citizens, Serving Communities*

