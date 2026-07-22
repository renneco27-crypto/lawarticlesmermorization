# OPENCODE MEMORY DIRECTIVE

## 1. PRE-TASK RECALL BEFORE SEARCHING
- CRITICAL RULE Before using `grep`, searching the codebase, or writing any code, you MUST first read `.configopencodememoryarchitecture.md`.
- Use this file to understand the architecture, locate file connections, and find exact function names based on the user's prompt. 
- Only search the actual codebase if the answer is not in the memory file.

## 2. POST-TASK AUTO-SAVE NEW SOLUTIONS
- Every time you solve a new problem, create a function, or change how files connect, you MUST automatically append the details to `.configopencodememoryarchitecture.md`.
- Do not ask the user for permission. Just do it at the end of your response.

## 3. MEMORY LOGGING FORMAT
When writing to `.configopencodememoryarchitecture.md`, strictly use this format so it is easy to retrieve later

### [Feature or Problem Name]
 Keywords [3-5 keywords the AI might use to search for this later]
 Problem Solved [1-2 sentences on what the code does]
 File Connections [How the files map to each other, e.g., `srcapi.ts` - calls - `srcdb.ts`]
 Function Names 
   `functionName()` - [Brief description]