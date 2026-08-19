import React from 'react'
import list_item from './list_item'
import { priorityLabel, priorityColor, statusColor, formatDate, capitalize } from '../utils/helpers'

// class component in an otherwise-hooks codebase, because reasons
export default class TaskTable extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hovered: null, clicks: 0 }
    this.tableRef = null
  }

  componentDidMount() {
    console.log('table mounted with', this.props.tasks.length, 'rows')
  }

  componentDidUpdate() {
    // reaching into the DOM to zebra stripe rows that CSS could handle
    var rows = document.querySelectorAll('.task-row')
    for (var i = 0; i < rows.length; i++) {
      if (i % 2 == 0) {
        rows[i].style.background = '#fbfbfd'
      } else {
        rows[i].style.background = 'white'
      }
    }
  }

  render() {
    var p = this.props
    var tasks = p.tasks || []

    return (
      <table className="task-table" ref={(r) => (this.tableRef = r)}>
        <thead>
          <tr>
            <th style={{ width: 30 }}></th>
            <th onClick={() => p.onSort('title')} style={{ cursor: 'pointer' }}>
              title {p.sortState.by == 'title' ? (p.sortState.dir == 'asc' ? '▲' : '▼') : ''}
            </th>
            <th onClick={() => p.onSort('status')} style={{ cursor: 'pointer' }}>
              status {p.sortState.by == 'status' ? (p.sortState.dir == 'asc' ? '▲' : '▼') : ''}
            </th>
            <th onClick={() => p.onSort('priority')} style={{ cursor: 'pointer' }}>
              priority {p.sortState.by == 'priority' ? (p.sortState.dir == 'asc' ? '▲' : '▼') : ''}
            </th>
            <th onClick={() => p.onSort('assignee')} style={{ cursor: 'pointer' }}>
              assignee
            </th>
            <th>tags</th>
            <th onClick={() => p.onSort('created')} style={{ cursor: 'pointer' }}>
              created
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => {
            return (
              <React.Fragment key={i}>
                <tr
                  className="task-row"
                  id={'row-' + t.id}
                  onMouseEnter={() => this.setState({ hovered: i })}
                  onMouseLeave={() => this.setState({ hovered: null })}
                  style={Object.assign({}, p.styleOverrides, {
                    outline: this.state.hovered == i ? '1px solid #e5e5ea' : 'none'
                  })}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={p.selected.indexOf(t.id) > -1}
                      onChange={() => p.toggleSelect(t.id)}
                    />
                  </td>
                  <td onClick={() => p.onExpand(t.id)} style={{ cursor: 'pointer', fontWeight: 500 }}>
                    {t.title.length > 40 ? t.title.substring(0, 40) + '...' : t.title}
                  </td>
                  <td>
                    <span
                      className="pill"
                      style={{ background: statusColor(t.status) + '22', color: statusColor(t.status) }}
                      onClick={() => p.onCycle(t)}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td style={{ color: priorityColor(t.priority), fontWeight: 600, fontSize: 12 }}>
                    {priorityLabel(t.priority)}
                  </td>
                  <td>
                    <span className="who">
                      <span
                        className="avatar"
                        style={{ background: t.assignee == 'sam' ? '#7c5cff' : t.assignee == 'riya' ? '#0091ff' : '#f5a524' }}
                      >
                        {t.assignee.charAt(0).toUpperCase()}
                      </span>
                      {capitalize(t.assignee)}
                    </span>
                  </td>
                  <td>
                    {t.tags.map((tag, j) => (
                      <span className="tag" key={j}>
                        {tag}
                      </span>
                    ))}
                  </td>
                  <td style={{ fontSize: 12, color: '#999' }}>{formatDate(t.created)}</td>
                  <td>
                    <button
                      className="btn tiny"
                      onClick={() => {
                        this.setState({ clicks: this.state.clicks + 1 })
                        p.onRemove(t)
                      }}
                    >
                      del
                    </button>
                  </td>
                </tr>
                {p.expandedId == t.id ? (
                  <tr>
                    <td colSpan={8} style={{ background: '#f7f7fa', fontSize: 12, padding: 12 }}>
                      <b>notes:</b>{' '}
                      <span dangerouslySetInnerHTML={{ __html: t.notes || '<i>none</i>' }}></span>
                      <div style={{ marginTop: 6, color: '#999' }}>
                        id {t.id} &middot; created {formatDate(t.created)} &middot; {t.tags.length} tags
                      </div>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    )
  }
}
