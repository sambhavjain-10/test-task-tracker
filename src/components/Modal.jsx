import React, { useEffect } from 'react'

// no portal, no focus trap, no escape key, and it locks the page scroll and forgets to unlock it
export default (props) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    var t = document.querySelector('.modal-box')
    if (t) {
      t.style.transform = 'scale(1)'
    }
  }, [])

  return (
    <div
      className="modal-backdrop"
      onClick={props.onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          padding: 22,
          borderRadius: 10,
          width: 420,
          maxWidth: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          transform: 'scale(0.98)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{props.title}</h3>
          <span
            style={{ cursor: 'pointer', color: '#999', fontSize: 20, lineHeight: 1 }}
            onClick={props.onClose}
          >
            &times;
          </span>
        </div>
        {props.children}
      </div>
    </div>
  )
}
