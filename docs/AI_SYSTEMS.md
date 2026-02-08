# NamSev AI Systems Documentation

**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Overview

NamSev incorporates 17 AI services across 5 development phases, providing intelligent assistance for complaint processing, user support, and administrative tasks.

### Design Philosophy

1. **Local-first** - AI runs locally, no external API calls for core features
2. **Privacy-preserving** - PII is masked before processing
3. **Cost-efficient** - Caching reduces repeated computation
4. **Graceful degradation** - App works without AI

---

## Phase 1: Core AI Services

### 1.1 Priority Scoring

**File:** `backend/src/ai/priority.service.js`

Detects urgency from complaint text using keyword matching.

**Algorithm:**
- Multi-language keyword dictionaries (Tamil, Hindi, English)
- Keywords categorized by urgency level
- Returns priority score: low, medium, high, critical

**Example:**
```javascript
const result = priorityService.scoreComplaint("Water pipe burst flooding street");
// Returns: { priority: "critical", score: 0.95, factors: ["burst", "flooding"] }
```

### 1.2 Complaint Classification

**File:** `backend/src/ai/classifier.service.js`

Suggests category for complaints based on keywords.

**Categories:**
1. Road & Infrastructure
2. Water Supply
3. Electricity
4. Sanitation
5. Street Lights
6. Drainage
7. Public Health
8. Encroachment
9. Noise Pollution
10. Other

**Example:**
```javascript
const result = classifierService.classify("Street light not working");
// Returns: { category: "Street Lights", confidence: 0.92 }
```

### 1.3 Duplicate Detection

**File:** `backend/src/ai/duplicate.service.js`

Finds similar existing complaints using TF-IDF and Jaccard similarity.

**Algorithm:**
- TF-IDF vectorization
- Cosine similarity for semantic matching
- Jaccard for structural similarity
- Combined score with configurable threshold

### 1.4 Translation Caching

**File:** `backend/src/ai/translation.cache.js`

Two-layer cache for translations.

**Languages Supported:**
- Tamil (ta)
- Hindi (hi)
- English (en)
- Telugu (te)
- Kannada (kn)
- Malayalam (ml)

---

## Phase 2: Productivity Services

### 2.1 Semantic Search

**File:** `backend/src/ai/search.service.js`

TF-IDF based complaint search for admin dashboard.

**Features:**
- Full-text search
- Category filtering
- Status filtering
- Relevance ranking

### 2.2 Response Templates

**File:** `backend/src/ai/templates.service.js`

Suggests response templates for admin replies.

**Categories:** Each complaint category has predefined templates with:
- Acknowledgment messages
- Status update templates
- Resolution messages

### 2.3 Trend Detection

**File:** `backend/src/ai/trends.service.js`

Detects anomalies in complaint patterns using Z-score.

**Metrics:**
- Daily complaint volume
- Category distribution shifts
- Geographic clustering

### 2.4 User Verification

**File:** `backend/src/ai/verification.service.js`

Fuzzy matching for user verification.

**Checks:**
- Name similarity
- Address matching
- Phone number validation

---

## Phase 3: Engineering Systems

### 3.1 Job Queue

**File:** `backend/src/ai/workers/queue.js`

In-process async job queue.

**Features:**
- Priority levels
- Dead-letter queue
- Retry with backoff
- Timeout protection

### 3.2 Batch Processing

**File:** `backend/src/ai/workers/batch.js`

Scheduled batch jobs.

**Jobs:**
- Daily: Cache cleanup, metrics aggregation
- Weekly: Trend analysis, report generation

### 3.3 Metrics & Alerting

**File:** `backend/src/ai/workers/metrics.js`

System health monitoring.

**Metrics:**
- Request latency
- Error rates
- Cache hit rates
- Memory usage

### 3.4 Cold-Start Optimization

**File:** `backend/src/ai/workers/warmup.js`

Primes caches on server start.

### 3.5 Data Cleanup

**File:** `backend/src/ai/workers/cleanup.js`

Automated data lifecycle management.

---

## Phase 4: Advanced AI

### 4.1 Context Enrichment

**File:** `backend/src/ai/enrichment.service.js`

Improves complaint quality before submission.

**Capabilities:**
- Missing context detection (location, duration, impact)
- Language normalization (slang → formal)
- Quality scoring (0-100)
- Category-specific hints

**Example Output:**
```json
{
  "completenessScore": 65,
  "suggestions": [
    {
      "type": "missing_context",
      "field": "landmark",
      "message": "What is the nearest landmark?"
    }
  ],
  "missingContext": ["landmark", "impact"]
}
```

### 4.2 Semantic Duplicate Detection

**File:** `backend/src/ai/semantic-duplicate.service.js`

Enhanced duplicate detection with confidence bands.

**Confidence Bands:**
- Exact: >95% similarity
- High: 80-95%
- Medium: 65-80%
- Low: 50-65%

**Features:**
- Admin override for false positives
- Configurable thresholds
- Vector caching

### 4.3 Automated Summarization

**File:** `backend/src/ai/summarization.service.js`

Generates complaint summaries.

**Output:**
- Timeline of events
- Key actions taken
- Current status summary
- Next steps

---

## Phase 5: Validation & Monitoring

### 5.1 Quality Evaluation

**File:** `backend/src/ai/evaluation.service.js`

Tracks AI prediction accuracy.

**Metrics:**
- Precision, Recall, F1
- Confidence calibration (ECE)
- Override rate
- Error queues

### 5.2 Feedback Collection

**File:** `backend/src/ai/feedback.service.js`

Collects user/admin feedback on AI suggestions.

**Feedback Types:**
- Helpful/Not helpful buttons
- Admin overrides
- Reason capture

### 5.3 AI Health Dashboard

**File:** `backend/src/ai/dashboard.service.js`

Comprehensive AI monitoring dashboard.

**Views:**
- System health overview
- Accuracy trends
- Confidence histograms
- Error analysis
- Drift indicators

### 5.4 Demo & Test Mode

**File:** `backend/src/ai/demo.service.js`

Testing and demonstration tools.

**Features:**
- Synthetic complaint generator
- Edge case datasets
- Stress testing
- Full test suite

### 5.5 Drift Detection

**File:** `backend/src/ai/drift.service.js`

Monitors for model/data drift.

**Detection Types:**
- Accuracy drift
- Override spikes
- Confidence drift
- Distribution shifts

**Alert Workflow:**
1. Detection → Alert created
2. Admin acknowledges
3. Investigation
4. Resolution or retraining

---

## Cache Architecture

### Two-Layer Cache

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────▶│  L1 (LRU)   │────▶│ L2 (Mongo)  │
│             │     │  5min TTL   │     │ 30-day TTL  │
└─────────────┘     └─────────────┘     └─────────────┘
```

**File:** `backend/src/ai/cache/index.js`

**Strategy:**
- L1 miss → Check L2
- L2 hit → Promote to L1
- L2 miss → Compute → Store both

---

## Performance Characteristics

| Service | Latency | Memory |
|---------|---------|--------|
| Priority Scoring | <1ms | Minimal |
| Classification | <2ms | Minimal |
| Duplicate Detection | <50ms | ~5MB |
| Enrichment | <50ms | ~3MB |
| Semantic Duplicates | <40ms | ~3MB |
| Summarization | <60ms | ~3MB |

---

## Configuration

### Environment Variables

```env
# Log level for AI services
LOG_LEVEL=INFO

# Cache settings
CACHE_L1_TTL=300000
CACHE_L2_TTL=2592000000

# AI thresholds
DUPLICATE_THRESHOLD=0.65
PRIORITY_HIGH_THRESHOLD=0.7
```

---

## Error Handling

All AI services follow the pattern:

```javascript
try {
  // AI operation
} catch (error) {
  logger.error('Operation failed', error);
  // Return safe default
  return { success: false, fallback: true };
}
```

**Principle:** AI failures should never break the application.

---

## References

- [Architecture](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Operations Guide](./OPERATIONS.md)

