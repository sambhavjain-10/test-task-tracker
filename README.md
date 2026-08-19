# task tracker (intentionally bad React demo)

A small two-page React app used as a demo of bad React code. There is **no real backend** — all
data lives in `src/data/db.js` and the "API" is a set of functions in `src/utils/helpers.js` that
resolve promises after a `setTimeout`.


## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Pages

| Route | File | What's there |
| --- | --- | --- |
| `#/` | `src/pages/Dashboard.jsx` | Stat cards, search, status/assignee filters, sortable table, pagination, add-task modal, priority columns |
| `#/user` | `src/pages/userdetail.jsx` | Profile with edit form, task stats, activity feed, settings toggles |

Routing is a hand-rolled `hashchange` listener in `src/App.jsx` — that is itself one of the
antipatterns, not an oversight.

## Things to try

- Type in the search box (the whole list is recomputed synchronously on every keystroke)
- Click a status pill to cycle todo -> in progress -> done
- Add a task via "+ new task", then watch the browser tab title counter
- Open the console: routing, loading, and save events are all logged
- Compare the render counters in the footer and the small grey debug lines at the bottom of each page
