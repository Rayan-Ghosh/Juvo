import React from 'react'

export default function MessageBubble({ role = 'user', text = '' }) {
  const isUser = role === 'user'
  return (
    <div className={`row ${isUser ? 'user' : 'bot'}`}>
      <div className="avatar">{isUser ? 'U' : 'AI'}</div>
      <div className="bubble">{text}</div>
    </div>
  )
}
