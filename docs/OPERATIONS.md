# NamSev Operations Guide

**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Emergency Contacts & Escalation

| Issue | First Response | Escalation |
|-------|----------------|-----------|
| High error rate | Check alerts endpoint | Check logs, rollback if needed |
| Memory leak | Trigger cleanup | Restart instance |
| Queue overload | Pause batch | Investigate long-running jobs |
| Database slow | Check Atlas status | Upgrade instance |
| Complete outage | Verify Vercel status | Redeploy from Git |

---

## Critical Health Checks (Run Daily)

```bash
# All should return 200 OK with healthy status
curl https://namma-sev.vercel.app/api/health
curl https://namma-sev.vercel.app/api/admin/system/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "uptime": "2d 5h",
  "memory": { "heapUsedMB": 42 },
  "checks": {
    "memory": "pass",
    "latency": "pass",
    "errorRate": "pass",
    "cacheHitRate": "pass"
  }
}
```

---

## Key Metrics to Monitor

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Error Rate | <1% | 1-5% | >5% |
| P95 Latency | <100ms | 100-300ms | >300ms |
| Memory | <40MB | 40-100MB | >100MB |
| Cache Hit Rate | >85% | 70-85% | <70% |
| Queue Depth | <5 jobs | 5-50 jobs | >50 jobs |

---

## Common Operations

### Check System Status
```
GET /api/admin/system/health
```

### View Active Alerts
```
GET /api/admin/system/alerts
```

### Check Queue Status
```
GET /api/admin/system/queues
```

### View Failed Jobs
```
GET /api/admin/system/queues/:name/dead-letter
```

### Retry Failed Job
```
POST /api/admin/system/queues/:name/dead-letter/:jobId/retry
```

### Trigger Daily Batch
```
POST /api/admin/system/batch/daily
```

### Trigger Weekly Batch
```
POST /api/admin/system/batch/weekly
```

### Pause All Batches
```
POST /api/admin/system/batch/pause
```

### Run Cleanup Now
```
POST /api/admin/system/cleanup/run
```

### Check Database Size
```
GET /api/admin/system/cleanup/data-size
```

### Get Translation Bundle (for app developers)
```
GET /api/admin/system/translations/en
```

---

## Incident Response Playbooks

### Scenario 1: Error Rate Spike (>5%)

**Detection:** Alert fires or noticed in `/api/admin/system/alerts`

**Response:**
1. Check recent deployments - was there a recent change?
2. Run: `GET /api/admin/system/alerts` to see error details
3. Review application logs for patterns
4. If recent deployment: Rollback immediately
5. If database issue: Check MongoDB Atlas dashboard
6. If cache issue: Run `POST /api/admin/system/cleanup/run`

**Resolution:**
- If deployment issue: Rollback, fix code, redeploy
- If cache issue: Cleanup will resolve in <5 min
- If database: Contact MongoDB Atlas support

---

### Scenario 2: High Memory Usage (>100MB)

**Detection:** Alert fires or memory constantly growing

**Response:**
1. Run: `GET /api/admin/system/metrics`
2. Note current heap used
3. Run: `POST /api/admin/system/cleanup/run`
4. Wait 30 seconds
5. Run: `GET /api/admin/system/metrics` again
6. If memory < 45MB: Issue resolved
7. If memory still high: Restart instance

**Prevention:**
- Cleanup runs every 6 hours automatically
- Monitor memory weekly

---

### Scenario 3: Queue Not Processing (Dead-Letter Growing)

**Detection:** Dead-letter queue size >10 jobs

**Response:**
1. Run: `GET /api/admin/system/queues/complaints/dead-letter`
2. Review error messages in dead-letter jobs
3. Fix underlying issue (check application logs)
4. Run: `POST /api/admin/system/queues/complaints/dead-letter/:jobId/retry`
5. Monitor that jobs process successfully
6. If still failing: Escalate with error details

**Common Causes:**
- Database connection issue
- Missing AI service
- Invalid data format

---

### Scenario 4: Batch Job Stuck (Not Completing)

**Detection:** Daily batch not finishing in 1 hour

**Response:**
1. Run: `GET /api/admin/system/batch`
2. Check `queues.daily.running` - should be 0-1
3. Check `queues.daily.pending` - high number indicates backlog
4. Run: `POST /api/admin/system/batch/pause`
5. Check which specific job is stuck: `GET /api/admin/system/queues/daily-batch`
6. Review application logs for stuck job details
7. Run: `POST /api/admin/system/batch/resume`

**Prevention:**
- Monitor batch completion via `/api/admin/system/batch`
- Set alert if daily batch not complete by 03:00

---

### Scenario 5: Application Won't Start (Cold Start Fails)

**Detection:** App not responding after deployment

**Response:**
1. Check Vercel deployment status
2. Wait 30 seconds for cold start to complete
3. Verify: `GET /api/health` (should return 200)
4. If still failing after 2 minutes: Check logs
5. Review Phase 3 module load errors:
   - Queue system
   - Batch system
   - Warmup system
   - Cleanup system
6. If module missing: Ensure all files deployed
7. If module error: Rollback deployment

---

## Daily Operations Checklist

```
□ 08:00 - Check /api/admin/system/health
□ 12:00 - Review /api/admin/system/alerts
□ 16:00 - Check /api/admin/system/metrics
□ 20:00 - Verify daily batch completed
□ 23:00 - Final health check before sleep
```

---

## Weekly Operations Checklist

```
□ Monday - Review weekly batch completion
□ Tuesday - Run /api/admin/system/cleanup/data-size
□ Wednesday - Check classification accuracy stats
□ Thursday - Review dead-letter queues
□ Friday - Capacity planning check (memory/storage)
□ Saturday - Backup verification
□ Sunday - Plan week ahead (monitor for maintenance)
```

---

## Important Endpoints Reference

### Admin System Endpoints
```
Health Check:
  GET /api/admin/system/health          (quick status)
  GET /api/admin/system/metrics         (detailed metrics)
  GET /api/admin/system/alerts          (active alerts)

Queue Management:
  GET /api/admin/system/queues          (all queues status)
  GET /api/admin/system/queues/:name/dead-letter   (failed jobs)
  POST /api/admin/system/queues/:name/dead-letter/:jobId/retry

Batch Processing:
  GET /api/admin/system/batch           (batch status)
  POST /api/admin/system/batch/daily    (trigger daily)
  POST /api/admin/system/batch/weekly   (trigger weekly)
  POST /api/admin/system/batch/pause    (pause all)
  POST /api/admin/system/batch/resume   (resume all)

Cleanup & Data:
  GET /api/admin/system/cleanup         (cleanup stats)
  POST /api/admin/system/cleanup/run    (force cleanup)
  GET /api/admin/system/cleanup/data-size (db sizes)

System Info:
  GET /api/admin/system/versions        (version info)
  GET /api/admin/system/warmup          (startup status)
  GET /api/admin/system/translations/:lang (UI strings)
```

---

## Performance Benchmarks

| Operation | Typical Time | Max Time |
|-----------|--------------|----------|
| Cold Start | 1.2s | 1.5s |
| Health Check | <10ms | 50ms |
| Metrics Report | <50ms | 100ms |
| Queue Status | <10ms | 50ms |
| Cleanup Full | 30-60s | 120s |
| Daily Batch | 2-5min | 10min |
| Weekly Batch | 5-15min | 30min |

---

## Alert Thresholds (Current)

| Alert | Threshold | Action |
|-------|-----------|--------|
| High Error Rate | >5% | Investigate deployment |
| High Latency | P95 >300ms | Check database |
| High Memory | >100MB | Run cleanup |
| Low Cache Hit | <70% | Investigate queries |
| Queue Overload | >50 jobs | Check batch processing |

---

## Database Cleanup Schedule

| Action | Frequency | Time | Duration |
|--------|-----------|------|----------|
| Cleanup expired cache | Every 6h | Auto | <1 min |
| Archive old complaints | Daily | 02:00 | <5 min |
| Full batch jobs | Daily | 02:00 | 5-10 min |
| Weekly deep clean | Sunday | 02:00 | 10-30 min |

---

## Contact Information

| Role | Contact | On-Call? |
|------|---------|----------|
| DevOps Lead | Deploy & monitor | Yes |
| Backend Lead | Code issues | Yes |
| Product | Feature requests | No |

---

## Emergency Procedures

### Application Down
1. Verify Vercel status (https://www.vercel.com/status)
2. Check MongoDB Atlas status
3. If Vercel ok: Redeploy from Git
4. Wait 2-3 minutes for cold start
5. Verify `/api/health` returns 200

### Database Down
1. Check MongoDB Atlas dashboard
2. If regional issue: Wait for recovery
3. If complete failure: Restore from backup
4. Estimated downtime: 15-60 minutes

### Complete Data Loss (DO NOT RUN WITHOUT APPROVAL)
1. Restore MongoDB from 7-day automated backup
2. Redeploy application
3. Run full system check
4. Notify team of data loss window

---

## Quick Commands Reference

### Check Everything
```bash
curl https://namma-sev.vercel.app/api/admin/system/health
```

### See What's Failing
```bash
curl https://namma-sev.vercel.app/api/admin/system/alerts
```

### Emergency Cleanup
```bash
curl -X POST https://namma-sev.vercel.app/api/admin/system/cleanup/run
```

### Pause Everything
```bash
curl -X POST https://namma-sev.vercel.app/api/admin/system/batch/pause
```

### Resume Everything
```bash
curl -X POST https://namma-sev.vercel.app/api/admin/system/batch/resume
```

---

*Quick Reference v3.0.0*  
*Keep this guide handy for daily operations*


