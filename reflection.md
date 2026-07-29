It was interesting to see how much guardrails and specificity affected the model
results. Starting with the specifications, if details were unclear or slightly
off, most models would often hallucinate and fill in those gaps with incorrect
details instead of asking follow-up questions for
clarity. Similarly for the implementation plan, if any part was slightly off /
incorrect, it would lead to detrimental effects during the coding
(implementation) loop. Since there is no manual user
interaction or interruption during the loop, it would go deeper down an
incorrect path with no way to recover / backtrack. The only way to fix these
incorrect path diversions was to start new loops that directly addressed / fixed
those introduced issues.

This relates to software engineering best practices to ensure specifications and
requirements are flushed out in detail. The clearer, more specific they are -
the more successful the product outcome is. This was exactly reflected with the
loop and specifications / implementation detail interaction.

Furthermore, this also reflected what we see in DevOps pipelines. When one part
of the pipeline introduces a failure, it propagates throughout the entire
pipeline. This is exactly what we saw with the loop and the propagated errors -
starting from the beginning of the loop with specifications. To address this,
we must employ the "shift-left" strategy as commonly used in DevOps pipelines as
well. We must ensure thorough guardrails, checks, and review of the
specifications and implementation plan (the early "left" stages) of the loop /
pipeline to ensure the rest of the stages execute smoothly and don't introduce
more issues.
