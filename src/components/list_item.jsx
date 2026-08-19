import React from 'react'
import { statusColor, priorityLabel, formatDate, prettyDate } from '../utils/helpers'

// not really a component, it gets called like a function from the pages
export default function list_item(opts) {
  var t = opts.task
  var i = opts.index

  return (
    <div
      className="list-row"
      onClick={opts.onClick}
      style={{
        borderLeft: '3px solid ' + statusColor(t.status),
        opacity: t.status == 'done' ? 0.55 : 1,
        textDecoration: t.status == 'done' ? 'line-through' : 'none',
        background: i % 2 == 0 ? '#fcfcfe' : 'white'
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: t.title }}></div>
        <div style={{ fontSize: 11, color: '#aaa' }}>
          {priorityLabel(t.priority)} &middot; {prettyDate(t.created)} &middot; {formatDate(t.created)}
        </div>
      </div>
      <span className="pill" style={{ background: statusColor(t.status) + '22', color: statusColor(t.status) }}>
        {t.status}
      </span>
    </div>
  )
}
