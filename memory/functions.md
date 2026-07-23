## Repository Map
C:\Users\corte\Desktop\lex memoria\
├── .claude/
│   ├── IMPLEMENTATION-TODO.md
│   └── SKILLS-MIGRATION-PLAN.md
├── .opencode/
│   └── .gitignore
├── lib/
│   ├── articleService.ts
│   ├── cacheManager.ts
│   ├── coachEngine.ts
│   ├── dictionaryService.ts
│   ├── playlistEngine.ts
│   ├── scoreEngine.ts
│   ├── sessionManager.ts
│   ├── supabaseAdmin.ts
│   └── wordClassifier.ts
├── memory/
│   └── functions.md
├── public/
│   ├── index.html
│   └── test/
│       └── index.html
├── supabase/
│   ├── book-delete.sql
│   ├── lawrence.csv
│   ├── schema.sql
│   └── seed.sql
├── types/
│   └── index.ts
├── .cursorrules
├── .env.local
├── .gitignore
├── AGENTS.md
├── next-env.d.ts
├── next.config.js
├── opencode.json
├── package.json
├── PHASE4_INTEGRATION_NOTES.md
├── text.txt
├── tsconfig.json

---

### [public/index.html]
 Keywords [index, html, typing, game, words, type-to-fill]

 Function Names
   `renderWords()`
     Keywords [render, input, a__, __, blank]
     Description: Renders <input> elements for A__ and __ modes

   `checkWordInput(i)`
     Keywords [validate, input, compare, wordstate]
     Description: Validates input on blur/Enter against tokens[i].word

   `updateOverallScore()`
     Keywords [score, badge, progress, shared]
     Description: Recalculates score badge, progress fill, and progress text

   `clickWord(i)`
     Keywords [click, toggle, wordstate, refactor]
     Description: Toggles word state, calls updateOverallScore()

## Auto-Debug Protocol
- If thinking >30s without producing a fix → STOP reasoning.
- Insert `console.log('DEBUG:' + JSON.stringify(...))` at suspected failure points.
- Run, read logs, identify problem, fix, remove logs.
- For crashes (no output): add try/catch + console.error at entry points.

---

### [AGENTS.md]
 Keywords [memory, directives, gitignore, repo-map, format, debug, modularity]

 Description: Central memory directive — 8 sections governing opencode behavior:
   §1 Pre-Task Recall — read memory/functions.md before grep
   §2 Post-Task Auto-Save — append solutions after every session
   §3 Respect .gitignore — never scan excluded paths
   §4 Repository Map — auto-maintain file tree at top of memory/functions.md
   §5 Memory Logging Format — file-grouped entries with per-function keywords
   §6 Comment-First Coding — // functionName() - what it does on every function
   §7 Auto-Debug Trigger — >30s thinking → console.log insertion
   §8 Modularity Rule — ~600 lines per file, independent fixability

### [.gitignore]
 Keywords [exclude, node_modules, env, next, dist, build, zip]

 Description: Prevents node_modules, .env*, .next/, dist/, build/, *.zip from being scanned or committed.

### [setup.bat]  (template: do not delete second brain)
 Keywords [setup, install, second-brain, template, windows]

 Description: Copies AGENTS.md, opencode.json into any target project + creates .opencode/memory/, memory/functions.md, and .gitignore with sensible defaults.

---

## Session Log — 2026-07-24

### Change: Q&A bypass on ≥80% confidence
**Files touched** (external project: InterviewCopilot)
`interview-copilot-overlay.html`

**What changed**
- Added `qaMatchResult` state object (line 817) — stores best match info for bypass check
- Added `computeConfidence(score, spokenQ)` (line 1788) — normalizes raw score to 0-1 ratio against theoretical max
- Modified `extractRelevantContext()` — sets `qaMatchResult.confidence` after scoring, resets on null/no-pairs
- Modified `triggerAI()` — after building systemMsg, checks `qaMatchResult.confidence >= 0.8`; if true, displays stored answer directly and returns (no AI call)
- Modified `queryAI()` — same bypass, only when `!systemMsgOverride` (fresh buildSystemMsg was called)
- Added `bestQuestion` field to qaMatchResult for debug visibility
