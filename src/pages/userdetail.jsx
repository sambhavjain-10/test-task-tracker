import React, { useState, useEffect, useRef } from 'react'
import moment from 'moment'
import _ from 'lodash'
import { getActivity, getStats, saveUser, timeAgo, formatDate, toast, statusColor, capitalize } from '../utils/helpers'
import { USER, TASKS } from '../data/db'
import list_item from '../components/list_item'

var editCount = 0

function Userdetail(props) {
    // props copied into state on mount only, so they go stale
    const [name, setName] = useState(props.user ? props.user.name : '')
    const [fullName, setFullName] = useState(props.user ? props.user.fullName : '')
    const [bio, setBio] = useState(props.user ? props.user.bio : '')
    const [role, setRole] = useState(props.user ? props.user.role : 'admin')
    const [editing, setEditing] = useState(false)
    const [activity, setActivity] = useState([])
    const [data, setData] = useState(null)
    const [data2, setData2] = useState([])
    const [temp, setTemp] = useState(0)
    const [flag, setFlag] = useState(false)
    const emailRef = useRef(null)
    const [now, setNow] = useState(moment().format())

    editCount++

    useEffect(() => {
        getActivity().then(function (a) {
            setActivity(a)
            setData(a)
            setData2(a.slice(0, 3))
        })
    }, [props.tick, props.user, props.tasks, activity])

    // interval with no cleanup, one per mount, forever
    useEffect(() => {
        setInterval(function () {
            setNow(moment().format())
            setTemp(temp + 1)
        }, 3000)
    }, [])

    // mutating props directly
    useEffect(() => {
        if (props.user) {
            props.user.lastSeen = new Date().toISOString()
            props.user.viewCount = (props.user.viewCount || 0) + 1
        }
    })

    if (!props.user) {
        return <div style={{ padding: 40 }}>loading user...</div>
    }

    var stats = getStats(props.tasks && props.tasks.length ? props.tasks : TASKS)
    var mine = (props.tasks || TASKS).filter(function (t) { return t.assignee == props.user.name })

    function save() {
        // mutate the global user object, then also set local state, then also alert
        USER.name = name
        USER.fullName = fullName
        saveUser({ name: name, fullName: fullName, email: emailRef.current.value, bio: bio, role: role })
        props.user.name = name
        props.user.bio = bio
        setEditing(false)
        setFlag(!flag)
        toast('profile saved')
        alert('saved!')
        console.log('saved user', USER)
    }

    function cancel() {
        setName(props.user.name)
        setFullName(props.user.fullName)
        setBio(props.user.bio)
        setEditing(false)
        var el = document.querySelector('.profile-card')
        if (el) {
            el.classList.add('flash')
            setTimeout(function () { el.classList.remove('flash') }, 600)
        }
    }

    function nukeDoneTasks() {
        var ok = confirm('remove all done tasks?')
        if (ok) {
            for (var i = 0; i < TASKS.length; i++) {
                if (TASKS[i] && TASKS[i].status == 'done') {
                    TASKS.splice(i, 1)
                }
            }
            props.setTasks(TASKS)
            toast('cleaned up')
        }
    }

    return (
        <div className="userpage">
            <a href="#/" style={{ fontSize: 13, color: '#7c5cff', textDecoration: 'none' }}>&larr; back to dashboard</a>

            <div className="profile-card">
                <div
                    className="avatar"
                    style={{ background: props.user.avatarColor, width: 64, height: 64, fontSize: 26 }}
                >
                    {props.user.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                    {editing == true ? (
                        <div className="form">
                            <label>username</label>
                            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                            <label>full name</label>
                            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            <label>email</label>
                            <input className="input" defaultValue={props.user.email} ref={emailRef} />
                            <label>role</label>
                            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="admin">admin</option>
                                <option value="member">member</option>
                                <option value="viewer">viewer</option>
                            </select>
                            <label>bio (html allowed lol)</label>
                            <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
                            <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                                <button className="btn ghost" onClick={cancel}>cancel</button>
                                <button className="btn primary" onClick={save}>save</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ margin: 0 }}>{props.user.fullName}</h2>
                            <p style={{ margin: '2px 0', color: '#888', fontSize: 13 }}>
                                @{props.user.name} &middot; {props.user.email} &middot;{' '}
                                <span className="badge">{props.user.role}</span>
                            </p>
                            <p
                                style={{ fontSize: 13, marginTop: 10 }}
                                dangerouslySetInnerHTML={{ __html: props.user.bio }}
                            ></p>
                            <p style={{ fontSize: 12, color: '#aaa' }}>
                                joined {formatDate(props.user.joined)} &middot; viewed {props.user.viewCount || 1} times
                                &middot; clock: {moment(now).format('HH:mm:ss')}
                            </p>
                            <button className="btn" onClick={() => setEditing(true)}>edit profile</button>
                            <button className="btn ghost" onClick={nukeDoneTasks}>clear done tasks</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="two-col">
                <div>
                    <h4>my tasks ({mine.length})</h4>
                    <div className="list">
                        {mine.length > 0
                            ? mine.map((t, i) =>
                                  list_item({
                                      task: t,
                                      index: i,
                                      onClick: function () {
                                          t.status = t.status == 'done' ? 'todo' : 'done'
                                          props.onTaskChanged(t)
                                          toast('toggled')
                                      }
                                  })
                              )
                            : <p style={{ color: '#999', fontSize: 13 }}>nothing assigned. lucky.</p>}
                    </div>

                    <h4 style={{ marginTop: 24 }}>stats</h4>
                    <table className="stats-table">
                        <tbody>
                            <tr><td>total</td><td>{stats.total}</td></tr>
                            <tr><td>done</td><td>{stats.done}</td></tr>
                            <tr><td>in progress</td><td>{stats.inProgress}</td></tr>
                            <tr><td>todo</td><td>{stats.todo}</td></tr>
                            <tr><td>completion</td><td>{stats.percent}%</td></tr>
                            <tr>
                                <td>teammates</td>
                                <td>{stats.assignees.map(function (a) { return capitalize(a) }).join(', ')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div>
                    <h4>recent activity</h4>
                    {activity.length == 0 ? (
                        <p style={{ color: '#999', fontSize: 13 }}>loading activity...</p>
                    ) : (
                        <div className="list">
                            {activity.map((a, i) => (
                                <div className="activity-row" key={i}>
                                    <div
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 3,
                                            background: statusColor(i % 2 == 0 ? 'done' : 'todo'),
                                            marginTop: 6
                                        }}
                                    ></div>
                                    <div>
                                        <div style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: a.text }}></div>
                                        <div style={{ fontSize: 11, color: '#aaa' }}>{timeAgo(a.at)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h4 style={{ marginTop: 24 }}>settings</h4>
                    <label className="checkline">
                        <input
                            type="checkbox"
                            checked={props.user.settings.notifications}
                            onChange={(e) => {
                                props.user.settings.notifications = e.target.checked
                                setFlag(!flag)
                            }}
                        />
                        email notifications
                    </label>
                    <label className="checkline">
                        <input
                            type="checkbox"
                            checked={props.user.settings.weeklyDigest}
                            onChange={(e) => {
                                props.user.settings.weeklyDigest = e.target.checked
                                setFlag(!flag)
                            }}
                        />
                        weekly digest
                    </label>

                    <div className="debug">
                        renders: {editCount} | temp: {temp} | data: {data ? data.length : 0} | data2: {data2.length} |{' '}
                        {_.isEmpty(data2) ? 'empty' : 'not empty'}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Userdetail
