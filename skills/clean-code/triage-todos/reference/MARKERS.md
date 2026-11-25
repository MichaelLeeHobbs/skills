# Markers: what to triage

## Scope

Search every tracked text file at the pinned commit. Skip these, and count each by reason:
- binary files;
- vendored or generated paths: the repo's own markings (version-control attributes that mark files
  vendored or generated, a generated-file header), dependency folders (`node_modules`, `vendor`,
  `.venv`), and build output (`dist`, `build`, `target`, `out`) when the repo ignores it;
- the whole `clean-code/` folder;
- changelogs and release notes, where a past TODO is history, not an instruction.

## Tagged markers

`TODO`, `FIXME`, `HACK` and `XXX`, upper case, as a whole word, inside a comment. Also match the forms
teams use to attach a reference or owner: `TODO(ABC-123)`, `TODO(team)`, `TODO: #123`,
`FIXME(https://...)`, `TODO[ABC-123]`.

**Reference.** Take the first issue key, issue number or issue URL in the comment or its continuation
lines. A bare `#123` names an issue only when step 1 settled which tracker that is. A person's name or a
team handle is an owner, not a reference: record it in the work folder only, never in the report.

**Continuation lines.** A comment continues while the next line is a comment of the same form at the same
indentation, with no blank line between. The marker's text is all of it.

## Comment forms

Cover every form each language present allows:

| Languages | Forms |
|---|---|
| C family (JS, TS, Java, Kotlin, C, C++, C#, Go, Rust, Swift, Scala, PHP, Dart) | `//` line and trailing, `/* */` on one line, ` * ` lines inside a block comment, JSX `{/* */}` |
| Hash family (Python, Ruby, shell, YAML, TOML, Perl, R, PowerShell, Makefile) | `#` line and trailing; Python docstring lines |
| SQL, Lua, Haskell | `--` |
| HTML, XML, Markdown, Vue and Svelte templates | `<!-- -->` |
| CSS, SCSS, Less | `/* */`, and `//` in SCSS and Less |

A marker inside a string literal is not a marker. A language missing here: add its forms in your run and
name them in the report.

## Unmarked phrases

Comments that make the same promise without a tag. Search comments only, case-insensitive:
- `temporary`, `temporarily`, `for now`, `until`, `remove (this|once|when|after)`,
  `revisit (if|when|once)`;
- `workaround for`, `hack around`, `revert (this|once|when)`;
- `this breaks (when|if)`, `doesn't work (when|if)`, `known issue`, `not yet (supported|implemented)`.

An unmarked hit is a marker only when the comment states a condition that can stop holding ("until the
v2 API ships", "remove once all clients send the header"). "Temporary variable" is not one. Write each
rejected hit's reason (`no condition`, `describes a value`, `string literal`) in the work folder and
count rejections by reason in the report. The user can turn this pass off; the run record says whether
it ran.

## Canary

Before step 2's real search, write a canary file in the work folder for each language present. Plant:
- one tagged marker in every comment form the language has, one of them with a reference and one with
  continuation lines;
- one unmarked phrase with a condition, and one without;
- one `TODO` inside a string literal.

Run step 2 on the canary files with the same patterns. It must find exactly the planted markers, with
the planted references and full continuation text, and reject the string literal and the unmarked phrase
with no condition. Keep canary files out of every count except the report's Canaries line.
