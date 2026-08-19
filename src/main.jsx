import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// keep a handle on everything so we can poke at it from the console
window.APP_STATE = { user: null, tasks: [], lastRender: null, renderCount: 0 }
window.APP_VERSION = "1.0.0"

console.log('booting app', window.APP_VERSION)

document.title = 'task tracker - ' + window.APP_VERSION

var el = document.getElementById('root')

ReactDOM.createRoot(el).render(<App />)

// tiny hack so the tab title shows how many tasks there are
setInterval(function () {
  if (window.APP_STATE.tasks.length > 0) {
    document.title = 'task tracker (' + window.APP_STATE.tasks.length + ')'
  }
}, 1000)
