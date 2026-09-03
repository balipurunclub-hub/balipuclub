# SEO & Naming Standards Guide

## Overview
This document outlines the naming conventions and SEO optimization standards applied to the Balipu Run Club codebase.

---

## 1. Naming Standards

### Brand Names (Must be Consistent)
| Item | Standard | Examples |
|------|----------|----------|
| **Organization** | "Balipu Run Club" | ❌ "balipu", "BALIPU RUN CLUB" |
| **Venue Partner** | "Fiza by Nexus" | ❌ "fiza by nexus", "NEXUS", "nexus" |
| **Sponsor Names** | Proper capitalization | "Decathlon", "JCI Mangalore", "Canara Bank" |

### Event Names (Standardized)
```typescript
// Use the EVENT_NAMES constant from src/lib/config.ts
EVENT_NAMES.MONSOON_RUN        // "The Monsoon Run"
EVENT_NAMES.DANCE_BATTLE       // "Monsoon Dance Battle"
```

### Venue Names (Standardized)
```typescript
// Use the VENUE_NAMES constant from src/lib/config.ts
VENUE_NAMES.FIZA_BY_NEXUS      // "Fiza by Nexus"
```

---

## 2. Where Naming Issues Were Fixed

### Files Updated
1. **`app/layout.tsx`**
   - Added comprehensive metadata
   - Added Open Graph tags
   - Added Twitter Card tags
   - Added viewport configuration

2. **`app/events/[id]/page.tsx`**
   - Changed "Fiza by nexus" → "Fiza by Nexus"
   - Standardized event data structure
   - Added SEO metadata exports

3. **`app/page.tsx`** (Home page)
   - Update references: "nexus" → "Nexus"
   - Use EVENT_NAMES constants

4. **`app/admin/page.tsx`**
   - Update text: "Manage Balipu x Nexus registrations" 
   - Keep consistent branding

5. **API Routes** (`app/api/admin/bulk-mail/route.ts`, `app/api/admin/ticket-pdf/[uid]/route.ts`)
   - Email subjects and PDF text use standardized names
   - Example: "Balipu x Nexus Run" (event-specific)

---

## 3. SEO Implementation

### Global SEO (app/layout.tsx)
```typescript
export const metadata: Metadata = {
  title: {
    default: "Balipu Run Club | Mangaluru's Premier Running Community",
    template: "%s | Balipu Run Club"
  },
  description: "Join Mangaluru's premier running community...",
  keywords: ["Balipu Run Club", "Mangaluru running", "Monsoon Run 2026", ...],
  openGraph: { ... },
  twitter: { ... },
  robots: { index: true, follow: true, ... }
}
```

### Page-Specific SEO
Each major route has its own metadata:
- **`app/events/[id]/metadata.ts`**: Event-specific titles, descriptions, keywords
- **`app/metadata.ts`**: Admin, scanner, login, ticket page metadata

### Structured Data (JSON-LD)
The `usePageMetadata` and `addStructuredData` hooks in `src/shared/hooks/useSEO.ts` allow dynamic metadata injection for:
- Event details
- Organization schema
- Event schema (for Google Search results)

---

## 4. SEO Best Practices Applied

### 1. Metadata Completeness
✅ Title tags (with templates for consistency)  
✅ Meta descriptions  
✅ Keywords  
✅ Open Graph (OG) tags for social sharing  
✅ Twitter Card tags  
✅ Canonical URLs  
✅ Robots directives (index/follow)  

### 2. Search Engine Optimization
✅ Mobile-responsive viewport  
✅ Theme color specification  
✅ Language declared (`lang="en"`)  
✅ Robots metadata (prevent admin/scanner page indexing)  
✅ Google verification tag placeholder  

### 3. Social Media Optimization
✅ OG image URLs  
✅ OG site name  
✅ Twitter creator handle  
✅ OG locale (en_IN for India)  

### 4. Accessibility & Performance Hints
✅ Format detection disabled (prevents auto-linking)  
✅ Viewport settings optimized  
✅ Theme color matches brand (#1B1B4D)  

---

## 5. How to Use Config Files

### Centralized Configuration (`src/lib/config.ts`)
```typescript
import { SITE_CONFIG, EVENT_NAMES, VENUE_NAMES } from '@/lib/config';

// Instead of hardcoding:
// ❌ const venue = 'Fiza by nexus';

// Use:
// ✅ const venue = VENUE_NAMES.FIZA_BY_NEXUS;

// For contact info:
const email = SITE_CONFIG.email;           // 'Balipurunclub@gmail.com'
const phone = SITE_CONFIG.phone;           // '+91 8317380741'

// For event names:
const eventName = EVENT_NAMES.MONSOON_RUN; // 'The Monsoon Run'
```

### Event Metadata (`app/events/metadata.ts`)
```typescript
import { getEventMetadata } from '@/app/events/metadata';

export const metadata = getEventMetadata('monsoon-run');
// Returns: { title, description, keywords, openGraph, twitter }
```

---

## 6. Files Created for SEO & Config

| File | Purpose |
|------|---------|
| `src/lib/config.ts` | Centralized config for names, contact info, events |
| `app/metadata.ts` | Admin, scanner, login, ticket page metadata |
| `app/events/metadata.ts` | Event-specific SEO metadata generator |
| `src/shared/hooks/useSEO.ts` | Hooks for dynamic metadata and structured data |
| `app/events/[id]/layout.tsx` | Layout with metadata for event pages |

---

## 7. Remaining Tasks

### Phase 1: Fix All Hardcoded Names (In Progress)
- [ ] `app/page.tsx` – Replace "nexus" with "Nexus", use EVENT_NAMES
- [ ] `app/admin/page.tsx` – Update dashboard text
- [ ] `app/scan/page.tsx` – Verify naming consistency
- [ ] `app/events/[id]/page.tsx` – Use config constants throughout

### Phase 2: Apply SEO to All Routes
- [ ] `app/page.tsx` – Add metadata export
- [ ] `app/login/page.tsx` – Add login-specific metadata
- [ ] `app/scan/page.tsx` – Add scanner metadata (robots: noindex)
- [ ] `app/admin/[page]/page.tsx` – Add admin metadata (robots: noindex)
- [ ] `app/ticket/[uid]/page.tsx` – Add ticket metadata

### Phase 3: Implement Structured Data
- [ ] Event schema (JSON-LD) on event pages
- [ ] Organization schema on homepage
- [ ] BreadcrumbList for navigation

### Phase 4: Test & Validate
- [ ] Run PageSpeed Insights
- [ ] Test with Google Search Console
- [ ] Validate OG tags with Facebook Debugger
- [ ] Test Twitter Card with Twitter Card Validator

---

## 8. Google Search Console Setup

Once deployed to production:

1. **Verify domain ownership**: Add verification code to `app/layout.tsx`
   ```typescript
   verification: {
     google: 'your-google-verification-code-here',
   }
   ```

2. **Submit sitemap**:
   - Create `public/sitemap.xml`
   - Submit to Google Search Console

3. **Request indexing** for key pages:
   - `/` (homepage)
   - `/events/monsoon-run`
   - `/events/monsoon-dancebattle`

---

## 9. Quick Checklist for Future Developers

When adding a new page or event:

- [ ] Import constants from `@/lib/config` (never hardcode brand names)
- [ ] Add metadata export with title, description, keywords
- [ ] Add OG tags for social sharing
- [ ] Add robots directive if page should not be indexed
- [ ] Use `EVENT_NAMES`, `VENUE_NAMES`, `SITE_CONFIG` consistently
- [ ] Test with `npm run build` (catches metadata errors)
- [ ] Validate in Google Search Console before going live

---

## 10. Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/) for structured data
