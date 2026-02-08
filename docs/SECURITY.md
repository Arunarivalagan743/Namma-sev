# NamSev Security Documentation

**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Overview

This document outlines the security measures implemented in NamSev to protect user data and ensure system integrity.

---

## 1. Authentication

### 1.1 Firebase Authentication

- Email/Password authentication via Firebase
- JWT tokens for API requests
- Token verification on every protected request
- Automatic token refresh

### 1.2 Session Management

- Tokens expire after 1 hour
- Refresh handled by Firebase SDK
- Server-side token verification

---

## 2. Authorization

### 2.1 Role-Based Access Control

| Role | Description | Capabilities |
|------|-------------|--------------|
| Citizen | Registered user | Submit complaints, view own data |
| Admin | Panchayat administrator | Manage complaints, users, announcements |
| Super Admin | Platform administrator | Multi-tenant management |

### 2.2 User Approval Workflow

1. User registers
2. Account created in "pending" state
3. Admin reviews and approves/rejects
4. Only approved users can access protected features

---

## 3. Data Protection

### 3.1 PII Handling

**Personally Identifiable Information (PII) is protected:**

- Aadhaar numbers: Only last 4 digits stored
- Phone numbers: Validated but not displayed publicly
- Addresses: Only used for complaint routing

### 3.2 PII Masking in Logs

AI services automatically mask sensitive data:

```javascript
// Input: "Contact me at 9876543210, Aadhaar 1234-5678-9012"
// Masked: "Contact me at +91-XXXXXXXX, Aadhaar XXXX-XXXX-XXXX"
```

### 3.3 Data Encryption

- Data in transit: HTTPS/TLS
- Data at rest: MongoDB Atlas encryption
- Tokens: Signed JWT with Firebase private key

---

## 4. Input Validation

### 4.1 Request Validation

- Maximum text length: 5000 characters
- HTML/JavaScript stripped from inputs
- SQL injection patterns blocked
- XSS patterns blocked

### 4.2 AI Firewall

The AI firewall (`middleware/ai-firewall.js`) provides:

- Input sanitization
- PII detection and masking
- Prompt injection prevention
- Rate limiting

---

## 5. Rate Limiting

### 5.1 Request Limits

| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 requests/minute |
| AI Endpoints | 30 requests/minute |
| Translation | 50 requests/minute |

### 5.2 Abuse Prevention

- Per-user rate limiting
- IP-based blocking for abuse
- Automatic cooldown periods

---

## 6. API Security

### 6.1 CORS Configuration

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend.vercel.app'
];
```

### 6.2 Headers

- Content-Type validation
- Authorization header required for protected routes
- No sensitive data in URLs

---

## 7. Secrets Management

### 7.1 Environment Variables

All secrets stored as environment variables:

- `MONGODB_URI` - Database connection
- `FIREBASE_*` - Firebase credentials
- `GOOGLE_TRANSLATE_API_KEY` - Translation API

### 7.2 Git Security

`.gitignore` excludes:
- `.env` files
- Service account JSON files
- Private keys

---

## 8. Dependency Security

### 8.1 Package Management

- Lock files committed (`package-lock.json`)
- Regular dependency updates
- No known vulnerabilities in dependencies

### 8.2 Recommended Practices

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix
```

---

## 9. Deployment Security

### 9.1 Vercel Security

- HTTPS enforced
- Environment variables encrypted
- No logs with sensitive data

### 9.2 MongoDB Atlas Security

- IP whitelist configured
- Database users with minimal permissions
- Audit logging enabled

---

## 10. Incident Response

### 10.1 Security Incidents

If a security incident is detected:

1. Isolate affected systems
2. Preserve evidence/logs
3. Assess scope of breach
4. Notify affected users if required
5. Fix vulnerability
6. Post-incident review

### 10.2 Reporting Security Issues

Report security vulnerabilities to: security@yourpanchayat.gov.in

Do NOT create public issues for security vulnerabilities.

---

## 11. Compliance

### 11.1 Data Handling

- Minimal data collection
- Purpose-limited usage
- User consent for data processing
- Data deletion on request

### 11.2 Logging

- No PII in application logs
- Logs retained for 30 days
- Access logs in Vercel

---

## 12. Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] No hardcoded credentials in code
- [ ] .gitignore covers all sensitive files
- [ ] Firebase security rules reviewed
- [ ] MongoDB users have minimal permissions

### Post-Deployment

- [ ] HTTPS working
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Admin account secured
- [ ] Test unauthorized access blocked

### Ongoing

- [ ] Regular dependency updates
- [ ] Monitor for security alerts
- [ ] Review access logs weekly
- [ ] Test backup/recovery annually

---

## 12. Credential Management

### 12.1 Test Credential Reset

NamSev includes a secure credential reset system for testing and maintenance.

**Features:**
- Cryptographically secure password generation (20+ characters)
- Environment-specific protection (dev/staging/production)
- Complete audit logging
- Gitignored credential storage
- Dry-run mode for testing

**Usage:**
```bash
# Test without changes
node scripts/reset-test-credentials.js --env=development --dry-run

# Reset development credentials
node scripts/reset-test-credentials.js --env=development --confirm
```

**Documentation:**
- Full guide: [Security Operations](./SECURITY_OPERATIONS.md)
- Quick reference: [Credential Reset Guide](./CREDENTIAL_RESET_GUIDE.md)
- Security review: [Security Review](./SECURITY_REVIEW_CREDENTIAL_RESET.md)

### 12.2 Password Policy

All generated passwords meet these requirements:
- Minimum 20 characters
- Mixed case letters (A-Z, a-z)
- Numbers (0-9)
- Symbols (!@#$%^&*()_+-=[]{}|;:,.<>?)
- Cryptographically random
- 30-day expiry

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security](https://firebase.google.com/docs/rules)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

