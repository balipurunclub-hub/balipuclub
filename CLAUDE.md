# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Balipu Run Club** is a Next.js 16.2.9 event management and registration platform for a running community in Mangaluru. It handles event registration, ticket management, QR scanning for check-ins, bulk email dispatch, and an admin dashboard. The app is built with React 19, TypeScript, Tailwind CSS, and Firebase for backend services.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run linter (ESLint)
npm run lint

# Lint and fix issues
npm run lint -- --fix
```

## Technology Stack

- **Framework**: Next.js 16.2.9 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19.2.4 with Tailwind CSS 4
- **Styling**: Tailwind CSS 4 (with @tailwindcss/postcss), clsx, tailwind-merge
- **Forms**: React Hook Form 7.80.0 with Zod 4.4.3 for validation
- **Backend**: Firebase (client) + Firebase Admin SDK (server)
- **Email**: Nodemailer 9.0.1 (Gmail SMTP)
- **QR Codes**: qrcode 1.5.4 (generation), @yudiel/react-qr-scanner 2.6.0 (scanning)
- **Payments**: Razorpay 2.9.6
- **Animations**: Framer Motion 12.42.0
- **Icons**: Lucide React 1.22.0
- **PDF Generation**: PDFKit 0.19.1
- **Email Service**: Resend 6.16.0 (unused but available)
- **CSV Parsing**: PapaParse 5.5.4

## Project Structure

```
app/
├── layout.tsx              # Root layout with Navbar & AuthProvider
├── page.tsx                # Home page (landing, events overview)
├── login/page.tsx          # Firebase Auth login
├── admin/                  # Admin-only pages (AdminRoute wrapper)
│   ├── page.tsx            # Admin dashboard (registrations, stats)
│   ├── bulk-upload/        # Bulk CSV upload & auto-sequencing
│   ├── send-emails/        # Bulk email dispatch interface
│   ├── scanners/           # Scanner remote control panel
│   └── scanner-controls/   # Remote toggle states for scanners
├── scan/page.tsx           # QR scanner for check-ins (ScannerRoute wrapper)
├── ticket/[uid]/page.tsx   # Individual ticket display with QR
├── events/[id]/page.tsx    # Dynamic event details page
└── api/admin/              # Server-side API endpoints
    ├── bulk-upload/        # POST: Bulk registration, auto-BIB sequencing
    ├── bulk-mail/          # POST: Batch email with QR attachments
    ├── scanner-settings/   # GET/POST: Remote access toggles
    └── ticket-pdf/[uid]/   # GET: Generate PDF ticket
components/
├── AuthProvider.tsx        # Firebase Auth context + user/admin detection
├── AdminRoute.tsx          # Protected route wrapper (admin-only redirect)
├── ScannerRoute.tsx        # Protected route wrapper (scanner-only)
├── ProtectedRoute.tsx      # Generic protected route
├── Navbar.tsx              # Navigation bar
├── Footer.tsx              # Footer
├── admin/
│   ├── RegistrationsTable.tsx   # Data table with manual check-in trigger
│   └── ExportCSVButton.tsx      # CSV export utility
lib/
├── firebase.ts             # Client Firebase config + Firestore cache setup
├── firebaseAdmin.ts        # Server Firebase Admin SDK initialization
└── razorpay.ts             # Razorpay configuration
types/
└── index.ts                # Registration, PaymentStatus type definitions
public/
├── IMG_3702.PNG            # Balipu logo
├── poster.png              # Event poster
├── dancePoster.png         # Dance battle poster
└── [other assets]          # Route maps, images for emails
```

## Core Architecture

### Authentication & Authorization

- **Provider**: `components/AuthProvider.tsx` uses Firebase Auth to manage user state
- **User Detection**: Checks custom claim `admin: true` in user token
- **Protected Routes**: `AdminRoute` (admin only), `ScannerRoute` (scanner device only), `ProtectedRoute` (any auth user)
- **Client-Side**: Firestore rules + custom middleware check on admin pages; server-side: Firebase Admin SDK validates requests

### Data Model: Registration

```typescript
interface Registration {
  uid: string;                        // Firestore doc ID
  ticketId: string;                   // Unique: "BRC-MR-XXXX"
  bibNumber: number;                  // Sequence auto-assigned
  name, email, phone: string;
  age: number; gender: 'Male' | 'Female' | 'Prefer not to say';
  city, emergencyContact: string;
  idProofType, idProofNumber: string;
  source: string;                     // 'Bulk Upload' | 'Web Registration' | ...
  jerseySize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;                 // Razorpay order ID
  entryType?: 'paid' | 'free';
  attended?: boolean;                 // Check-in flag
  attendedAt?: Timestamp;             // Server timestamp
  emailSent?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

### Key Flows

**Registration & Payment**:
1. User fills form on `/page.tsx` (entry type auto-set, jersey size for paid only)
2. Razorpay integration collects payment (or free entry direct)
3. Firebase stores registration with `paymentStatus: 'paid'` on success
4. Ticket ID auto-generated (`BRC-MR-{counter}`)

**Bulk Upload** (`/admin/bulk-upload`):
1. Admin uploads CSV with participant data
2. `POST /api/admin/bulk-upload` processes entries
3. BIB numbers auto-sequence from highest in DB
4. Ticket IDs increment from event counter (`eventCounters/monsoon-run`)
5. All entries marked as `paymentStatus: 'paid'` by default

**Email Dispatch** (`/admin/send-emails`):
1. Admin selects recipients and configures email (date, time, location, route image)
2. `POST /api/admin/bulk-mail` generates QR for each ticket
3. Nodemailer sends HTML emails with QR PNG attachment + optional route map
4. Firestore `emailSent` flag updated per user; Gmail SMTP rate limit: 1s delay between emails

**QR Scanning** (`/scan`):
1. Device polls `scanner-settings` remote toggles every 5s
2. Scanner queries Firestore by `ticketId` or falls back to doc UID
3. Validates: `paymentStatus === 'paid'`, `attended !== true`, entry type allowed
4. On confirmation, sets `attended: true` + `attendedAt` timestamp
5. Linked duplicate docs (if any) also marked attended to prevent double-scan

### Firestore Collections

```
registrations/
├── {uid}
│   ├── name, email, phone, ...
│   ├── attended, attendedAt
│   ├── createdAt, updatedAt
│   └── ...
eventCounters/
├── monsoon-run
│   └── count: 1000  // Next ticket counter
scannerSettings/
├── {doc}
│   ├── allowFreeTierScan: boolean
│   └── allowPaidTierScan: boolean
```

## Important Implementation Details

### BIB Sequencing

- **Auto-Increment**: Next BIB = `max(bibNumber) + 1` from DB
- **Bulk Upload**: Starts from `startBibNumber` (or 1), increments per entry
- **Transactional**: Event counter read + update in single transaction to prevent race conditions

### Email Generation

- **HTML Template**: Hardcoded in `api/admin/bulk-mail/route.ts` with responsive CSS
- **Attachments**: QR code PNG + optional route map image
- **Rate Limiting**: 1-second delay between emails to avoid Gmail throttle
- **Free vs Paid**: Free entries use hardcoded date `11th July 2026`, paid use admin-provided date
- **Connection**: Nodemailer pool with max 1 connection, 100 messages per pool

### QR Scanner

- **Camera Access**: Uses `@yudiel/react-qr-scanner` with webcam
- **Offline Fallback**: Manual ticket ID input field
- **Duplicate Prevention**: Checks `linkedDocId` on scanned record + linked record
- **Remote Control**: Separate toggles for free/paid tier scanning (polled from settings)
- **UI State**: Modal dialog on successful scan; prevents navigation away (`beforeunload`, `popstate`)

### PDF Tickets

- **Route**: `GET /api/admin/ticket-pdf/[uid]`
- **Library**: PDFKit (server-side)
- **Generation**: Dynamic PDF with QR, registration details, BIB number

### Email & Auth Environment Variables

**Required in `.env.local` or `.env`**:
```
FIREBASE_PROJECT_ID=balipu
FIREBASE_CLIENT_EMAIL=...@balipu.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=app-password-for-gmail  # NOT your Gmail password; use Gmail App Password
```

### Styling Conventions

- **Colors**: 
  - Primary: `#1B1B4D` (dark navy)
  - Accent: `#F5841F` (orange)
  - Secondary: `#6B2FA0` (purple)
  - Neutral: Slate 50-950
- **Animations**: Framer Motion + Tailwind `animate-fade-in`, `animate-fade-in-up`, `delay-*` classes
- **Shadows**: Heavy use of `shadow-lg`, `shadow-xl`, with colored glows (e.g., `shadow-[#F5841F]/20`)
- **Border Radius**: `rounded-xl`, `rounded-2xl`, `rounded-3xl` (rarely `rounded-lg`)
- **Typography**: `font-heading` for large titles (italic, -skew-x variants), `font-sans` for body

### Next.js Specific

- **Breaking Changes**: This version has breaking changes from Next.js docs training data. Check `node_modules/next/dist/docs/` for current APIs.
- **Server Packages**: Firebase Admin SDK, PDFKit, Nodemailer are in `serverExternalPackages` in `next.config.ts`
- **Auth Rewrites**: Firebase Auth widget proxied to `/__/auth/*` → `https://balipu.firebaseapp.com/__/auth/*`
- **TypeScript Paths**: `@/*` → root (e.g., `@/components`, `@/lib`)

## Testing & Linting

- **Linter**: ESLint 9 with Next.js and TypeScript configs
- **No automated test framework** currently set up; manual testing in dev
- **Type Safety**: Strict mode enabled; use TypeScript for all new code

## Common Patterns

### Protected Admin Pages
```typescript
import { AdminRoute } from '@/components/AdminRoute';

export default function AdminPage() {
  return (
    <AdminRoute>
      <div>Admin content</div>
    </AdminRoute>
  );
}
```

### Firestore Real-Time Queries
```typescript
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

useEffect(() => {
  const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    setRegistrations(data);
  });
  return () => unsubscribe();
}, []);
```

### API Error Handling
```typescript
// app/api/route.ts
return NextResponse.json({ error: 'message' }, { status: 400 });
```

## Deployment

- **Platform**: Vercel (inferred from `create-next-app` template + `allowedDevOrigins` in config)
- **Environment**: Set secrets via Vercel dashboard (Firebase credentials, email config)
- **Build**: `npm run build` → deploys automatically on push to `main`

## Known Quirks & TODOs

- **BIB Sequencing**: Assumes single event (`monsoon-run`). Multi-event support would need per-event counter docs.
- **CSV Parsing**: PapaParse dependency included but not used in current codebase; available for future import
- **QR Format**: Hardcoded format `BRC-MR-{number}`; changing this requires updating scanner, email, and PDF logic.
- **Email Template**: Hardcoded HTML in API route; consider extracting to template file for maintainability.
- **Duplicate Registration**: App logs but doesn't prevent duplicate scanning; handled via `linkedDocId` tracking.
