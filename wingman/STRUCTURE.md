# Wingman folder structure

This project uses the Next.js App Router with a feature-oriented layout. Import paths use the `@/*` alias (project root).

| Folder | Purpose |
|--------|---------|
| `app/` | Next.js routes, layouts, and route handlers |
| `components/` | Shared, reusable UI (e.g. `components/ui/`) |
| `features/` | Feature modules — colocate domain logic, components, and hooks (`auth/`, `onboarding/`, `experiences/`, `maps/`, `payments/`) |
| `services/` | External integration wrappers (Supabase service layer, Stripe, maps, OneSignal) |
| `hooks/` | Shared custom React hooks |
| `lib/` | Low-level clients and utilities (Supabase browser/server clients, React Query provider, helpers) |
| `types/` | Shared TypeScript types and generated DB types |
| `styles/` | Global CSS and Tailwind theme extensions — imported from `app/layout.tsx` |
| `public/` | Static assets served at `/` |

## Conventions

- **lib vs services** — `lib/` holds client factories, auth config (`lib/auth.ts`), and generic helpers; `services/` holds provider-specific business APIs. `lib/stripe.ts` re-exports from `services/stripe.ts` for convenience.
- **features/** — Route-specific UI and logic live here (`features/auth/components/`, etc.); thin route files in `app/` import from features. Shared primitives stay in `components/`.
- **styles/** — Single source of truth for global CSS; `app/layout.tsx` imports `@/styles/globals.css` (do not add `app/globals.css`).
- **Barrel exports** — `components/index.ts` and `hooks/index.ts` re-export public APIs as the codebase grows.
