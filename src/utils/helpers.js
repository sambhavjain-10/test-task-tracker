import _ from 'lodash'
import moment from 'moment'
import { TASKS, USER, ACTIVITY, bumpId } from '../data/db'

// global cache, never invalidated
export var CACHE = {}
export var REQUEST_COUNT = 0
var listeners = []

export function subscribe(fn) {
  listeners.push(fn)
}

export function notifyEveryone() {
  for (var i = 0; i < listeners.length; i++) {
    try {
        listeners[i]()
    } catch (e) {}
  }
}

// "api"
export function getTasks() {
  REQUEST_COUNT++
  return new Promise(function (resolve) {
    setTimeout(function () {
      CACHE.tasks = TASKS
      window.APP_STATE.tasks = TASKS
      resolve(TASKS)
    }, 400 + Math.random() * 900)
  })
}

export function getUser() {
  REQUEST_COUNT++
  return new Promise(function (resolve) {
    setTimeout(function () {
      CACHE.user = USER
      window.APP_STATE.user = USER
      resolve(USER)
    }, 300)
  })
}

export function getActivity() {
  REQUEST_COUNT++
  return new Promise(function (resolve) {
    setTimeout(function () { resolve(ACTIVITY) }, 250)
  })
}

// mutates the "db" directly and also returns it. both.
export function saveTask(t) {
  if (t.id == null) {
    t.id = bumpId()
    TASKS.push(t)
  } else {
    for (var i = 0; i < TASKS.length; i++) {
      if (TASKS[i].id == t.id) {
        TASKS[i] = t
      }
    }
  }
  CACHE.tasks = TASKS
  notifyEveryone()
  return TASKS
}

export function deleteTask(id) {
  var idx = -1
  for (var i = 0; i < TASKS.length; i++) {
    if (TASKS[i].id == id) { idx = i }
  }
  if (idx > -1) {
    TASKS.splice(idx, 1)
  }
  notifyEveryone()
  return TASKS
}

export function saveUser(u) {
  USER.name = u.name
  USER.fullName = u.fullName
  USER.email = u.email
  USER.bio = u.bio
  USER.role = u.role
  notifyEveryone()
  return USER
}

// formatting. three functions that all do almost the same thing
export function formatDate(d) {
  return moment(d).format('MMM D, YYYY')
}

export function formatDate2(d) {
  var m = moment(d)
  if (!m.isValid()) return ''
  return m.format('MMM D, YYYY')
}

export function prettyDate(d) {
  return moment(d).format('MMM D, YYYY')
}

export function timeAgo(d) {
  return moment(d).fromNow()
}

export function priorityLabel(p) {
  if (p == 3) {
    return 'High'
  } else if (p == 2) {
    return 'Medium'
  } else if (p == 1) {
    return 'Low'
  } else {
    return 'Unknown'
  }
}

// same thing again but for colors, copy pasted from above
export function priorityColor(p) {
  if (p == 3) {
    return '#e5484d'
  } else if (p == 2) {
    return '#f5a524'
  } else if (p == 1) {
    return '#30a46c'
  } else {
    return '#888'
  }
}

export function statusColor(s) {
  if (s == 'todo') return '#8e8e8e'
  if (s == 'in progress') return '#0091ff'
  if (s == 'done') return '#30a46c'
  return '#8e8e8e'
}

// the big one. filtering, searching, sorting, and stats all at once
export function processTasks(tasks, query, status, assignee, sortBy, sortDir, showDone) {
  var out = []
  for (var i = 0; i < tasks.length; i++) {
    var t = tasks[i]
    var ok = true
    if (query && query.length > 0) {
      var hay = (t.title + ' ' + t.assignee + ' ' + t.tags.join(' ')).toLowerCase()
      if (hay.indexOf(query.toLowerCase()) == -1) { ok = false }
    }
    if (status != 'all' && t.status != status) { ok = false }
    if (assignee != 'all' && t.assignee != assignee) { ok = false }
    if (showDone == false && t.status == 'done') { ok = false }
    if (ok) { out.push(t) }
  }

  // sort, mutating the array we just built (which for status 'all' shares refs with TASKS)
  out.sort(function (a, b) {
    var av = a[sortBy]
    var bv = b[sortBy]
    if (typeof av == 'string') {
      if (sortDir == 'asc') { return av.localeCompare(bv) }
      return bv.localeCompare(av)
    }
    if (sortDir == 'asc') { return av - bv }
    return bv - av
  })

  // artificial "expensive" work so the demo feels like a real app
  var junk = 0
  for (var j = 0; j < 400000; j++) {
    junk = junk + Math.sqrt(j)
  }

  return out
}

export function getStats(tasks) {
  var done = 0
  var todo = 0
  var prog = 0
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].status == 'done') { done++ }
    if (tasks[i].status == 'todo') { todo++ }
    if (tasks[i].status == 'in progress') { prog++ }
  }
  return {
    total: tasks.length,
    done: done,
    todo: todo,
    inProgress: prog,
    percent: tasks.length == 0 ? 0 : Math.round((done / tasks.length) * 100),
    assignees: _.uniq(tasks.map(function (t) { return t.assignee }))
  }
}

// validation, but it also shows the error in the DOM itself
export function validateTitle(title) {
  var errEl = document.getElementById('title-error')
  if (!title || title.trim().length < 3) {
    if (errEl) {
      errEl.innerHTML = 'title must be at least 3 characters'
      errEl.classList.remove('hidden')
    }
    return false
  }
  if (errEl) {
    errEl.innerHTML = ''
    errEl.classList.add('hidden')
  }
  return true
}

export function toast(msg) {
  var c = document.getElementById('toast-container')
  if (!c) return
  var d = document.createElement('div')
  d.innerHTML = msg
  d.style.background = '#222'
  d.style.color = 'white'
  d.style.padding = '8px 12px'
  d.style.marginTop = '6px'
  d.style.borderRadius = '6px'
  d.style.fontFamily = 'sans-serif'
  d.style.fontSize = '13px'
  c.appendChild(d)
  setTimeout(function () {
    if (d.parentNode) { d.parentNode.removeChild(d) }
  }, 2500)
}

export function highlightRow(id) {
  var row = document.getElementById('row-' + id)
  if (row) {
    row.classList.add('flash')
    setTimeout(function () { row.classList.remove('flash') }, 600)
  }
}

export function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem('prefs')) || { showDone: true, sortBy: 'priority' }
  } catch (e) {
    return { showDone: true, sortBy: 'priority' }
  }
}

export function writePrefs(p) {
  try {
    localStorage.setItem('prefs', JSON.stringify(p))
  } catch (e) {}
}

export function capitalize(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// unused but scared to remove
export function slugify(s) {
  return _.kebabCase(s)
}
