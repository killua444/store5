import React, { useEffect, useState } from 'react'

export default function AdminSettings(){
  const [settings, setSettings] = useState({ store_name:'Haruki', currency: import.meta.env.VITE_STORE_CURRENCY||'MAD', whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER||'' })
  useEffect(()=>{},[])
  return (
    <div className="card" style={{padding:12}}>
      <h3>Store Settings</h3>
      <div className="form-grid">
        <input value={settings.store_name} onChange={e=> setSettings({...settings, store_name:e.target.value})} placeholder="Store Name"/>
        <input value={settings.currency} onChange={e=> setSettings({...settings, currency:e.target.value})} placeholder="Currency"/>
        <input value={settings.whatsapp} onChange={e=> setSettings({...settings, whatsapp:e.target.value})} placeholder="WhatsApp Number"/>
      </div>
      <p style={{color:'var(--muted)'}}>Env-backed in this demo. Persist to DB if needed.</p>
    </div>
  )
}
