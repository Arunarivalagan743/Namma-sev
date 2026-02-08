# NamSev Security Operations Guide

**Version:** 1.0.0  
**Last Updated:** February 8, 2026  
**Classification:** INTERNAL USE ONLY

---

## Overview

This document covers security operations for the NamSev platform, including credential management, access control, and incident response procedures.

---

## 1. Credential Management

### 1.1 Admin Credentials

**Primary Admin Account:**
- Email: Configured via `ADMIN_EMAIL` environment variable
- Default: `panchayat.office@gmail.com`
- Role: Full administrative access
- Authentication: Firebase Email/Password

**Security Requirements:**
- ✅ Password minimum 16 characters
- ✅ Mixed case, numbers, symbols
- ✅ Not stored in code or Git
- ✅ Rotated every 30 days
- ✅ Unique per environment

### 1.2 Test Accounts

Test accounts are created for automated testing and development:

| Role | Email Pattern | Purpose |
|------|---------------|---------|
| Admin | `test_admin@namsev.test` | Admin function testing |
| Citizen | `test_citizen@namsev.test` | Citizen workflow testing |

**Test Account Rules:**
- Marked with `test_` prefix
- Never used in production
- Automatically expire after 30 days
- Credentials stored in gitignored file

---

## 2. Credential Reset Procedures

### 2.1 Development Environment Reset

```bash
cd backend

# Dry run (safe, no changes)
node scripts/reset-test-credentials.js --env=development --dry-run

# Actual reset (requires confirmation)
node scripts/reset-test-credentials.js --env=development --confirm
```

**Output:**
- New credentials: `docs/TEST_CREDENTIALS.md`
- Audit log: `logs/security_audit.log`

### 2.2 Staging Environment Reset

```bash
node scripts/reset-test-credentials.js --env=staging --confirm
```

### 2.3 Production Environment Reset

⚠️ **DANGEROUS OPERATION** - Requires multiple safeguards:

```bash
# Requires both --force and --confirm flags
node scripts/reset-test-credentials.js --env=production --force --confirm
```

**Pre-Reset Checklist:**
- [ ] Backup current credentials
- [ ] Notify all administrators
- [ ] Schedule during maintenance window
- [ ] Have rollback plan ready
- [ ] Monitor audit logs

---

## 3. Password Policy

### 3.1 Automated Generation

The reset script generates passwords with:
- **Length:** 20 characters
- **Complexity:**
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Symbols (!@#$%^&*()_+-=[]{}|;:,.<>?)
- **Randomness:** Cryptographically secure (crypto.randomInt)

### 3.2 Manual Password Requirements

If creating passwords manually:
- Minimum 16 characters
- Must include: uppercase, lowercase, number, symbol
- No dictionary words
- No personal information
- Unique per account

### 3.3 Rotation Policy

| Environment | Rotation Frequency | Responsibility |
|-------------|-------------------|----------------|
| Development | 30 days | Development team |
| Staging | 30 days | DevOps team |
| Production | 30 days | Security team |

---

## 4. Access Control

### 4.1 Role-Based Access Control (RBAC)

| Role | Permissions | Access Level |
|------|-------------|--------------|
| **Super Admin** | Platform-wide administration | System |
| **Admin** | Panchayat management | Tenant |
| **Citizen** | Submit complaints, view own data | User |

### 4.2 User Approval Workflow

1. User registers via Firebase
2. Account created in "pending" state
3. Admin reviews registration
4. Admin approves or rejects
5. User gains access (if approved)

**Security Note:** Only approved users can access protected features.

---

## 5. Audit Logging

### 5.1 Log Location

All security operations are logged to:
```
/backend/logs/security_audit.log
```

### 5.2 Log Format

```json
{
  "timestamp": "2026-02-08T10:30:00.000Z",
  "action": "CREDENTIAL_RESET",
  "actor": "admin_username",
  "environment": "development",
  "details": {
    "adminEmail": "admin@example.com",
    "passwordHash": "a1b2c3d4...",
    "testAccountCount": 2
  }
}
```

**Important:** Raw passwords are NEVER logged.

### 5.3 Monitored Actions

- Credential resets
- Password changes
- Role assignments
- Access grants/revocations
- Failed authentication attempts
- Suspicious activity

---

## 6. Emergency Procedures

### 6.1 Compromised Credentials

**Immediate Actions:**
1. Reset affected credentials immediately
2. Revoke all active sessions
3. Audit access logs for unauthorized access
4. Notify security team
5. Document incident

**Command:**
```bash
node scripts/reset-test-credentials.js --env=<environment> --confirm
```

### 6.2 Unauthorized Access Detected

1. **Isolate:** Disable compromised account
2. **Investigate:** Review audit logs
3. **Reset:** Change all related credentials
4. **Monitor:** Watch for further attempts
5. **Report:** Document incident

### 6.3 Lost Admin Access

**Recovery Steps:**

1. Access Firebase Console directly
2. Reset password via Firebase
3. Update local credentials file
4. Log the recovery in audit log
5. Review access controls

**Firebase Console:**
```
https://console.firebase.google.com
→ Authentication
→ Users
→ Find admin email
→ Reset password
```

---

## 7. Testing & Validation

### 7.1 Post-Reset Testing

After credential reset:

```bash
# 1. Verify credentials file exists
ls -la docs/TEST_CREDENTIALS.md

# 2. Check audit log
tail -f logs/security_audit.log

# 3. Test admin login
# - Navigate to frontend
# - Login with new admin credentials
# - Verify dashboard access

# 4. Test RBAC
# - Verify citizen cannot access admin features
# - Verify admin can access all features
```

### 7.2 Security Validation

```bash
# Verify .gitignore excludes credentials
git status | grep TEST_CREDENTIALS.md
# Should return nothing

# Verify file permissions
ls -la docs/TEST_CREDENTIALS.md
# Should show: -rw------- (600)
```

---

## 8. Incident Response

### 8.1 Security Incident Types

| Type | Severity | Response Time |
|------|----------|---------------|
| Credential leak | CRITICAL | Immediate |
| Unauthorized access | HIGH | < 1 hour |
| Suspicious activity | MEDIUM | < 4 hours |
| Policy violation | LOW | < 24 hours |

### 8.2 Incident Response Workflow

```
Detection
    ↓
Containment (reset credentials, revoke access)
    ↓
Investigation (audit logs, identify scope)
    ↓
Remediation (fix vulnerabilities)
    ↓
Recovery (restore normal operations)
    ↓
Post-Incident Review (document lessons)
```

### 8.3 Incident Reporting

**Required Information:**
- Date/time of detection
- Type of incident
- Affected accounts/systems
- Actions taken
- Resolution status
- Lessons learned

**Report To:**
- Security team
- System administrator
- Project manager

---

## 9. Backup & Recovery

### 9.1 Credential Backup

**DO NOT** backup raw credentials. Instead:

1. Keep secure offline copy of Firebase service account
2. Document recovery procedures
3. Maintain audit trail
4. Use password manager for team access

### 9.2 Recovery Procedures

**Lost Credentials File:**
```bash
# Regenerate from scratch
node scripts/reset-test-credentials.js --env=development --confirm
```

**Lost Audit Log:**
- Audit logs are append-only
- Archive monthly
- Store securely offline
- Cannot be regenerated

---

## 10. Compliance & Best Practices

### 10.1 Security Checklist

Daily:
- [ ] Review audit logs for anomalies
- [ ] Verify no unauthorized access attempts

Weekly:
- [ ] Check credential expiry dates
- [ ] Review active user list
- [ ] Verify RBAC assignments

Monthly:
- [ ] Rotate credentials
- [ ] Security audit
- [ ] Update documentation
- [ ] Archive logs

### 10.2 Best Practices

✅ **DO:**
- Use strong, unique passwords
- Enable 2FA where possible
- Follow principle of least privilege
- Document all security operations
- Regular security training

❌ **DON'T:**
- Share credentials
- Store passwords in code
- Commit secrets to Git
- Use same password across environments
- Bypass security procedures

---

## 11. Contact & Escalation

### 11.1 Security Team

| Role | Contact | Responsibility |
|------|---------|----------------|
| Security Lead | security@namsev.dev | Overall security |
| DevOps Lead | devops@namsev.dev | Infrastructure |
| Development Lead | dev@namsev.dev | Application security |

### 11.2 Escalation Path

```
Level 1: Development Team
    ↓ (if unresolved in 1 hour)
Level 2: DevOps Team
    ↓ (if unresolved in 4 hours)
Level 3: Security Team
    ↓ (if critical)
Level 4: Management
```

---

## 12. References

- [Security Documentation](./SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Operations Guide](./OPERATIONS.md)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules)

---

**Document Control:**
- Version: 1.0.0
- Last Review: February 8, 2026
- Next Review: March 8, 2026
- Owner: Security Team

