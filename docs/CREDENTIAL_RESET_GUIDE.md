# NamSev Credential Reset - Quick Reference

**Last Updated:** February 8, 2026

---

## Quick Commands

### Test Without Changes (Safe)
```bash
cd backend
node scripts/reset-test-credentials.js --env=development --dry-run
```

### Reset Development Credentials
```bash
node scripts/reset-test-credentials.js --env=development --confirm
```

### Reset Staging Credentials
```bash
node scripts/reset-test-credentials.js --env=staging --confirm
```

### Reset Production (REQUIRES CONFIRMATION)
```bash
node scripts/reset-test-credentials.js --env=production --force --confirm
```

---

## Viewing Credentials

```bash
# View test credentials (after reset)
cat docs/TEST_CREDENTIALS.md

# View audit log
tail -f logs/security_audit.log
```

---

## Testing Login

1. Reset credentials:
   ```bash
   node scripts/reset-test-credentials.js --env=development --confirm
   ```

2. View new credentials:
   ```bash
   cat docs/TEST_CREDENTIALS.md
   ```

3. Test login:
   - Go to frontend: http://localhost:5173
   - Use email and password from TEST_CREDENTIALS.md
   - Verify access level matches role

---

## Troubleshooting

### Script fails with "Firebase credentials not found"
**Solution:** Check `.env` file has Firebase configuration

### "Cannot reset production without --force"
**Expected:** Production requires both `--force` and `--confirm` flags

### Credentials file not created
**Check:** Was `--confirm` flag used? (--dry-run doesn't create files)

### Login fails after reset
**Steps:**
1. Verify credentials file: `cat docs/TEST_CREDENTIALS.md`
2. Check Firebase console for user
3. Check audit log for errors
4. Try regenerating: `node scripts/reset-test-credentials.js --env=development --confirm`

---

## Security Checklist

Before resetting:
- [ ] Backup current credentials (if needed)
- [ ] Check environment is correct
- [ ] Use --dry-run first to test
- [ ] Verify .gitignore excludes TEST_CREDENTIALS.md

After resetting:
- [ ] Test login with new credentials
- [ ] Verify RBAC still works
- [ ] Check audit log
- [ ] Confirm file permissions (600)

---

## Emergency Reset

If admin access is lost:

1. Use Firebase Console directly:
   ```
   https://console.firebase.google.com
   → Authentication → Users → Find admin → Reset password
   ```

2. Or regenerate via script:
   ```bash
   node scripts/reset-test-credentials.js --env=development --confirm
   ```

---

## File Locations

| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `scripts/reset-test-credentials.js` | Reset script | ✅ Yes |
| `docs/TEST_CREDENTIALS.md` | Generated credentials | ❌ No (gitignored) |
| `logs/security_audit.log` | Audit trail | ❌ No (gitignored) |
| `docs/SECURITY_OPERATIONS.md` | Full guide | ✅ Yes |

---

## Support

For issues or questions:
- Check: `docs/SECURITY_OPERATIONS.md` (comprehensive guide)
- Check: `node scripts/reset-test-credentials.js --help`
- Contact: Security team

