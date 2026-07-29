# DriftLock Frontend - Setup & Development Guide

## Overview

DriftLock Frontend is a Next.js 14 application that provides a comprehensive web interface for managing web scraper selectors and monitoring their health in real-time.

### Tech Stack

- **Framework**: Next.js 14.2.35 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Real-time)
- **State Management**: React Hooks (useState, useEffect, useRef)
- **HTTP Client**: Fetch API

## Quick Start

### Prerequisites

- Node.js 18+ (tested with v24.13.1)
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd DriftLock_Frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Update .env.local with your configuration
# See Environment Variables section below
```

### Development Server

```bash
npm run dev
# Open http://localhost:3000 in your browser
```

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Configuration (optional, defaults to same origin)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Python Backend Configuration
PYTHON_BRIDGE_MODE=http
PYTHON_API_URL=http://localhost:8000

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── sites/             # Site management endpoints
│   │   ├── keys/              # API key endpoints
│   │   ├── billing/           # Billing info endpoints
│   │   └── selectors/         # Selector endpoints
│   ├── dashboard/             # Dashboard page
│   ├── settings/              # Settings page
│   └── layout.tsx             # Root layout
├── components/
│   ├── dashboard/             # Dashboard components
│   │   ├── AlertBanner.tsx
│   │   ├── SelectorStatus.tsx
│   │   └── SiteList.tsx
│   ├── settings/              # Settings components
│   │   ├── SiteManagement.tsx
│   │   ├── APIKeysSection.tsx
│   │   ├── BillingSection.tsx
│   │   └── Modals/           # Modal components
│   ├── layout/
│   │   └── DashboardLayout.tsx
│   └── common/                # Reusable components
│       └── SkeletonLoader.tsx
├── lib/
│   ├── api.ts                 # API client functions
│   ├── errorHandler.ts        # Error handling utilities
│   ├── logger.ts              # Logging utilities
│   ├── supabase.ts            # Supabase client & queries
│   └── python-bridge.ts       # Python backend bridge
└── styles/
    └── globals.css            # Global Tailwind styles
```

## Key Components

### Dashboard Page (`src/app/dashboard/page.tsx`)

Main dashboard displaying monitored sites with real-time updates.

**Features:**
- Real-time site status via Supabase subscriptions
- Manual detection triggering
- Alert notifications for repair status
- Error handling with fallback data
- Loading states with spinners

**API Endpoints:**
- `GET /api/sites` - Fetch all sites
- `POST /api/sites/detect` - Trigger detection
- Real-time: `change_logs` table subscriptions

### Settings Page (`src/app/settings/page.tsx`)

Settings management with three main sections:

#### 1. Site Management (`SiteManagement.tsx`)
- View all monitored sites
- Create new sites (AddSiteModal)
- Edit existing sites (EditSiteModal)
- Delete sites with confirmation (ConfirmDeleteModal)

**API Endpoints:**
- `GET /api/sites` - List sites
- `POST /api/sites` - Create site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

#### 2. API Keys (`APIKeysSection.tsx`)
- View all generated API keys
- Generate new keys (GenerateKeyModal)
- Revoke keys
- Copy keys to clipboard
- View usage statistics

**API Endpoints:**
- `GET /api/keys` - List keys
- `POST /api/keys` - Generate key
- `DELETE /api/keys/:id` - Revoke key
- `GET /api/keys/stats` - Get statistics

#### 3. Billing (`BillingSection.tsx`)
- Display current plan information
- Show usage statistics
- View pricing tiers
- (Upgrade functionality coming in Phase 6)

**API Endpoints:**
- `GET /api/billing/info` - Billing information

## Error Handling

### Error Handler Utility (`src/lib/errorHandler.ts`)

Reusable error parsing and handling:

```typescript
import { parseAPIError, handleAPIError } from '@/lib/errorHandler';

try {
  const data = await fetchAPI('/some/endpoint');
} catch (error) {
  const apiError = parseAPIError(error);
  handleAPIError(error);  // Logs to console
  showUserMessage(apiError.message);  // User-friendly message
}
```

**Error Types:**
- `network` - Connection/network errors
- `validation` - 400 Bad Request
- `unauthorized` - 401 Unauthorized
- `not_found` - 404 Not Found
- `server` - 500+ Server errors
- `unknown` - Unexpected errors

## Loading States

### Skeleton Loader Component (`src/components/common/SkeletonLoader.tsx`)

```typescript
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

// Usage
{loading ? (
  <SkeletonLoader type="table-row" count={3} />
) : (
  // Actual content
)}
```

**Types:**
- `table-row` - Skeleton for table rows
- `card` - Skeleton for cards
- `text` - Skeleton for text blocks
- `button` - Skeleton for buttons
- `title` - Skeleton for titles

## Styling

### Tailwind CSS

All components use Tailwind CSS for styling. Key utilities:

- **Dark Mode**: Automatic dark mode support with `dark:` prefix
- **Responsive**: Mobile-first approach with breakpoints
- **Colors**: Consistent color palette (indigo primary, red/yellow/green status)
- **Spacing**: Consistent spacing using Tailwind scale

### Custom CSS

Global styles in `src/styles/globals.css`:
- Animation keyframes
- Custom utility classes
- Responsive design breakpoints

## API Routes

### Sites

**GET /api/sites**
```
Returns: { sites: Site[] }
Site = { id, name, url, status, lastChecked, selectorId, currentSelector, lastRepaired? }
```

**POST /api/sites**
```
Body: { name: string, url: string }
Returns: Site
```

**PUT /api/sites/:id**
```
Body: { name: string, url: string }
Returns: Site
```

**DELETE /api/sites/:id**
```
Returns: { success: boolean }
```

### API Keys

**GET /api/keys**
```
Returns: { keys: APIKey[] }
APIKey = { id, name, createdAt, lastUsed?, revoked }
```

**POST /api/keys**
```
Body: { name: string }
Returns: { key: string, keyId: string }
```

**DELETE /api/keys/:id**
```
Returns: { success: boolean }
```

**GET /api/keys/stats**
```
Returns: { totalCalls: number, lastKeyUsed?: string }
```

### Billing

**GET /api/billing/info**
```
Returns: {
  sitesMonitored: number,
  apiCallsThisMonth: number,
  currentPlan: 'free' | 'pro' | 'enterprise',
  nextBillingDate?: string
}
```

## Testing

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Linting
npm run lint
```

See `TESTING.md` for comprehensive testing checklist.

### Manual Testing Checklist

1. **Dashboard**
   - [ ] Page loads and displays real sites
   - [ ] Detection can be triggered
   - [ ] Real-time updates work
   - [ ] Error handling works

2. **Settings - Sites**
   - [ ] Can view all sites
   - [ ] Can add new site
   - [ ] Can edit existing site
   - [ ] Can delete site with confirmation
   - [ ] Validation works

3. **Settings - API Keys**
   - [ ] Can view all keys
   - [ ] Can generate new key
   - [ ] Can copy key to clipboard
   - [ ] Can revoke key
   - [ ] Stats display correctly

4. **Settings - Billing**
   - [ ] Plan info displays
   - [ ] Pricing tiers show
   - [ ] Usage stats display

5. **Accessibility**
   - [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Escape)
   - [ ] Screen reader friendly
   - [ ] Color contrast sufficient
   - [ ] Focus indicators visible

6. **Responsive Design**
   - [ ] Mobile (390px): All elements visible
   - [ ] Tablet (768px): Layout adjusts
   - [ ] Desktop (1920px): Full layout
   - [ ] Touch targets 44x44px minimum

## Performance

### Bundle Size

- Dashboard: ~69.2 kB
- Settings: ~6.87 kB
- Shared libraries: ~87.3 kB

### Optimization Tips

- Use `next/dynamic` for code splitting
- Lazy load heavy components
- Optimize images with `next/image`
- Remove unused CSS with Tailwind purge
- Monitor bundle size with `next/bundle-analyzer`

### Running the App

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Analyze bundle
npm run build
# Check .next/static for bundle analysis
```

## Troubleshooting

### API Connection Issues

**Problem**: "Failed to connect to API"

**Solutions:**
1. Verify API server is running on the correct port
2. Check NEXT_PUBLIC_API_BASE_URL in .env.local
3. Ensure CORS is properly configured
4. Check browser console for network errors

### Supabase Connection Issues

**Problem**: "Missing Supabase environment variables"

**Solutions:**
1. Verify NEXT_PUBLIC_SUPABASE_URL is set
2. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is set
3. Check that keys are correct in Supabase dashboard
4. Ensure Supabase project is active

### Dark Mode Not Working

**Problem**: Dark mode not toggling

**Solutions:**
1. Verify dark mode is enabled in tailwind.config.js
2. Check that system preference is being detected
3. Clear browser cache and local storage
4. Check browser console for CSS errors

### Forms Not Submitting

**Problem**: Form submission hangs or fails

**Solutions:**
1. Check API endpoint exists and returns correct format
2. Verify form validation logic
3. Check network tab for failed requests
4. Verify error messages display properly

## Development Tips

### Adding a New Component

1. Create component file in appropriate directory
2. Define TypeScript props interface
3. Add proper error handling
4. Add loading states with skeleton loaders
5. Add accessibility attributes (aria-labels, etc.)
6. Style with Tailwind CSS
7. Test on multiple breakpoints

### Adding a New API Endpoint

1. Create route file in `src/app/api/[path]/route.ts`
2. Implement GET/POST/PUT/DELETE methods
3. Add request logging
4. Add error handling with proper status codes
5. Test with curl or Postman
6. Add TypeScript types

### Common Patterns

**Form Submission:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed');
    onSuccess();
  } catch (err) {
    const apiError = parseAPIError(err);
    setError(apiError.message);
  } finally {
    setLoading(false);
  }
};
```

**Data Fetching:**
```typescript
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    setLoading(true);
    const data = await fetch('/api/endpoint');
    setData(data);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

## Contributing

1. Create feature branch: `git checkout -b feat/feature-name`
2. Make changes following conventions
3. Test thoroughly on multiple browsers/devices
4. Commit with descriptive message
5. Open pull request with testing checklist

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)

## License

See LICENSE file in repository root.
