# AI Agent Context

**Project:** NamSev - Civic Engagement Platform  
**Document Purpose:** Maintain AI system understanding across sessions  
**Last Updated:** 2026-02-08

---

## 1. PROJECT UNDERSTANDING

### 1.1 What NamSev Is
- Civic engagement platform for Tirupur Panchayat (rural local government)
- Enables citizens to report issues, track complaints, view schemes
- Provides admin tools for complaint management, user approval, analytics
- Multi-language support (Tamil, Hindi, English, Telugu, Kannada, Malayalam)

### 1.2 Tech Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + Vite | 18.x |
| Styling | Tailwind CSS | 3.x |
| Auth | Firebase Auth | 11.x |
| Backend | Express.js | 4.18.x |
| Database | MongoDB Atlas | 8.x (Mongoose) |
| Translation | Google Translate API v2 | - |
| Hosting | Vercel | - |

### 1.3 User Roles
- **Citizen:** Register, submit complaints, view schemes, track status
- **Admin:** Approve users, manage complaints, post announcements, analytics

### 1.4 Key Data Models
- `users` - Firebase UID linked, approval workflow
- `complaints` - 10 categories, status lifecycle, multi-image
- `announcements` - Priority-based notifications
- `polls` - Community voting
- `schemes` - Government scheme listings
- `meetings` - Gram Sabha scheduling
- `works` - Panchayat project tracking

---

## 2. ARCHITECTURE DECISIONS

### 2.1 AI Processing Strategy
**Decision:** Local-first processing, API only when necessary

**Rationale:**
- Cost control (Google Translate API charges per character)
- Privacy (citizen data stays local)
- Latency (no network round-trip for inference)
- Reliability (works offline/degraded mode)

### 2.2 Caching Strategy
**Decision:** Two-layer cache (L1: In-memory LRU, L2: MongoDB TTL)

**Rationale:**
- L1 handles hot data (5-minute TTL, ~1000 items)
- L2 provides persistence (30-day TTL)
- Promotes to L1 on L2 hit
- 90%+ cache hit rate expected

### 2.3 AI Service Architecture
```
/backend/src/ai/
├── index.js              # Main exports
├── preprocessor.js       # Text normalization (shared)
├── priority.service.js   # Rule-based priority scoring
├── classifier.service.js # Keyword-based categorization
├── duplicate.service.js  # TF-IDF similarity detection
├── search.service.js     # Semantic search (TF-IDF)
├── templates.service.js  # Response templates
├── trends.service.js     # Trend detection (Z-score)
├── verification.service.js # User verification
├── translation.cache.js  # Translation caching layer
├── cache/
│   ├── index.js          # Unified cache interface
│   ├── lru.cache.js      # In-memory LRU cache
│   └── mongo.cache.js    # MongoDB persistent cache
└── workers/
    ├── queue.js          # Async job queue
    ├── batch.js          # Batch processing
    ├── metrics.js        # System metrics
    ├── warmup.js         # Cold-start optimization
    ├── cleanup.js        # Data lifecycle
    ├── versioning.js     # Version tracking
    └── translations.bundle.js # Offline translations
```

### 2.4 Security Decisions
- **PII Masking:** Aadhaar (XXXX-XXXX-XXXX), Phone (+91-XXXXXXXX)
- **Input Sanitization:** Max 5000 chars, strip HTML/JS
- **Rate Limiting:** 30 AI requests/minute per user
- **Prompt Injection:** Pattern detection and blocking

---

## 3. KNOWN RISKS

### 3.1 Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Classification accuracy <80% | MEDIUM | LOW | Fallback to manual, collect corrections |
| Translation cache miss on first use | HIGH | LOW | Pre-warm common phrases |
| Duplicate detection false positives | MEDIUM | MEDIUM | Adjustable threshold, admin override |
| Memory growth from LRU cache | LOW | MEDIUM | Hard cap at 1000 items, LRU eviction |
| MongoDB Atlas free tier limits | MEDIUM | HIGH | Monitor usage, upgrade path ready |

### 3.2 Operational Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Admin ignores AI suggestions | MEDIUM | LOW | Optional, not mandatory |
| Users game priority system | LOW | MEDIUM | Keyword detection, admin review |
| Translation API quota exhaustion | LOW | HIGH | Aggressive caching, budget alerts |

---

## 4. IMPLEMENTATION STATUS

### Phase 1 (COMPLETED ✅)
- [x] AI folder structure
- [x] Preprocessor module
- [x] LRU + MongoDB cache layer (two-layer)
- [x] AI firewall middleware
- [x] Translation caching (unified)
- [x] Priority scoring (rule-based)
- [x] Classifier service (keyword-based)
- [x] Duplicate detection (TF-IDF)
- [x] Complaint controller integration
- [x] Admin AI routes
- [x] Metrics endpoint

### Phase 2 (COMPLETED ✅)
- [x] Semantic search (TF-IDF based)
- [x] Admin response templates
- [x] Trend detection engine (Z-score)
- [x] User verification scoring
- [x] Integration tests

### Phase 3 (COMPLETED ✅) - Engineering Maturity
- [x] Async Job Queue + Worker System
- [x] Offline Translation Bundles
- [x] Batch Processing Pipelines
- [x] Centralized Metrics & Alerting
- [x] Cold-Start & Warm-Up Optimization
- [x] Model & Cache Versioning
- [x] Automated Cleanup & Archiving

### Phase 4 (COMPLETED ✅) - Advanced AI Features
- [x] Context Enrichment Service
  - [x] Missing context detection (location, duration, impact, landmark, affected people)
  - [x] Slang/abbreviation normalization (Tamil, Hindi, English)
  - [x] Category-specific context expectations
  - [x] Quality scoring and suggestions
- [x] Enhanced Semantic Duplicate Detection
  - [x] TF-IDF vector caching
  - [x] Confidence bands (exact/high/medium/low)
  - [x] Configurable thresholds
  - [x] Admin override support
- [x] Automated Complaint Summarization
  - [x] Timeline generation
  - [x] Key action extraction
  - [x] Status summary with overdue detection
  - [x] Text summary generation
  - [x] Version-based caching

### Phase 5 (COMPLETED ✅) - Validation & Monitoring
- [x] AI Quality Evaluation System
  - [x] Prediction logging with ground truth
  - [x] Precision, Recall, F1 calculation
  - [x] Confidence calibration (ECE)
  - [x] Error queue for review
- [x] User/Admin Feedback Loop
  - [x] Helpful/Not helpful buttons
  - [x] Admin override logging
  - [x] Reason capture with categories
  - [x] Weekly aggregation
- [x] False Positive/Negative Tracking
  - [x] Error classification
  - [x] Review queues by service
  - [x] Override rate monitoring
- [x] AI Health Dashboard
  - [x] Accuracy trends
  - [x] Drift indicators
  - [x] Error analysis
  - [x] Feedback statistics
  - [x] Health reports
- [x] Demo & Test Mode
  - [x] Synthetic complaint generator
  - [x] Edge case datasets
  - [x] Stress test scenarios
  - [x] Full test suite
- [x] Drift Detection & Retraining Triggers
  - [x] Accuracy drift alerts
  - [x] Override spike detection
  - [x] Confidence drift monitoring
  - [x] Retraining request workflow (human approval)

---

## 5. PERFORMANCE METRICS

### Phase 1 Services
| Feature | Status | Latency | Memory | Notes |
|---------|--------|---------|--------|-------|
| Two-Layer Cache | ✅ Done | L1:<1ms, L2:<10ms | ~10MB | LRU + MongoDB |
| Translation Cache | ✅ Done | <5ms (cached) | ~5MB | Integrated with cache layer |
| Priority Scoring | ✅ Done | <1ms | ~1MB | Rule-based, Tamil/Hindi keywords |
| Classification | ✅ Done | <2ms | ~2MB | Keyword-based, 10 categories |
| Duplicate Detection | ✅ Done | <50ms | ~5MB | TF-IDF + Jaccard |
| AI Firewall | ✅ Done | +2ms | ~1MB | Rate limit + sanitization |

### Phase 2 Services
| Feature | Status | Latency | Memory | Notes |
|---------|--------|---------|--------|-------|
| Semantic Search | ✅ Done | <20ms | ~5MB | TF-IDF, pre-indexed content |
| Response Templates | ✅ Done | <5ms | ~2MB | Category-based suggestions |
| Trend Detection | ✅ Done | <50ms | ~3MB | Z-score anomaly detection |
| User Verification | ✅ Done | <10ms | ~1MB | Rule engine, fuzzy matching |

### Phase 3 Services
| Feature | Status | Latency | Memory | Notes |
|---------|--------|---------|--------|-------|
| Job Queue | ✅ Done | <1ms | ~2MB | In-process, 5 concurrent |
| Batch Processing | ✅ Done | Async | ~1MB | Daily/weekly jobs |
| Metrics System | ✅ Done | <1ms | ~1MB | Rolling windows |
| Warmup System | ✅ Done | 1.2s | - | Cold start optimization |
| Cleanup System | ✅ Done | Async | ~1MB | 6-hour intervals |
| Versioning | ✅ Done | <1ms | ~1MB | Rollback support |
| Translation Bundle | ✅ Done | <1ms | ~2MB | 6 languages, 80+ keys |

### Phase 4 Services
| Feature | Status | Latency | Memory | Notes |
|---------|--------|---------|--------|-------|
| Context Enrichment | ✅ Done | <50ms | ~3MB | Rule-based, category-specific |
| Semantic Duplicates | ✅ Done | <40ms | ~4MB | TF-IDF vectors, confidence bands |
| Summarization | ✅ Done | <60ms | ~2MB | Rule-based, version-cached |

**Total Memory Budget:** ~51MB (under 65MB limit)

---

## 6. API CONTRACTS

### 6.1 Phase 4 User Endpoints
```
# Pre-submission Enrichment
POST /api/complaints/preview/enrich
  Request: { title, description, category }
  Response: { completenessScore, suggestions, missingContext, qualityIssues }

# Pre-submission Duplicate Check  
POST /api/complaints/preview/duplicates
  Request: { title, description, category }
  Response: { hasDuplicates, highestSimilarity, confidenceBand, duplicates }

# Complaint Summary
GET /api/complaints/:id/summary
  Response: { timeline, keyActions, statusSummary, textSummary }
```

### 6.2 Phase 4 Admin Endpoints
```
# Phase 4 Overview
GET /api/admin/ai/phase4/overview

# Context Enrichment
POST /api/admin/ai/enrich
GET /api/admin/ai/enrichment/stats

# Semantic Duplicates
POST /api/admin/ai/semantic-duplicates
GET /api/admin/ai/semantic-duplicates/stats
PUT /api/admin/ai/semantic-duplicates/threshold
POST /api/admin/ai/semantic-duplicates/override

# Summarization
GET /api/admin/ai/summarize/:complaintId
POST /api/admin/ai/summarize/batch
DELETE /api/admin/ai/summarize/:complaintId
GET /api/admin/ai/summarization/stats
```

### 6.3 Phase 3 System Endpoints
```
# Health & Metrics
GET  /api/admin/system/health
GET  /api/admin/system/metrics
GET  /api/admin/system/alerts

# Queue Management
GET  /api/admin/system/queues
GET  /api/admin/system/queues/:name/dead-letter
POST /api/admin/system/queues/:name/dead-letter/:jobId/retry

# Batch Processing
GET  /api/admin/system/batch
POST /api/admin/system/batch/daily
POST /api/admin/system/batch/weekly
POST /api/admin/system/batch/pause
POST /api/admin/system/batch/resume

# Cleanup
GET  /api/admin/system/cleanup
POST /api/admin/system/cleanup/run
GET  /api/admin/system/cleanup/data-size

# Versioning
GET  /api/admin/system/versions
GET  /api/admin/system/versions/manifest

# Warmup
GET  /api/admin/system/warmup
POST /api/admin/system/warmup/run

# Translations
GET  /api/admin/system/translations/stats
GET  /api/admin/system/translations/:lang
```

---

## 7. CONFIGURATION

### 7.1 Environment Variables (Required)
```
GOOGLE_TRANSLATE_API_KEY=xxx
MONGODB_URI=xxx
ADMIN_EMAIL=panchayat.office@gmail.com
```

### 7.2 AI Configuration (Hardcoded Defaults)
```javascript
// Cache settings
LRU_MAX_SIZE = 1000
LRU_TTL_MS = 5 * 60 * 1000  // 5 minutes
MONGO_TTL_DAYS = 30

// Rate limits
MAX_AI_REQUESTS_PER_MINUTE = 30

// Duplicate detection (Phase 1)
SIMILARITY_THRESHOLD = 0.6
RECENT_DAYS = 30
MAX_CANDIDATES = 100

// Semantic duplicate detection (Phase 4)
SEMANTIC_THRESHOLDS = {
  exact: 0.95,
  high: 0.80,
  medium: 0.65,
  low: 0.50
}

// Enrichment (Phase 4)
MIN_DESCRIPTION_LENGTH = 30
MAX_SUGGESTIONS = 5

// Summarization (Phase 4)
MAX_HISTORY_ITEMS = 50
MAX_SUMMARY_LENGTH = 500

// Input limits
MAX_INPUT_LENGTH = 5000
```

---

## 8. ROLLBACK PROCEDURES

### If AI causes issues:
1. Set `aiServices = null` in complaint.controller.js
2. Remove AI admin routes from admin.routes.js
3. Revert translateController.js to simple Map cache
4. AI features will be bypassed, core app unaffected

### Files to revert:
- `/backend/src/controllers/complaint.controller.js`
- `/backend/src/controllers/translateController.js`
- `/backend/src/routes/admin.routes.js`

---

## 9. MONITORING CHECKLIST

Before deployment:
- [ ] Test translation cache with cold start
- [ ] Test duplicate detection with 100+ complaints
- [ ] Verify rate limiting works
- [ ] Check memory usage after 1 hour
- [ ] Verify PII masking in responses

After deployment:
- [ ] Monitor /api/admin/ai/overview daily
- [ ] Check translation API usage in Google Console
- [ ] Review cache hit ratios weekly
- [ ] Analyze classification accuracy monthly

---

## 10. CONTACT & ESCALATION

**Primary:** AI Systems Engineer  
**Fallback:** Full-stack Lead  
**Emergency:** Disable AI via config flag

---

*This document is auto-updated after each AI implementation milestone.*

