# CLAUDE.md
You are an AI assistant working on this repository.
Follow the rules in this file strictly.
---
## Project Overview
**Shane's Retirement Fund** — A mobile-first lottery pool web app that lets users pool resources, join lottery groups, and manage collective wealth with friends.
- **Live Site:** https://shanesfund.vercel.app
- **Repo:** https://github.com/boilermanc/shanesfund
The project prioritizes:
- Maintainability
- Explicitness over cleverness
- Type safety
- Minimal abstraction
- Mobile-first responsive design
Assume this codebase is actively maintained by humans.
---
## Tech Stack
**Frontend:**
- React 19 (functional components only)
- TypeScript
- Vite 6 (build tool)
- Zustand (state management)
- Framer Motion (animations)
- Lucide React (icons)
**Backend / Data:**
- Supabase (planned: Postgres, Auth, Storage)
- Supabase client via `@supabase/supabase-js`
**Styling:**
- Tailwind CSS (via CDN)
- Custom color palette:
  - Primary Teal: #006D77
  - Accent Teal: #83C5BE
  - Light Background: #EDF6F9
  - Cream Background: #F2E9D4
  - Coral Accent: #E29578
  - Coral Light: #FFDDD2
**Deployment:**
- Vercel
---
## Project Structure
- `components/` — All React components (27+ files)
- `store/useStore.ts` — Zustand store
- `types.ts` — TypeScript interfaces
- `lib/` — Utilities
- `App.tsx` — Main app component
- `index.tsx` — Entry point
---
## General Coding Rules
- Prefer small, composable functions
- Avoid premature abstraction
- Avoid introducing new libraries unless explicitly requested
- Do not refactor unrelated code unless asked
- Keep diffs minimal and reviewable
- Provide complete file contents when editing (not snippets)
When unsure, ask a clarifying question before making large changes.
---
## React Guidelines
- Use functional components only
- Prefer `useEffect` with explicit dependency arrays
- Avoid overusing `useMemo` / `useCallback`
- Keep components focused on one responsibility
- Extract logic into hooks when reused more than once
**State:**
- Use Zustand for global state (`store/useStore.ts`)
- Prefer local state when possible
---
## Styling Guidelines
Follow existing Tailwind responsive patterns:
- Text: `text-xs sm:text-sm`
- Padding: `p-4 sm:p-6`
- Rounded corners: `rounded-[1.5rem] sm:rounded-[2rem]`
- Gaps: `gap-3 sm:gap-4`
Use Framer Motion for animations. Use Lucide React for icons.
---
## Supabase Guidelines
- Do not bypass Supabase security assumptions
- Assume Row Level Security (RLS) is enabled
- Never embed service role keys in frontend code
- Prefer server-side logic for privileged operations
**Queries:**
- Keep queries explicit and readable
- Handle error states explicitly
**Auth:**
- Assume auth state can change at any time
- Do not assume a user is logged in unless explicitly checked
---
## Database & Migrations
- Do NOT generate destructive migrations unless explicitly requested
- Call out breaking schema changes clearly
- Prefer additive changes (new columns, new tables)
---
## Error Handling
- Never silently ignore errors
- Surface meaningful error messages
- Log errors when helpful, but avoid noisy logs
---
## Commands
**Development:**
`npm run dev`
**Deploy to production:**
`npx vercel --prod`
**Push changes:**
`git add . && git commit -m "message" && git push origin main`
---
## How You Should Respond
- Give steps one at a time, wait for confirmation before next step
- Always provide full PowerShell/terminal commands ready to copy-paste
- Provide complete updated files (not just snippets)
- Be concise but thorough
- Explain *why* when suggesting changes
- Ask clarifying questions when requirements are ambiguous
If something feels risky or irreversible, pause and confirm first.
---
## What NOT To Do
- Do not rewrite large files without permission
- Do not change project structure arbitrarily
- Do not introduce patterns not already used unless justified
- Do not use class components
- Do not add dependencies without asking
