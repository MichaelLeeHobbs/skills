# The scanner: what it emits, and the cases it must pass

You generate the scanner on the user's machine, in the work folder, with the language's parser and its
name resolution (a compiler or type-checker API, not a tokenizer). It reads source at the recorded
commit and writes the `close` input records in [CONTRACT.md](CONTRACT.md). The tool builds sites from
them; the scanner never decides what a site is.

No parser that resolves imports means the census cannot run: stop and say so. Never fall back to text
search for counting. Text search is only the cheap net that proposes `unresolved` hits.

## Symbols

Resolve every callee and every reference to the declaration the parser gives, through imports,
re-exports, barrels, aliases and destructuring.

| Declared in | Symbol |
|---|---|
| the package | `path#name`; a nested or member function joins names with `.` (`src/api/client.ts#apiClient.get`) |
| a dependency | `pkg:<package>#<export>`; a method on an instance resolves to its type's method (`pkg:axios#AxiosInstance.get`) |
| the platform | `global#<name>` (`global#fetch`, `global#console.error`) |

A call the parser cannot resolve (a dynamic property, an untyped injected client) is never guessed.

## Records

- **`call`**: every call expression and every `new` expression (a call of the constructor), plus every
  element that renders a capitalised component (`<Card/>` calls `Card`). Lower-case elements are not
  calls.
- **`ref`**: every identifier that resolves to a function and is not the callee of a call: passed as an
  argument, a property value, returned, stored.
- **`fn`**: every named function: declarations, named arrows and function expressions, methods, object
  members. `component` is true when it returns markup. `wraps` is the ID of the call whose value the
  function returns (directly, through `await`, or as an arrow's expression body), or of the call that is
  its only statement; otherwise empty.
- **`sink`**: from the frozen sink table (step 2 of SKILL.md). Only `emit` entries are sinks. A
  `construct` entry (`axios.create`, `logger.child`) is not a sink; the instance it returns is resolved
  through types, so its methods reach emit sinks.
- **`opaque`**: each file implementing a module a convention names (the shared client itself). Calls
  inside it are the convention's machinery, not sites.
- **`unresolved`**: a call the parser could not resolve that the job's lexical net matches (JOBS.md).
  `job` is the job whose net matched. `key` is the file's content hash, the definitions version and the
  call's source text up to its opening parenthesis, joined with `|`.

**IDs.** `path:line:n`. `line` is where the expression starts. `n` numbers the calls and references that
start on that line, from 1, ordered by start position, then by end position (an inner `a.b()` before the
outer `a.b().c()`). Never use columns: runtimes count them differently.

**`in_fn`** is the innermost named function containing the expression; anonymous functions are
transparent. Empty at module level.

**`in_site`** is the innermost call whose arguments contain the expression, including object literal
values and the bodies of functions written inline as arguments. Any call, not only a hit.

**`trigger`**: the nearest enclosing context, first match:

| Trigger | Context |
|---|---|
| `query-hook` | the call is, or sits in the arguments of, a call to a sink marked `hook` in the sink table |
| `effect` | inside a function passed to a lifecycle or effect hook |
| `handler` | inside a function bound to an event (an `on*` prop, an event listener, a form submit) |
| `thunk` | inside a thunk, saga or store action creator |
| `server` | inside a route handler, server action, loader or other server-only entry |
| `render` | directly in a component body |
| `module` | at module top level |
| `other` | anything else |

## Scanner cases

Write each case's files into the work folder under `cases/<case>/`, plus the shared client below, at
the line numbers shown. Scan them together with this sink table (close input):

```
{"t":"sink","symbol":"global#fetch","job":"fetch","marker":"fetch"}
{"t":"sink","symbol":"pkg:axios#get","job":"fetch","marker":"axios"}
{"t":"sink","symbol":"pkg:axios#AxiosInstance.get","job":"fetch","marker":"axios"}
{"t":"sink","symbol":"pkg:@tanstack/react-query#useQuery","job":"fetch","marker":"react-query"}
{"t":"sink","symbol":"src/api/client.ts#apiClient.get","job":"fetch","marker":"apiClient"}
{"t":"opaque","path":"src/api/client.ts"}
```

`useQuery` is the `hook` sink. Run `close`, turn each site into a `got` record (the case is the folder
after `cases/`, and the ID drops the `cases/<case>/` prefix), write the expected table below as `expect`
records, and run `verify --check scan`. It must exit 0. A case with no expected sites passes only when it
produces none. If it fails, fix the scanner and rerun; never edit an expected row.

**Shared client** `src/api/client.ts` (convention-module: no sites):
```
1 import axios from 'axios';
2 export const apiClient = {
3   get: (url) => axios.get(url),
4 };
```

**barrel-alias** (resolution through a re-export and an alias). `api.ts`:
`1 export { apiClient as api } from '../../src/api/client';` and `B.tsx`:
```
1 import { api } from './api';
2 export function B() {
3   return <button onClick={() => api.get('/b')}>go</button>;
4 }
```

**instance** (construct is not a sink; the instance method is). `C.ts`:
```
1 import axios from 'axios';
2 const http = axios.create({ baseURL: '/api' });
3 export function save() {
4   http.get('/c');
5 }
```

**destructure**. `D.ts`:
```
1 import { apiClient } from '../../src/api/client';
2 const { get } = apiClient;
3 export async function load() {
4   const r = await get('/d');
5   return r.data;
6 }
```

**two-level-wrapper** (callers of a wrapper chain are the sites). `users.ts`:
```
1 import { apiClient } from '../../src/api/client';
2 export function getUser(id) {
3   return apiClient.get(`/users/${id}`);
4 }
5 export function loadUser(id) {
6   return getUser(id);
7 }
```
`E.ts`:
```
1 import { loadUser } from './users';
2 export function onOpen(id) {
3   loadUser(id);
4 }
5 export function onRefresh(id) {
6   loadUser(id);
7 }
```

**wrong-in-use** (the convention's client inside an effect is its own family). `F.tsx`:
```
1 import { useEffect } from 'react';
2 import { apiClient } from '../../src/api/client';
3 export function F({ setRows }) {
4   useEffect(() => {
5     apiClient.get('/rows').then(setRows);
6   }, [setRows]);
7   return null;
8 }
```

**fed-reference** (a function passed by name feeds the hook). `queries.ts`:
```
1 import { apiClient } from '../../src/api/client';
2 export function fetchUsers() {
3   return apiClient.get('/users');
4 }
```
`G.tsx`:
```
1 import { useQuery } from '@tanstack/react-query';
2 import { fetchUsers } from './queries';
3 export function G() {
4   const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
5   return null;
6 }
```

**inline-nested** (one site per request chain). `H.tsx`:
```
1 import { useQuery } from '@tanstack/react-query';
2 export function H() {
3   const q = useQuery({
4     queryKey: ['h'],
5     queryFn: () => fetch('/h').then((r) => r.json()),
6   });
7   return null;
8 }
```

**two-on-a-line**. `I.ts`:
```
1 export function ping() {
2   fetch('/a'); fetch('/b');
3 }
```

**lookalike** (a same-named method, a comment and a string are not sites). `J.ts`:
```
1 class Cache { fetch(key) { return key; } }
2 const cache = new Cache();
3 export const v = cache.fetch('k');
4 // fetch('/in-a-comment')
5 export const s = "fetch('/in-a-string')";
```

**split-chain** (a call split over lines takes the line it starts on). `K.ts`:
```
1 import { apiClient } from '../../src/api/client';
2 export async function k() {
3   const r = await apiClient
4     .get('/k');
5   return r;
6 }
```

**component-render** (rendering a component three times is not three requests). `Card.tsx`:
```
1 import { useQuery } from '@tanstack/react-query';
2 export function Card({ id }) {
3   const q = useQuery({ queryKey: ['card', id], queryFn: () => fetch(`/c/${id}`) });
4   return <div>{q.data}</div>;
5 }
```
`List.tsx`:
```
1 import { Card } from './Card';
2 export function List() {
3   return <div><Card id={1} /><Card id={2} /><Card id={3} /></div>;
4 }
```

**Expected sites** (path relative to `cases/<case>/`; every other case expects none):

| Case | Site | Family |
|---|---|---|
| barrel-alias | `B.tsx:3:1:fetch` | `handler:apiClient>apiClient` |
| instance | `C.ts:4:1:fetch` | `other:axios>axios` |
| destructure | `D.ts:4:1:fetch` | `other:apiClient>apiClient` |
| two-level-wrapper | `E.ts:3:1:fetch` | `other:apiClient>apiClient` |
| two-level-wrapper | `E.ts:6:1:fetch` | `other:apiClient>apiClient` |
| wrong-in-use | `F.tsx:5:1:fetch` | `effect:apiClient>apiClient` |
| fed-reference | `G.tsx:4:1:fetch` | `query-hook:react-query>apiClient` |
| inline-nested | `H.tsx:3:1:fetch` | `query-hook:react-query>fetch` |
| two-on-a-line | `I.ts:2:1:fetch` | `other:fetch>fetch` |
| two-on-a-line | `I.ts:2:2:fetch` | `other:fetch>fetch` |
| split-chain | `K.ts:3:1:fetch` | `other:apiClient>apiClient` |
| component-render | `Card.tsx:3:1:fetch` | `query-hook:react-query>fetch` |

## Other languages

Translate every case into the target language before scanning, keeping the property its name states,
and recompute the expected IDs from the translated line numbers. Mark a case not applicable only with a
reason, and only when the construct cannot occur in the language (a language with no destructuring).
A case marked not applicable while the repo contains that construct fails the run.
