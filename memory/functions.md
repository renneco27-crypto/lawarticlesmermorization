### [Type-to-Fill Mode]
 Keywords [typing, input, A__, blank, type-to-fill, checkWordInput]
 Problem Solved [Allows users to type directly into word inputs in A__ and __ difficulties instead of clicking through states]
 File Connections [public/index.html]
 Function Names
   `renderWords()` - Renders &lt;input&gt; elements for A__ (curDiff===2, FUNCTION_WORD excluded) and __ (curDiff===3) modes with `onfocus="this.select()"`, `onblur="checkWordInput(i)"`, `onkeydown` Enter blur
   `checkWordInput(i)` - Validates input on blur/Enter: compares trimmed lowercase input against `tokens[i].word.toLowerCase()`, sets `wordStates[i]` to correct/wrong, updates CSS class
   `updateOverallScore()` - Extracted shared helper that recalculates score badge, progress fill, and progress text based on non-function word states
   `clickWord(i)` - Refactored to call `updateOverallScore()` instead of inline score calculation
