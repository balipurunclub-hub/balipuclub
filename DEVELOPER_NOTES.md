# Developer Notes

## Code Standards & Conventions

This document outlines the coding standards, architectural decisions, and best practices for the Balipu Run Club codebase.

---

## Project Philosophy

**Minimal Comments**: Code should be self-documenting. Comments are reserved for:
- Complex business logic that isn't immediately obvious
- API endpoint documentation
- Performance-critical sections with non-obvious optimizations
- Bug fixes with GitHub issue references

**Industry Standard Structure**: We follow Next.js App Router conventions with feature-based organization.

---

## File Organization

### Current Structure (Simplified)
```
app/                    # Next.js App Router pages
├── admin/             # Admin feature routes
├── api/               # API routes
├── scan/              # Scanner feature
├── events/            # Public event pages
└── ticket/            # Ticket display

components/            # Reusable UI components
├── admin/             # Admin-specific components
└── [shared]           # Shared components (AdminRoute, Navbar, etc.)

lib/                   # Core libraries & configuration
├── firebase.ts        # Client Firebase setup
├── firebaseAdmin.ts   # Server Firebase Admin
└── razorpay.ts        # Payment integration

types/                 # TypeScript type definitions
└── index.ts           # Shared types

src/                   # New organized code (incremental migration)
├── lib/               # Utilities & constants
├── features/          # Feature-based modules
└── shared/            # Shared components & hooks
```

### Migration Strategy

We're incrementally migrating to a more organized structure. New code goes in `src/` with feature-based organization. Existing code remains in place until refactored.

---

## Component Patterns

### Component Structure
```typescript
// 1. Imports (grouped: React, External, Internal, Types)
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Registration } from '@/types';

// 2. Types/Interfaces
interface Props {
  data: Registration[];
  onSelect?: (id: string) => void;
}

// 3. Component
export function ComponentName({ data, onSelect }: Props) {
  // Hooks at the top
  const [state, setState] = useState<string>('');
  
  // Derived state
  const filtered = data.filter(item => item.active);
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Naming Conventions

- **Components**: PascalCase (`AdminRoute`, `RegistrationsTable`)
- **Files**: Match component name (`AdminRoute.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useRegistrations`)
- **Utilities**: camelCase (`formatDate`, `cn`)
- **Constants**: SCREAMING_SNAKE_CASE (`BRAND_COLORS`, `EVENT_CONFIG`)
- **Types**: PascalCase (`Registration`, `PaymentStatus`)

---

## Styling Standards

### Brand Colors
```typescript
// Use semantic color names in code
primary: '#1B1B4D'    // Dark navy - headers, primary text
accent: '#F5841F'     // Orange - CTAs, highlights
secondary: '#6B2FA0'  // Purple - secondary elements
```

### Tailwind Patterns

**Use the `cn` utility for conditional classes:**
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)} />
```

**Common patterns:**
```typescript
// Buttons
'btn-primary' // Orange background, white text
'btn-secondary' // Transparent with border

// Cards
'rounded-2xl bg-[#1B1B4D]/80 border border-white/10 p-6 shadow-lg'

// Input fields
'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white'
```

**Responsive breakpoints:**
- Mobile-first approach
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px

---

## Data Patterns

### Firestore Queries

**Real-time subscriptions:**
```typescript
useEffect(() => {
  const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    setData(data);
  });
  return () => unsubscribe();
}, []);
```

**One-time fetches:**
```typescript
const fetchData = async () => {
  const snapshot = await getDocs(query(collection(db, 'registrations')));
  const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
  return data;
};
```

### Error Handling

```typescript
// API routes
return NextResponse.json({ error: 'Message' }, { status: 400 });

// Client components
try {
  await operation();
} catch (error) {
  console.error('Context:', error);
  alert('User-friendly message');
}
```

---

## Authentication & Authorization

### Route Protection

Three protection levels:

1. **AdminRoute**: Admin-only pages (checks `user.email === adminEmail`)
2. **ScannerRoute**: Scanner device pages (checks Firestore `roles` collection)
3. **ProtectedRoute**: Any authenticated user

```typescript
// Usage
<AdminRoute>
  <AdminPage />
</AdminRoute>
```

### Role Checking

Admin: Environment variable `NEXT_PUBLIC_ADMIN_EMAIL`
Scanner: Firestore document `roles/{email}` with `role: 'scanner'`

---

## API Route Patterns

### Structure
```typescript
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    const adminDb = getAdminDb();
    // Logic
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Similar structure
}
```

### Environment Variables

Required in `.env.local`:
```
FIREBASE_PROJECT_ID=balipu
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
EMAIL_USER=...
EMAIL_PASS=...
NEXT_PUBLIC_ADMIN_EMAIL=...
```

---

## Performance Guidelines

### Firestore Optimization

- Use `persistentLocalCache` for offline support (already configured)
- Create indexes for complex queries (check console warnings)
- Use `limit()` for large collections
- Batch operations when possible

### React Optimization

- Use `useMemo` for expensive computations
- Use `useCallback` for functions passed to children
- Avoid inline object/array creation in render
- Lazy load heavy components

```typescript
// Good
const filteredData = useMemo(() => 
  data.filter(item => item.active),
  [data]
);

// Avoid
<div onClick={() => handleClick(id)}>  // New function every render
```

---

## Testing Strategy

Currently no automated tests. For future implementation:

- **Unit tests**: Jest + React Testing Library for utilities and components
- **Integration tests**: Test API routes with actual Firebase emulators
- **E2E tests**: Playwright for critical user flows

---

## Common Tasks

### Adding a New Admin Page

1. Create route in `app/admin/new-page/page.tsx`
2. Wrap with `<AdminRoute>` component
3. Use Firebase hooks pattern for data fetching
4. Follow existing UI patterns (cards, tables, forms)

### Adding a New API Endpoint

1. Create route handler in `app/api/...`
2. Use Firebase Admin SDK for server operations
3. Return consistent error format
4. Document in API section below

### Adding a New Component

1. Determine scope: feature-specific or shared
2. Place in appropriate folder
3. Use TypeScript interfaces for props
4. Follow component structure pattern
5. Export from index if shared

---

## API Reference

### POST /api/admin/bulk-upload
Bulk upload registrations from CSV.

**Request:**
```json
{
  "entries": [{ "name": "...", "email": "...", ... }],
  "entryType": "paid" | "free",
  "startBibNumber": 1
}
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "inserted": [...],
  "failedCount": 0,
  "failed": []
}
```

### POST /api/admin/bulk-mail
Send bulk emails with QR codes.

**Request:**
```json
{
  "users": [{ "email": "...", "name": "...", "ticketId": "...", ... }],
  "mailDate": "11th July 2026",
  "mailTime": "11 AM to 6 PM",
  "mailLocation": "...",
  "mailMapsLink": "https://...",
  "mailRouteLink": "https://...",
  "mailRouteImage": "map.png"
}
```

### GET /api/admin/scanner-settings
Get remote scanner toggles.

**Response:**
```json
{
  "allowFreeTierScan": true,
  "allowPaidTierScan": true
}
```

### GET /api/admin/ticket-pdf/[uid]
Generate PDF ticket for registration.

---

## Migration Notes

### From Legacy Patterns

**Import paths:**
- Old: `import { X } from '../../components/X'`
- New: `import { X } from '@/components/X'`

**Environment variables:**
- Client: `NEXT_PUBLIC_*`
- Server: No prefix (secured in `.env.local`)

**Firebase Admin:**
- Always use `getAdminDb()` helper
- Handle missing initialization gracefully

---

## Debugging Tips

### Common Issues

1. **Firebase Admin not initialized**
   - Check `.env.local` has all required vars
   - Verify private key format (newlines as `\n`)

2. **Firestore permission denied**
   - Check Firestore security rules
   - Verify user is authenticated

3. **Email not sending**
   - Use Gmail App Password (not regular password)
   - Check EMAIL_USER and EMAIL_PASS env vars

4. **QR Scanner not working**
   - HTTPS required for camera access
   - Check browser permissions

### Useful Commands

```bash
# Clear Next.js cache
rm -rf .next

# Check TypeScript errors
npm run build

# View Firebase logs
firebase functions:log

# Test email locally
# Use the test email button in /admin/bulk-upload
```

---

## Future Improvements

1. **Add unit tests** for utility functions
2. **Extract email templates** to separate files
3. **Add logging service** for better error tracking
4. **Implement rate limiting** on API routes
5. **Add CSRF protection** for form submissions
6. **Migrate to React Query** for data fetching
7. **Add Storybook** for component documentation
8. **Implement CI/CD** checks for code quality

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Project CLAUDE.md](./CLAUDE.md) - Technical architecture details
