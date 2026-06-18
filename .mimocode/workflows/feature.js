export const meta = {
  name: "feature",
  description: "Feature implementation pipeline: discovery → plan → implement → review → verify"
}

/**
 * Feature workflow — the main orchestration pipeline for Homemade Organizer.
 *
 * Coordinates specialized subagents through phases:
 *   1. Discovery   — explore the codebase to understand relevant files
 *   2. Plan        — draft an implementation plan from discoveries
 *   3. Implement   — execute the plan (parallel where possible)
 *   4. Review      — check changed files against project conventions
 *   5. Verify      — build and validate
 *
 * Usage from mimocode: "/workflow feature 'Add due dates to items'"
 * Args: { feature: string, scope?: string[] }
 */

export default async function (args) {
  const feature = args.feature || args
  if (!feature) throw new Error("Missing feature description via args.feature or args string")

  phase("Discovery", `Exploring codebase for: ${feature}`)

  // — Phase 1: Discovery (parallel exploration) —
  const [discovery, conventions] = await parallel([
    () => agent(`
You are a discovery subagent for a Vue 3 home organizer app.
Explore the codebase to understand what's needed for this feature: "${feature}"

Tech stack: Vue 3 (Composition API, <script setup>), Vite 8, Tailwind CSS v4, Supabase, Vue Router 5.

Key files to examine:
  - src/views/HomeDetail.vue — main organizer view (rooms, items, budget)
  - src/views/HomeView.vue — landing page (create/join home)
  - src/lib/supabase.js — Supabase client
  - src/lib/recentHomes.js — localStorage recent homes
  - src/router/index.js — routes
  - supabase-schema.sql — data model (homes, rooms, items tables)

Report:
1. Which components/modules are relevant to "${feature}"?
2. What existing patterns (form modals, currency formatting, supabase calls, error handling) should be reused?
3. Any blockers or missing pieces?

Keep the report under 200 words — focus only on actionable discoveries.
    `),
    () => agent(`
Read AGENTS.md and src/views/HomeDetail.vue (first 300 lines for conventions).
Report in under 100 words the top 5 conventions (currency, theming, form handling, error patterns, component style) that any new code must follow.
    `)
  ])

  log(`Discovery complete. Conventions: ${conventions?.substring(0, 80)}...`)

  // — Phase 2: Plan —
  phase("Plan", "Drafting implementation plan")

  const plan = await agent(`
You are a planning subagent for a Vue 3 home organizer app.

Feature: "${feature}"

Discovery report:
${discovery}

Conventions (must follow strictly):
${conventions}

Create a numbered step-by-step implementation plan. For each step list:
- File to create/modify
- What to change
- Dependencies (must complete before)

Rules:
- Use Vue 3 <script setup> Composition API
- Use Tailwind CSS v4 utility classes (dark theme: bg-gray-950, text-gray-100)
- Use BRL currency formatting via formatCurrency() from HomeDetail.vue line 264
- Supabase calls: use the singleton from src/lib/supabase.js
- Form modals: autofocus first field, Enter to submit, validate before save
- Keep HomeDetail.vue as single-file unless the task demands a new component
- Run \`npm run dev\` to verify, \`npm run build\` for production check

Report the plan as numbered steps. Keep it actionable.
  `)

  log(`Plan ready. ${plan?.length || 0} chars`)

  // — Phase 3: Implement —
  phase("Implement", "Executing implementation steps")

  const implementation = await agent(`
You are an implementation subagent for a Vue 3 home organizer app.

Feature: "${feature}"

Implementation plan:
${plan}

IMPORTANT CONVENTIONS:
${conventions}

Execute ALL implementation steps now:
1. Read each file before editing it
2. Make the changes exactly as planned
3. Follow the codebase's existing patterns (look at neighboring files for style)
4. Use existing utilities: supabase from src/lib/supabase.js, formatCurrency from HomeDetail.vue
5. No unnecessary comments, no premature abstractions

After implementing, run: npm run build
Report: files modified, the build result (pass/fail), and any issues.
  `, { timeout_ms: 300000 })

  log(`Implementation done. Result: ${implementation?.substring(0, 120)}...`)

  // — Phase 4: Review —
  phase("Review", "Checking implementation against conventions")

  const review = await agent(`
You are a code review subagent for a Vue 3 home organizer app.
Read AGENTS.md first, then review the implementation.

Feature: "${feature}"

Implementation result:
${implementation}

Review checklist:
- [ ] Vue 3 <script setup> used?
- [ ] Tailwind v4 classes, dark theme (bg-gray-950)?
- [ ] Currency: formatCurrency() from HomeDetail.vue, BRL locale?
- [ ] Supabase: using lib/supabase.js singleton?
- [ ] Form modals: autofocus, Enter submit, validation before save?
- [ ] No emoji (unless user-requested)?
- [ ] No unnecessary comments?
- [ ] Files in correct location (views/, lib/, router/)?
- [ ] Build passes?

Report:
- PASS/FAIL per item (1 sentence each)
- If FAIL, the exact file:line and what's wrong
- Overall verdict: APPROVED / NEEDS_FIXES

Keep under 200 words.
  `, { timeout_ms: 120000 })

  log(`Review verdict: ${review?.substring(0, 80)}...`)

  // — Phase 5: Verify —
  phase("Verify", "Final build and validation")

  const verify = await agent(`
Run these verification steps for Homemade Organizer:
1. \`npm run build\` — ensure production build passes
2. If build fails, report the exact error

Report: BUILD PASS or BUILD FAIL with error details and the file:line to fix.
  `, { timeout_ms: 120000 })

  return {
    feature,
    discovery: discovery?.substring(0, 200),
    plan: plan?.substring(0, 200),
    implementation: implementation?.substring(0, 200),
    review,
    verify,
    status: review?.includes("APPROVED") && verify?.includes("PASS") ? "done" : "needs_attention"
  }
}
