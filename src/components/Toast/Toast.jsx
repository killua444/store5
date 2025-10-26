import React, { useEffect, useState } from 'react'

let push
export function toast(msg){ push && push(msg) }

export default function Toast(){
  const [messages, setMessages] = useState([])
  useEffect(()=>{ push = (m)=> setMessages(s=> [...s, m]); return ()=> { push = null } },[])
  useEffect(()=>{ if(!messages.length) return; const t = setTimeout(()=> setMessages(s=> s.slice(1)), 3000); return ()=> clearTimeout(t)}, [messages])
  return (
    <div style={{position:'fixed', bottom:16, left:16, display:'grid', gap:8, zIndex:50}} aria-live="polite" aria-atomic="true">
      {messages.map((m,i)=> <div key={i} className="card" style={{padding:12, background:'var(--primary)', color:'var(--primary-contrast)'}}>{m}</div>)}
    </div>
  )
}
