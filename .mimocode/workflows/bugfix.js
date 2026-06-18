export const meta = {
  name: "bugfix",
  description: "Bug investigation and fix: search → analyze → fix → verify"
}

/**
 * Bugfix workflow — investigate, diagnose, fix, and verify a bug.
 *
 * Usage from mimocode: "/workflow bugfix 'Items not saving when vendor_links is empty'"
 * Args: { bug: string, context?: string }
 */

export default async function (args) {
  const bug = args.bug || args
  if (!bug) throw new Error("Missing bug description via args.bug or args string")

  phase("Search", `Investigating: ${bug}`)

  // — Phase 1: Parallel search + root cause analysis —
  const [searchResults, conventions] = await parallel([
    () => agent(`
You are a bug investigator for a Vue 3 + Supabase home organizer app.

Bug: "${bug}"

Search the codebase thoroughly:
1. Grep for relevant component names, error messages, or Supabase table names mentioned in the bug
2. Read the view files: src/views/HomeDetail.vue, src/views/HomeView.vue
3. Check src/lib/supabase.js for client setup
4. Check supabase-schema.sql for table constraints
5. Look at the router: src/router/index.js

Report:
- Files involved (file:line)
- Root cause hypothesis (1 sentence)
- Reproduction steps (1-3 steps)
- What data/state is involved

Keep under 200 words. Be precise with file:line references.
    `),
    () => agent(`
Read AGENTS.md. Report in under 50 words: the build command, the framework (Vue 3), Tailwind version, and key conventions for error handling and validation.
    `)
  ])

  log(`Search done. Root cause hypothesis extracted.`)

  // — Phase 2: Diagnose (focused on root cause) —
  const diagnosis = await agent(`
You are a diagnostic subagent. Based on search results, narrow down the root cause.

Bug: "${bug}"

Search findings:
${searchResults}

Project context:
${conventions}

Verify the root cause hypothesis by:
1. Reading the specific lines referenced in the search results
2. Tracing the data flow: user action → component handler → supabase call → response
3. Checking for common pitfalls:
   - JSONB handling (vendor_links in items table)
   - Reactivity (ref vs computed vs reactive in Vue 3)
   - Async/await missing
   - Supabase error swallowed silently
   - Form validation bypassed
   - Route params mismatch

Report:
- CONFIRMED ROOT CAUSE: [file:line] — [explanation]
- FIX: [single-sentence description of the fix]
  `, { timeout_ms: 120000 })

  log(`Diagnosis: ${diagnosis?.substring(0, 100)}...`)

  // — Phase 3: Fix —
  phase("Fix", "Applying the fix")

  const fix = await agent(`
You are a fixer subagent. Apply the minimal fix for this bug.

Bug: "${bug}"

Diagnosis:
${diagnosis}

Conventions:
${conventions}

Steps:
1. Read the target file(s) first
2. Apply the minimal fix — no refactoring, no cleanup, no extra features
3. Verify: run \`npm run build\`

Report:
- Files modified (file:line of each change)
- Build result: PASS or FAIL with error
- Before/after: what changed and why
  `, { timeout_ms: 180000 })

  // — Phase 4: Verify —
  const verify = await agent(`
Run \`npm run build\` to verify the fix compiles.

Bug: "${bug}"
Fix: ${fix}

Report: BUILD PASS or BUILD FAIL with error details.
  `, { timeout_ms: 120000 })

  return {
    bug,
    searchResults: searchResults?.substring(0, 200),
    diagnosis,
    fix,
    verify,
    status: verify?.includes("PASS") ? "fixed" : "needs_attention"
  }
}
