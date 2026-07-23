# OPENCODE MEMORY DIRECTIVE

## 1. PRE-TASK RECALL BEFORE SEARCHING
- CRITICAL RULE Before using `grep`, searching the codebase, or writing any code, you MUST first read `memory/functions.md`.
- Use this file to understand the architecture, locate file connections, and find exact function names based on the user's prompt.
- Only search the actual codebase if the answer is not in the memory file.

## 2. POST-TASK AUTO-SAVE NEW SOLUTIONS
- Every time you solve a new problem, create a function, or change how files connect, you MUST automatically append the details to `memory/functions.md`.
- Do not ask the user for permission. Just do it at the end of your response.

## 3. RESPECT .GITIGNORE BEFORE SCANNING
- Before ANY file-tree scan, first read `.gitignore` from the project root.
- Exclude all paths/patterns listed in `.gitignore` from scans. Do not list or traverse them.
- This prevents scanning node_modules, .next, dist, build, .env, etc.

## 4. REPOSITORY MAP (AUTO-MAINTAIN)
- On first project exploration, save a file tree at the top of `memory/functions.md` under `## Repository Map`.
- Show individual files within every directory (expand fully).
- Exclude all `.gitignore`-matched paths.
- When creating a new file, append it. When deleting, remove it.
- At end of each session, re-scan the project and compact the map.

## 5. MEMORY LOGGING FORMAT (FILE-GROUPED)
- Group entries by file path, not by feature name.

### [relative/file/path]
 Keywords [3-5 file-level keywords]
 
 Function Names
   `functionName()`
     Keywords [2-4 per-function keywords]
     Description: [one-line what it does]

## 6. COMMENT-FIRST CODING
- When creating or editing any function, write a brief `//` comment above it.
- Format: `// functionName() - what it does`
- Enables grep fallback when memory lookup misses.

## 7. AUTO-DEBUG TRIGGER
- If thinking >30s without producing a fix → STOP reasoning.
- Insert `console.log('DEBUG:' + JSON.stringify(...))` at suspected failure points.
- Run, read logs, identify problem, fix, remove logs.
- For crashes (no output): add try/catch + console.error at entry points.

## 8. MODULARITY RULE
- Keep each source file under ~600 lines.
- If a file exceeds this, split it.
- Each file should be independently fixable — minimize cross-file deps.
