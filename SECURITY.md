# Security Guide - Admin Dashboard

## 🔒 Security Improvements Implemented

### ✅ Fixed Critical Issues

1. **Environment Variables** ✓
   - Created `.env.local` for development
   - Created `.env.production` for production
   - API URL now configurable via `NEXT_PUBLIC_API_URL`

2. **Removed Default Password Display** ✓
   - Login page no longer shows default credentials
   - Prevents credential exposure

3. **Secure API Client** ✓
   - Centralized API configuration in `/lib/config.ts`
   - Unified error handling in `/lib/api-client.ts`
   - Automatic 401 redirect to login
   - Token expiration tracking
   - Safe JSON parsing with error handling

4. **Token Management** ✓
   - Added token expiration tracking
   - Auto-redirect on expired tokens
   - Secure token storage helpers

5. **Stronger JWT Secret** ✓
   - Backend now uses cryptographically strong 128-character secret
   - Admin dashboard added to allowed CORS origins

## 🚀 Quick Start - Security Setup

### 1. Configure Environment Variables

**Admin Dashboard** (`/admin-dashboard/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NODE_ENV=development
```

**Backend** (`/backend/.env`):
```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000,http://localhost:5001
JWT_SECRET=4b7c980b7a5b9622fa0202613f818531aadfbda7fc84a70b84e3bd48d6965aaf83a3d6845d5ac32b68c3d683fa8463c25e1cbb3cf174f95d64ece6679101109d
JWT_EXPIRATION=7d
DEFAULT_ADMIN_PASSWORD=admin123456
```

### 2. Production Deployment

**CRITICAL**: Before deploying to production:

1. Generate new JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. Update backend `.env`:
```env
JWT_SECRET=<your-new-secret>
FRONTEND_ORIGIN=https://your-domain.com,https://admin.your-domain.com
```

3. Update admin dashboard `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NODE_ENV=production
```

4. **IMPORTANT**: Change DEFAULT_ADMIN_PASSWORD immediately

5. Enable HTTPS - DO NOT use HTTP in production

## 📋 Remaining Security Tasks

### ⚠️ Still Need Implementation

The following pages still use hardcoded API calls and need to be updated to use the new secure API client:

1. `/app/dashboard/leads/page.tsx` - Update to use `api` client
2. `/app/dashboard/users/page.tsx` - Update to use `api` client
3. `/app/dashboard/testimonials/page.tsx` - Update to use `api` client

**Migration Pattern**:
```typescript
// ❌ Old way (insecure)
const res = await fetch('http://localhost:4000/api/leads', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// ✅ New way (secure)
import { api, API_ENDPOINTS } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/config'

const leads = await api.get(API_ENDPOINTS.LEADS.LIST)
```

### 🔐 Additional Security Recommendations

1. **Content Security Policy (CSP)**
   - Add CSP headers in `next.config.js`

2. **Rate Limiting**
   - Implement on backend for login attempts
   - Protect against brute force

3. **HTTPS Redirect**
   - Force HTTPS in production
   - Use HSTS headers

4. **Session Management**
   - Consider adding token refresh mechanism
   - Implement proper logout on all devices

5. **Input Validation**
   - Add frontend validation
   - Sanitize user inputs

6. **Audit Logging**
   - Log all sensitive operations
   - Track admin actions

## 🛡️ Security Checklist for Production

- [ ] Change JWT_SECRET to production value
- [ ] Change DEFAULT_ADMIN_PASSWORD
- [ ] Set FRONTEND_ORIGIN to production domains
- [ ] Enable HTTPS
- [ ] Update all hardcoded localhost URLs
- [ ] Remove or protect debug logs
- [ ] Enable CORS only for trusted domains
- [ ] Set secure cookie flags (if using cookies)
- [ ] Implement rate limiting
- [ ] Add CSP headers
- [ ] Regular security audits
- [ ] Keep dependencies updated

## 📖 Security Features

### API Client (`/lib/api-client.ts`)

**Features**:
- Automatic token injection
- 401 auto-redirect
- Token expiration checking
- Unified error handling
- Safe JSON parsing

**Usage**:
```typescript
import { api } from '@/lib/api-client'

// GET request
const data = await api.get('/api/endpoint')

// POST request
const result = await api.post('/api/endpoint', { data })

// Requires no auth
const public = await api.post('/api/public', data, { requiresAuth: false })
```

### Token Management

```typescript
import { setAuthToken, getAuthToken, clearAuth, isAuthenticated } from '@/lib/api-client'

// Save token with expiration
setAuthToken(token, '7d')

// Get token (returns null if expired)
const token = getAuthToken()

// Check auth status
if (isAuthenticated()) {
  // User is logged in
}

// Logout
clearAuth()
```

## 🚨 Security Incidents

If you discover a security vulnerability:

1. DO NOT create a public GitHub issue
2. Change affected credentials immediately
3. Review access logs
4. Implement fix
5. Document incident

## 📞 Support

For security questions, contact your security team.

Last Updated: $(date)
