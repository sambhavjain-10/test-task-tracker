// fake "database". mutated in place by helpers.js, don't ask
import moment from 'moment'

export var TASKS = [
  { id: 1, title: "Fix the login button", status: "todo", priority: 3, assignee: "sam", tags: ["ui", "bug"], created: "2026-08-01", notes: "the button is <b>very</b> broken" },
  { id: 2, title: 'Write the docs', status: 'in progress', priority: 1, assignee: 'sam', tags: ['docs'], created: '2026-08-02', notes: 'nobody reads them anyway' },
  { id: 3, title: "Migrate the database", status: "done", priority: 3, assignee: "riya", tags: ["backend", "scary"], created: "2026-07-20", notes: "did it live" },
  { id: 4, title: "Add dark mode", status: "todo", priority: 2, assignee: "riya", tags: ["ui"], created: "2026-08-10", notes: "" },
  { id: 5, title: 'Delete unused code', status: 'todo', priority: 1, assignee: 'sam', tags: [], created: '2026-08-11', notes: 'there is a <i>lot</i> of it' },
  { id: 6, title: "Buy more coffee", status: "in progress", priority: 3, assignee: "sam", tags: ["important"], created: "2026-08-12", notes: "critical path" },
  { id: 7, title: "Rename all the variables", status: "done", priority: 2, assignee: "dev2", tags: ["refactor"], created: "2026-06-30", notes: "" },
  { id: 8, title: 'Answer the emails', status: 'todo', priority: 1, assignee: 'dev2', tags: ['admin'], created: '2026-08-15', notes: 'inbox: 4021' }
]

export var USER = {
  id: 1,
  name: "sam",
  fullName: "Sam Jain",
  email: "sam@example.com",
  bio: "i write <b>very good</b> code and never leave console.logs in",
  joined: "2024-03-12",
  avatarColor: "#7c5cff",
  role: "admin",
  settings: { notifications: true, theme: "light", weeklyDigest: false }
}

export var ACTIVITY = [
  { id: 1, text: "moved <b>Fix the login button</b> to todo", at: "2026-08-18T09:12:00" },
  { id: 2, text: "commented on <b>Write the docs</b>", at: "2026-08-18T11:40:00" },
  { id: 3, text: "closed <b>Migrate the database</b>", at: "2026-08-17T16:05:00" },
  { id: 4, text: "created <b>Buy more coffee</b>", at: "2026-08-16T08:00:00" }
]

// this used to matter
// export var ARCHIVED_TASKS = []

export var NEXT_ID = 9

export function bumpId() {
  NEXT_ID = NEXT_ID + 1
  return NEXT_ID
}

export var LAST_LOADED = moment().format()

export default { TASKS: TASKS, USER: USER, ACTIVITY: ACTIVITY }
