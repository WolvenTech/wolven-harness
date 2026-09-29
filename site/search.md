---
description: How the qmd skill searches your own documents.
---

# Searching your documents

The `qmd` skill wires an agent into QMD, a local markdown search tool, so a question gets answered from your decision records and specs before it is answered from memory or the web. QMD is a separate CLI the skill expects to find installed. The harness only teaches the agent to use it well.

1. **Search decisions.** Query the decision records first — they are the record an agent is allowed to depend on.
2. **Widen.** Only on a miss, widen the same question across every indexed collection.
3. **Retrieve in full.** Pull the whole document rather than working from snippets, which are leads and not evidence.
4. **Answer with citations.** Answer from the retrieved text, citing the path or document id it came from.

Rather than pasting a bare question, the skill has the agent write the query in four labelled parts:

- `intent:` what you are trying to find, and what to avoid.
- `lex:` exact terms, aliases, titles, and rare words you expect to appear.
- `vec:` the same idea paraphrased in natural language.
- `hyde:` a description of the document that would satisfy the request.
