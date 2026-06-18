export const meta = {
  name: "review",
  description: "Code review: check changed files against project conventions"
}

/**
 * Review workflow — focused code review against project standards.
 *
 * Usage from mimocode: "/workflow review 'Check PR conventions'"
 * Args: { files?: string[], focus?: string }
 */

export default async function (args) {
  const files = args.files || []
  const focus = args.focus || args || "all changed files"

  phase("Review", `Checking: ${focus}`)

  // — Phase 1: Read conventions + changed files (parallel) —
  const [conventions, code] = await parallel([
    () => agent(`
Read AGENTS.md. Extract the mandatory conventions list:
- Vue 3 <script setup> required?
- Tailwind v4 classes, dark theme convention?
- Currency: formatCurrency(), BRL locale?
- Supabase: lib/supabase.js singleton?
- Form modals: autofocus, Enter, validation?
- File naming: Views in views/, lib in lib/?
- Any forbidden patterns (no emoji, no comments)?
- Roadmap priority order?

Report as a bullet list of CONVENTION: expectation.
    `),
    () => agent(`
Read these files and report their structure + any violations:

Files: ${files.length > 0 ? files.join(", ") : "use 'git diff --name-only' to discover changed files"}

For each file, report:
1. File path and purpose
2. Imports used
3. Component pattern (script setup, Options API, etc.)
4. Tailwind classes used (check for dark theme conformance)
5. Currency handling (if applicable)
6. Supabase usage (if applicable)

Report under 300 words total.
    `)
  ])

  // — Phase 2: Cross-reference conventions vs code —
  const verdict = await agent(`
You are a strict code reviewer for Homemade Organizer.

Project conventions:
${conventions}

Code under review:
${code}

For EACH convention, state PASS or FAIL with file:line evidence.
If FAIL, say exactly what needs to change.

Format:
\`\`\`
### [Convention Name]
PASS — (one-sentence evidence)
or
FAIL — src/File.vue:42 — (what's wrong and what to do)
\`\`\`

Final verdict: APPROVED / NEEDS_FIXES (X issues)
  `, { timeout_ms: 120000 })

  return {
    focus,
    verdict,
    files: files.length > 0 ? files : "auto-discovered"
  }
}
