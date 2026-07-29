prompting the model with need to use keywords like "plan" and "produce" to triggers not just generic "create"

using gpt-5-mini for spec generation - it wasn't able to generate spec without me explicitly telling it to put it inot spec file

doesn't ask clarifying questions, just generates once and wants to move onto next step

> response interrupted by server error (review was interrupted and just hung for a while)
> review agent for specifications takes a while
> tried to use code-review agent which just compared to current code existing in the repo

generated implementation plan but never put it in the repo (stayed within the agent session) -- needed to manually copy and paste

giving it wrong context by telling it to replace hello world rlly affects quality / waste context since it processed space invaders files when it was just suppsed to remove them

hallucinated within the loop and created another implementation_plan denoted with @IMPLEMENTATION_PLAN.md instead of IMPLEMENTATION_PLAN.md.
could not do anything to interfere with loop unless wanted to just stop it and let it continue after based on current state of implementaiton plan (however this may be missing things since files split off)
let it run to see what final state we are working with (as Rust reading mentioned - update system after, don't directly update the incorrect code changes)
build loop run for 1 hr
website didn't work on first go - had server errors and missing UI

V2 - fix current site (update specs) + remove space invaders game
V3 - add to-do list

stronger models produce much more concise, better-performing results
gemini asked follow-up questions

runs so much faster

sometimes loop doesn't finish running through all of implementation plan. need to re-run to keep executing rest of implementation plan
