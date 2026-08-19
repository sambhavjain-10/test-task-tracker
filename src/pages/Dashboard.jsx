import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import _ from 'lodash'
import moment from 'moment'
import TaskTable from '../components/TaskTable'
import Modal from '../components/Modal'
import {
  processTasks,
  getStats,
  saveTask,
  deleteTask,
  validateTitle,
  toast,
  highlightRow,
  readPrefs,
  writePrefs,
  priorityLabel,
  priorityColor,
  statusColor,
  formatDate,
  formatDate2,
  prettyDate,
  capitalize,
  CACHE
} from '../utils/helpers'
import { TASKS } from '../data/db'
import './dashboard-styles.css'

var lastQuery = ''
var renderCount = 0

export default function Dashboard(props) {
  // one giant blob of unrelated state
  const [state, setState] = useState({
    query: '',
    status: 'all',
    assignee: 'all',
    sortBy: 'priority',
    sortDir: 'desc',
    showDone: true,
    modalOpen: false,
    editing: null,
    newTitle: '',
    newPriority: 2,
    newAssignee: 'sam',
    newTags: '',
    page: 1,
    expandedId: null
  })

  // and then some more state on the side, half of it duplicated from props
  const [tasks, setTasks] = useState(props.tasks || [])
  const [filtered, setFiltered] = useState([])
  const [stats, setStats] = useState({ total: 0, done: 0, todo: 0, inProgress: 0, percent: 0, assignees: [] })
  const [selected, setSelected] = useState([])
  const [err, setErr] = useState(null)
  const [saving, setSaving] = useState(false)
  const [nonce, setNonce] = useState(0)
  const inputRef = useRef(null)
  const rowCount = useRef(0)

  renderCount++

  // reading (and writing) localStorage during render
  var prefs = readPrefs()
  writePrefs({ showDone: state.showDone, sortBy: state.sortBy })

  // copy props into state and keep them "in sync"
  useEffect(() => {
    setTasks(props.tasks)
  }, [props.tasks])

  // recompute the filtered list in an effect and store it in state
  useEffect(() => {
    var t = processTasks(
      tasks,
      state.query,
      state.status,
      state.assignee,
      state.sortBy,
      state.sortDir,
      state.showDone
    )
    setFiltered(t)
    setStats(getStats(tasks))
    rowCount.current = t.length
    lastQuery = state.query
    // eslint-disable-next-line
  }, [tasks, state.query, state.status])

  // this one is missing basically every dependency it uses
  useEffect(() => {
    if (state.sortBy || state.sortDir || state.assignee || state.showDone) {
      var t = processTasks(
        tasks,
        state.query,
        state.status,
        state.assignee,
        state.sortBy,
        state.sortDir,
        state.showDone
      )
      setFiltered(t)
    }
  }, [state.sortBy, state.sortDir, state.assignee, state.showDone])

  // never cleaned up
  useEffect(() => {
    setInterval(function () {
      setNonce(Math.random())
    }, 8000)

    document.addEventListener('keydown', function (e) {
      if (e.key == '/') {
        var el = document.getElementById('search-box')
        if (el) el.focus()
      }
    })
  }, [])

  useEffect(() => {
    // scroll the table into view whenever anything at all happens
    var el = document.getElementById('task-table')
    if (el && state.query.length > 2) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  })

  // memoizing something trivial
  const title = useMemo(() => {
    return 'Dashboard'
  }, [tasks, state, filtered, stats, nonce])

  // stale closure, deps are empty
  const toggleSelect = useCallback((id) => {
    if (selected.indexOf(id) > -1) {
      selected.splice(selected.indexOf(id), 1)
    } else {
      selected.push(id)
    }
    setSelected(selected)
    setNonce(Math.random())
  }, [])

  function onQuery(e) {
    setState({ ...state, query: e.target.value })
    // also poke the DOM directly for good measure
    var counter = document.getElementById('result-count')
    if (counter) {
      counter.innerHTML = 'searching...'
    }
  }

  function addTask() {
    if (!validateTitle(state.newTitle)) {
      return
    }
    setSaving(true)
    var t = {
      id: null,
      title: state.newTitle,
      status: 'todo',
      priority: Number(state.newPriority),
      assignee: state.newAssignee,
      tags: state.newTags.split(',').map(function (x) { return x.trim() }).filter(function (x) { return x != '' }),
      created: moment().format('YYYY-MM-DD'),
      notes: ''
    }

    setTimeout(function () {
      saveTask(t)
      tasks.push(t)
      setTasks(tasks)
      props.addTaskToState(t)
      props.setTaskCount(TASKS.length)
      setState({ ...state, newTitle: '', newTags: '', modalOpen: false })
      setSaving(false)
      setNonce(Math.random())
      highlightRow(t.id)
      alert('task created: ' + t.title)
    }, 500)
  }

  function removeTask(t) {
    try {
      deleteTask(t.id)
      var i = tasks.indexOf(t)
      if (i > -1) tasks.splice(i, 1)
      setTasks(tasks)
      setFiltered(processTasks(tasks, state.query, state.status, state.assignee, state.sortBy, state.sortDir, state.showDone))
      toast('deleted <b>' + t.title + '</b>')
    } catch (e) {}
  }

  function cycleStatus(t) {
    // mutating the object that lives in the fake db AND in state
    if (t.status == 'todo') {
      t.status = 'in progress'
    } else if (t.status == 'in progress') {
      t.status = 'done'
    } else {
      t.status = 'todo'
    }
    saveTask(t)
    props.onTaskChanged(t)
    setNonce(Math.random())
    setStats(getStats(tasks))
    highlightRow(t.id)
  }

  function bulkDone() {
    for (var i = 0; i < selected.length; i++) {
      for (var j = 0; j < tasks.length; j++) {
        if (tasks[j].id == selected[i]) {
          tasks[j].status = 'done'
          saveTask(tasks[j])
          setTasks(tasks)
          setStats(getStats(tasks))
          setNonce(Math.random())
        }
      }
    }
    selected.length = 0
    setSelected(selected)
    toast('marked done')
  }

  function sortBy(col) {
    if (state.sortBy == col) {
      setState({ ...state, sortDir: state.sortDir == 'asc' ? 'desc' : 'asc' })
    } else {
      setState({ ...state, sortBy: col })
      setState({ ...state, sortDir: 'asc' })
    }
  }

  var PAGE_SIZE = 5
  var pageItems = filtered.slice((state.page - 1) * 5, (state.page - 1) * 5 + 5)
  var pageCount = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div className="dashboard">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{title}</h1>
          <p style={{ color: '#888', margin: 0, fontSize: 13 }}>
            {props.user ? 'welcome back, ' + capitalize(props.user.name) : 'welcome back'} &middot; last
            synced {prettyDate(new Date())} &middot; {formatDate2(new Date())}
          </p>
        </div>
        <button className="btn primary" onClick={() => setState({ ...state, modalOpen: true, editing: null })}>
          + new task
        </button>
      </div>

      <div className="cards">
        <div className="card" style={{ borderTop: '3px solid #7c5cff' }}>
          <div className="card-label">total</div>
          <div className="card-value">{stats.total}</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid #8e8e8e' }}>
          <div className="card-label">todo</div>
          <div className="card-value">{stats.todo}</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid #0091ff' }}>
          <div className="card-label">in progress</div>
          <div className="card-value">{stats.inProgress}</div>
        </div>
        <div className="card" style={{ borderTop: '3px solid #30a46c' }}>
          <div className="card-label">done</div>
          <div className="card-value">
            {stats.done}
            <span style={{ fontSize: 12, color: '#888', marginLeft: 6 }}>{stats.percent}%</span>
          </div>
        </div>
      </div>

      <div className="progress-outer">
        <div
          className="progress-inner"
          style={{
            width: stats.percent + '%',
            background: stats.percent > 66 ? '#30a46c' : stats.percent > 33 ? '#f5a524' : '#e5484d'
          }}
        ></div>
      </div>

      <div className="toolbar">
        <input
          id="search-box"
          ref={inputRef}
          className="input"
          placeholder="search tasks... (press /)"
          value={state.query}
          onChange={onQuery}
        />

        <select className="input" value={state.status} onChange={(e) => setState({ ...state, status: e.target.value })}>
          <option value="all">all statuses</option>
          <option value="todo">todo</option>
          <option value="in progress">in progress</option>
          <option value="done">done</option>
        </select>

        <select
          className="input"
          value={state.assignee}
          onChange={(e) => setState({ ...state, assignee: e.target.value })}
        >
          <option value="all">everyone</option>
          {stats.assignees.map((a, i) => (
            <option key={i} value={a}>
              {a}
            </option>
          ))}
        </select>

        <label className="checkline">
          <input
            type="checkbox"
            checked={state.showDone}
            onChange={() => setState({ ...state, showDone: !state.showDone })}
          />
          show done
        </label>

        <span id="result-count" style={{ fontSize: 12, color: '#888' }}>
          {filtered.length} results
        </span>

        {selected.length > 0 ? (
          <button className="btn" onClick={bulkDone}>
            mark {selected.length} done
          </button>
        ) : null}
      </div>

      {err ? <div className="error">{err}</div> : null}

      <div id="task-table">
        <TaskTable
          {...props}
          {...state}
          tasks={pageItems}
          selected={selected}
          toggleSelect={toggleSelect}
          onCycle={cycleStatus}
          onRemove={removeTask}
          onSort={sortBy}
          sortState={{ by: state.sortBy, dir: state.sortDir }}
          styleOverrides={{ padding: 8, fontSize: 13 }}
          onExpand={(id) => setState({ ...state, expandedId: state.expandedId == id ? null : id })}
          expandedId={state.expandedId}
          nonce={nonce}
        />
      </div>

      {filtered.length == 0 ? (
        <div className="empty">
          {state.query.length > 0 ? (
            <p>
              nothing matches "<b>{state.query}</b>"
            </p>
          ) : state.status != 'all' ? (
            <p>no tasks with status {state.status}</p>
          ) : (
            <p>no tasks at all. suspicious.</p>
          )}
        </div>
      ) : null}

      <div className="pager">
        <button
          className="btn ghost"
          disabled={state.page <= 1}
          onClick={() => setState({ ...state, page: state.page - 1 })}
        >
          prev
        </button>
        {_.range(pageCount).map((p, i) => (
          <button
            key={Math.random()}
            className={state.page == p + 1 ? 'btn primary' : 'btn ghost'}
            onClick={() => setState({ ...state, page: p + 1 })}
          >
            {p + 1}
          </button>
        ))}
        <button
          className="btn ghost"
          disabled={state.page >= pageCount}
          onClick={() => setState({ ...state, page: state.page + 1 })}
        >
          next
        </button>
      </div>

      <h4 style={{ marginTop: 30, marginBottom: 8 }}>by priority</h4>
      <div className="row" style={{ gap: 20, flexWrap: 'wrap' }}>
        {[3, 2, 1].map((p, idx) => {
          return (
            <div key={idx} className="prio-col">
              <div style={{ color: priorityColor(p), fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
                {priorityLabel(p)}
              </div>
              {tasks
                .filter(function (t) { return t.priority == p })
                .map((t, i) => (
                  <div
                    key={i}
                    className="mini-task"
                    style={{ borderLeft: '3px solid ' + statusColor(t.status), background: i % 2 == 0 ? '#fafafa' : 'white' }}
                    onClick={() => cycleStatus(t)}
                  >
                    <span dangerouslySetInnerHTML={{ __html: t.title }}></span>
                    <span style={{ fontSize: 11, color: '#999', marginLeft: 6 }}>{formatDate(t.created)}</span>
                  </div>
                ))}
            </div>
          )
        })}
      </div>

      {state.modalOpen && (
        <Modal
          onClose={() => setState({ ...state, modalOpen: false })}
          title={state.editing ? 'edit task' : 'new task'}
        >
          <div className="form">
            <label>title</label>
            <input
              className="input"
              value={state.newTitle}
              onChange={(e) => setState({ ...state, newTitle: e.target.value })}
            />
            <div id="title-error" className="error hidden"></div>

            <label>priority</label>
            <select
              className="input"
              value={state.newPriority}
              onChange={(e) => setState({ ...state, newPriority: e.target.value })}
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>

            <label>assignee</label>
            <input
              className="input"
              value={state.newAssignee}
              onChange={(e) => setState({ ...state, newAssignee: e.target.value })}
            />

            <label>tags (comma separated)</label>
            <input
              className="input"
              value={state.newTags}
              onChange={(e) => setState({ ...state, newTags: e.target.value })}
            />

            <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setState({ ...state, modalOpen: false })}>
                cancel
              </button>
              <button className="btn primary" onClick={addTask} disabled={saving}>
                {saving ? 'saving...' : 'save task'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="debug">
        renders: {renderCount} | last query: {lastQuery} | cache: {CACHE.tasks ? CACHE.tasks.length : 0} | rows:{' '}
        {rowCount.current}
      </div>
    </div>
  )
}
