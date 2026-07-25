# SmartSpend — Technical Writeup

## Technical Decisions

### Stack Selection

The project was built around a **zero-cost, serverless-first** philosophy. Every technology was chosen to maximise functionality while keeping the bill at ₹0:

- **Next.js 16 + React 19** for the full-stack framework. API routes and the frontend live in the same project, eliminating the need for a separate backend server.
- **Supabase** for PostgreSQL storage and authentication. SQL was preferred over NoSQL because financial data (transactions, budgets) maps naturally to relational tables and enables expressive queries (e.g., "total spending per category this month") without awkward workarounds.
- **Gemini API** (gemini-3.1-flash-lite) for the AI coach. Its generous free tier was the deciding factor — no credit card required for a hackathon project.
- **Tailwind CSS v4 + shadcn/ui (base-nova)** for the UI. shadcn provides accessible, pre-built components that look polished out of the box, which was critical for the 20% UI/UX judging weight.
- **Tremor** for dashboard charts — tightly integrated with Tailwind and purpose-built for financial dashboards.
- **@ducanh2912/next-pwa** for PWA/offline support with minimal configuration overhead.

### Architecture Decisions

**Single-Page App in an MPA Framework:** The entire application lives in one file (`src/app/page.tsx`, ~1785 lines) with tab-based navigation. This was a deliberate hackathon trade-off: it eliminates routing complexity, avoids shared-state prop drilling across pages, and lets us iterate faster on the core feature set.

**Dual Storage Strategy:** Guest users store everything in `localStorage` (no sign-up friction). Cloud-authenticated users sync to Supabase while keeping a local cache. This means the app works fully offline for both modes — critical for the PWA/offline judging criteria.

**AI with Graceful Degradation:** The AI coach talks to Gemini via a Next.js API route. If the API key is missing or the request fails (network error, rate limit), the app falls back to a local JavaScript heuristic that still provides reasonable spending advice. This ensures the AI feature never appears broken to judges.

**Mobile-First Layout:** The UI is constrained to `max-w-md` with a bottom tab bar, mimicking a native finance app. All forms use modal dialogs rather than separate pages, keeping the UX fluid on mobile.

## Challenges Faced

### Bleeding-Edge Versions

The project uses Next.js 16, React 19, and Tailwind CSS v4 — all very recent releases with limited documentation at the time of development. Tailwind v4's new `@import "tailwindcss"` syntax and the removal of `tailwind.config.js` required learning on the fly. shadcn/ui's `base-nova` style uses `@base-ui/react` instead of Radix, which meant the generated components had different APIs than the well-documented Radix versions.

### AI Response Consistency

The Gemini API's free tier can produce inconsistent or overly verbose responses. We addressed this with a strict system prompt that constrains tone, length (150–250 words), and format (bullet points, emoji-friendly). Even so, the local fallback was necessary to guarantee a decent experience during live demos.

### Single-File Scaling

The monolithic `page.tsx` became unwieldy as features grew — state management across tabs, modal open/close coordination, and overlapping `useEffect` dependencies created subtle bugs. We managed this through careful naming conventions and inlined comments, but it was a constant source of friction.

### PWA + Capacitor Integration

Getting `next-pwa` to generate a correct service worker for the static export (`npm run build` → `out/`) required several iterations of the Next.js config. Capacitor's `webDir` had to point to `out/`, and the Android build pipeline needed specific JDK/gradle version alignment to avoid cryptic build failures.

## What I Would Do With More Time

**1. Split the Monolith.** Break `page.tsx` into separate route groups (`/dashboard`, `/transactions`, `/budgets`, `/ai-coach`) with a shared state layer (Zustand or React Context). This would make the codebase maintainable and testable.

**2. Add Tests.** The project has zero tests. I would add Vitest for unit/integration tests and Playwright for E2E tests covering the core flows: auth, CRUD transactions, budget tracking, and the AI coach.

**3. Implement Missing Features.** The Project Vision calls for a Reports page (filterable charts), CSV/PDF data export, push notifications for budget alerts, and recurring transaction auto-creation — none of which made it into v1.

**4. Re-enable Google OAuth.** The Google login flow is written but commented out. Completing it would improve the auth experience and reduce password fatigue.

**5. Improve Error Handling.** Many Supabase and Gemini errors are silently swallowed or result in empty states. A robust error boundary and user-facing toast notifications would make the app production-ready.

**6. Performance Optimisation.** The bundle includes the entire Tremor suite and all of lucide-react. Code-splitting by route and dynamic imports for the chart library would reduce the initial JS payload significantly.
