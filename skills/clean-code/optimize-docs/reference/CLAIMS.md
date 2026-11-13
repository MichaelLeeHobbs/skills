# Checking the claims a doc makes

Read this during step 2, before you check anything. Every claim type here has a check, and a way that
check passes while the claim stays false. The second half is the part that matters, because a checking
pass that reports a clean result on a lying doc is worse than no pass at all.

## Paths and directories

**Check:** the path exists.

The path exists and holds something else. A doc saying `src/config.ts` holds the defaults passes an
existence check long after the defaults moved to `src/config/defaults.ts` and the old file became a
re-export. Open it and confirm it holds what the sentence says it holds.

A path inside a fenced block is still a claim. Fences are where most path claims hide, and they are the
ones readers copy without thinking.

## Commands and flags

**Check:** run it, read-only only. Otherwise ask the tool for its help output and confirm every flag
appears there.

The command exits zero and the flag did nothing. Plenty of tools ignore an unrecognised option, and
anything after a `--` is passed through to something that may ignore it too. Exit zero is not
confirmation; the flag appearing in help output is.

It works for the author because of a global install the doc never mentions. When the doc is an install
procedure, that missing prerequisite is the defect, and it only shows up on a machine that does not
already have the thing.

**Never run anything that writes, deploys, publishes, migrates or sends.** Mark it unchecked, name the
reason, and count it as unchecked in the report.

## Symbols, endpoints and routes

**Check:** search the source for the name, then confirm it is reachable from where the doc puts the
caller.

The name exists and nothing outside the package can reach it, so the doc is presenting a private thing as
public API. Callers will import it anyway, and the next refactor breaks them.

The name exists only in a test fixture, a mock, or another doc. Search results agree with the doc and the
product does not.

## Environment variables, configuration keys and ports

**Check:** search for the reader, not the writer. The doc names the variable, so find the code that reads
it.

It is read, and a default elsewhere means nobody ever sets it. The doc's instruction to set it is cargo
that every new developer copies.

Two names survive one rename, both still read for compatibility, and the doc names the dead one. This is
a fix, not a deletion: a reader with an old configuration still needs to know which one they have.

## Versions and dependencies

**Check:** compare against the manifest and the lock file.

The stated minimum is lower than what the code now requires. This passes every syntactic check and breaks
a new contributor on their first afternoon, which is the argument for executing an install procedure
rather than reading it.

## Links

**Check:** internal links resolve to a file and to an anchor that exists. External links return success.

A redirect to a generic landing page returns success. Follow it and confirm the destination is still the
thing being cited.

A dead anchor still loads the page. Check the fragment, not only the URL.

## A claim you cannot check

Say so, name the reason, and count it separately. An unchecked claim is not a passing claim. Folding the
two together is the exact failure this step exists to prevent, and it produces a report that says the
docs are fine when nobody looked.
