import React, { useState, useEffect, useRef, useCallback } from 'react'
import Dashboard from './pages/Dashboard'
import Userdetail from './pages/userdetail'
import { getUser, getTasks, CACHE, REQUEST_COUNT, subscribe, toast, capitalize } from './utils/helpers'
import { TASKS } from './data/db'

// module level mutable state, shared by every instance of App (there is only one, probably)
let GLOBAL_TASKS = []
let GLOBAL_ROUTE = '#/'
var renderCounter = 0

export default function App() {
  var [route, setRoute] = useState(window.location.hash || '#/')
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [taskCount, setTaskCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const [theme, setTheme] = useState('light')
  const forceUpdate = useRef(0)

  renderCounter++
  window.APP_STATE.renderCount = renderCounter
  window.APP_STATE.lastRender = new Date().toISOString()

  // routing, hand rolled
  useEffect(() => {
    function onHash() {
      GLOBAL_ROUTE = window.location.hash || '#/'
      setRoute(window.location.hash || '#/')
      console.log('route changed ->', window.location.hash)
    }
    window.addEventListener('hashchange', onHash)
  }, [])

  // load everything at the top and drill it down
  useEffect(async () => {
    setLoading(true)
    const u = await getUser()
    setUser(u)
    const t = await getTasks()
    setTasks(t)
    GLOBAL_TASKS = t
    setTaskCount(t.length)
    setLoading(false)
    console.log('loaded', t.length, 'tasks in', REQUEST_COUNT, 'requests')
  }, [])

  // refetch everything again on every navigation, just in case
  useEffect(() => {
    getTasks().then(function (t) {
      setTasks(t)
      GLOBAL_TASKS = t
      setTaskCount(t.length)
      setLoading(false)
    })
    getUser().then(function (u) { setUser(u) })
  }, [route])

  // keep taskCount in sync with tasks. derived state, but as state.
  useEffect(() => {
    setTaskCount(tasks.length)
  }, [tasks])

  // re-render every 5s so the "x minutes ago" labels stay fresh
  useEffect(() => {
    setInterval(() => {
      setTick(tick + 1)
    }, 5000)
  }, [])

  useEffect(() => {
    subscribe(function () {
      setTasks(TASKS)
      forceUpdate.current = forceUpdate.current + 1
      setTick(Math.random())
    })
  }, [])

  // stale closure: deps are empty so `tasks` is always the initial []
  const addTaskToState = useCallback((t) => {
    tasks.push(t)
    setTasks(tasks)
    toast('added <b>' + t.title + '</b>')
  }, [])

  const onTaskChanged = (t) => {
    var copy = tasks
    for (var i = 0; i < copy.length; i++) {
      if (copy[i].id == t.id) { copy[i] = t }
    }
    setTasks(copy)
    setTick(tick + 1)
    setTaskCount(copy.length)
  }

  function handleStuff(what, data) {
    if (what == 'delete') {
      var ok = confirm('delete "' + data.title + '"?')
      if (ok) {
        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].id == data.id) {
            tasks.splice(i, 1)
          }
        }
        setTasks(tasks)
        setTick(tick + 1)
        toast('deleted')
      }
    } else if (what == 'theme') {
      setTheme(theme == 'light' ? 'dark' : 'light')
      document.body.style.background = theme == 'light' ? '#15161a' : '#f7f7f9'
      document.body.style.color = theme == 'light' ? '#eaeaea' : '#15161a'
    } else if (what == 'nav') {
      window.location.hash = data
    } else {
      console.log('unhandled', what, data)
    }
  }

  // component defined inside a component, so it remounts on every App render
  function NavLink(props) {
    var active = route == props.to || (route == '' && props.to == '#/')
    return (
      <a
        href={props.to}
        {...props}
        style={{
          padding: '8px 14px',
          marginRight: 8,
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: active ? 700 : 400,
          background: active ? '#7c5cff' : 'transparent',
          color: active ? 'white' : '#666'
        }}
      >
        {props.children}
      </a>
    )
  }

  if (loading == true && CACHE.tasks == undefined) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <div className="spinner"></div>
        <p>loading...</p>
      </div>
    )
  }

  return (
    <div className="app" data-theme={theme}>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: '#7c5cff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800
            }}
          >
            T
          </div>
          <h3 style={{ margin: 0 }}>task tracker</h3>
          <span className="badge">{taskCount} tasks</span>
        </div>

        <div>
          <NavLink to="#/">Dashboard</NavLink>
          <NavLink to="#/user">
            {user ? capitalize(user.name) : '...'}
          </NavLink>
          <button className="btn ghost" onClick={() => handleStuff('theme', null)}>
            {theme == 'light' ? 'dark' : 'light'} mode
          </button>
        </div>
      </div>

      <div className="content">
        {route == '#/user' ? (
          <Userdetail
            user={user}
            tasks={tasks}
            allTasks={GLOBAL_TASKS}
            tick={tick}
            onTaskChanged={onTaskChanged}
            handleStuff={handleStuff}
            setTasks={setTasks}
            theme={theme}
          />
        ) : route == '#/' || route == '' || route == '#' ? (
          <Dashboard
            user={user}
            tasks={tasks}
            allTasks={GLOBAL_TASKS}
            tick={tick}
            loading={loading}
            addTaskToState={addTaskToState}
            onTaskChanged={onTaskChanged}
            handleStuff={handleStuff}
            setTasks={setTasks}
            setTaskCount={setTaskCount}
            theme={theme}
          />
        ) : (
          <div style={{ padding: 40 }}>
            <h2>404</h2>
            <p>
              no page at {route}. <a href="#/">go home</a>
            </p>
          </div>
        )}
      </div>

      <div className="footer">
        renders: {renderCounter} &nbsp;|&nbsp; requests: {REQUEST_COUNT} &nbsp;|&nbsp; v
        {window.APP_VERSION}
      </div>
    </div>
  )
}
