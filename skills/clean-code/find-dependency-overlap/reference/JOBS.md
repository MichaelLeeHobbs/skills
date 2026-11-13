# Seed jobs and the mapping pass

## Seed taxonomy

On a first run, write these as `job` records and into the catalog's `jobs.jsonl`. IDs are permanent.
Add a job only when a package fits none; give it the next free ID and never renumber. Jobs marked
*tooling* normally hold development dependencies.

| ID | Job | Typical primaries |
|---|---|---|
| J01 | date and time arithmetic and formatting | moment, luxon, dayjs, date-fns, arrow, pendulum |
| J02 | HTTP client | axios, ky, got, superagent, requests, httpx, aiohttp client |
| J03 | HTTP server framework | express, fastify, koa, flask, fastapi, django |
| J04 | schema validation and parsing | zod, yup, joi, ajv, valibot, pydantic, marshmallow, cerberus |
| J05 | settings and configuration loading | dotenv, convict, pydantic-settings, dynaconf |
| J06 | form state | react-hook-form, formik, final-form |
| J07 | application state store | redux, zustand, mobx, jotai, recoil, pinia, vuex |
| J08 | server-state cache and data fetching | @tanstack/react-query, swr, apollo client, urql |
| J09 | charts | chart.js, recharts, echarts, highcharts, victory, nivo, plotly |
| J10 | low-level visualisation scales and shapes | d3 modules used for scales, shapes, geo |
| J11 | utility belt (collections, objects, functions) | lodash, lodash-es, underscore, ramda, remeda, toolz |
| J12 | unique ID generation | uuid, nanoid, cuid, shortid |
| J13 | CSS-in-JS and styling runtime | styled-components, emotion, stitches, jss |
| J14 | UI component kit | mui, antd, chakra, mantine, bootstrap components |
| J15 | icons | react-icons, lucide, heroicons, font-awesome packages |
| J16 | routing | react-router, wouter, tanstack router, vue-router |
| J17 | internationalisation and message formatting | i18next, react-intl, formatjs, lingui, babel (python) |
| J18 | number and currency formatting | numeral, accounting, big.js formatting, babel.numbers |
| J19 | arbitrary-precision decimals | decimal.js, big.js, bignumber.js |
| J20 | markdown rendering | marked, markdown-it, remark, react-markdown, markdown (python) |
| J21 | HTML sanitising | dompurify, sanitize-html, bleach, nh3 |
| J22 | logging | winston, pino, bunyan, loguru, structlog |
| J23 | promise and async utilities | bluebird, p-limit, async, p-queue |
| J24 | date pickers and calendar widgets | react-datepicker, react-day-picker, flatpickr |
| J25 | CSV and spreadsheet parsing | papaparse, csv-parse, xlsx, openpyxl |
| J26 | ORM and query builder | prisma, typeorm, sequelize, knex, drizzle, sqlalchemy, peewee |
| J27 | task queues and job scheduling | bull, bullmq, agenda, celery, rq, dramatiq |
| J28 | test runner *tooling* | jest, vitest, mocha, ava, pytest, unittest helpers |
| J29 | end-to-end browser testing *tooling* | playwright, cypress, puppeteer, selenium |
| J30 | linting and formatting *tooling* | eslint, prettier, biome, ruff, black, flake8 |
| J31 | bundler and build *tooling* | webpack, vite, rollup, esbuild, parcel, turbopack |

Close pairs that are separate jobs, so they never form a false family: J04 and J05; J02 and J03; J04 and
J06; J01 and J24; J09 and J10; J18 and J19. A package that genuinely does two jobs gets one `map` per job.

## The mapping pass

Give the most capable model, in one context, the job list with each job's one-line definition and, per
package: name, version, installed description, keywords, the first 300 characters of the README, and
for a package that does several jobs, the members the repo imports from it (from the extractor). Fold
`@types/x` into the `types` role with `extends` set to `x` without asking. Ask for one JSON line per map:
`package`, `job`, `role`, `extends`.

Roles:
- `primary`: does the job itself.
- `complement`: adds to one named primary and is useless without it (moment-timezone extends moment,
  date-fns-tz extends date-fns, a dayjs plugin extends dayjs).
- `adapter`: binds one named primary to a framework or another library (react-chartjs-2 extends chart.js,
  chartjs-adapter-moment extends moment).
- `types`: type declarations only.

A package that fits no job and has no overlap risk (a framework, a polyfill) still needs a map: give it
its own job (append one) as `primary`. Every declared package must be mapped, or `families` reports it.

Save the result as `map` records, merge it into `packages.jsonl`, and run `families`. Review any package
the pass mapped to a job ID you did not give it: that is `unknown_job`, fixed by appending the job or
remapping, never by deleting the map.
