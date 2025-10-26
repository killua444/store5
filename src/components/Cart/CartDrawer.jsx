import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { calcTotals, formatPrice } from '../../lib/utils'

export default function CartDrawer(){
  const [open, setOpen] = useState(false)
  const items = useCartStore(s=>s.items)
  const remove = useCartStore(s=>s.remove)
  const totals = calcTotals(items, 0)

  return (
    <div className="drawer" aria-hidden={!open}>
      <button className="btn" style={{position:'fixed', right:16, bottom:16, zIndex:40}} onClick={()=> setOpen(true)}>Cart ({items.length})</button>
      {open && (
        <div className="panel">
          <div style={{display:'flex', justifyContent:'space-between', padding:16, borderBottom:'1px solid var(--border)'}}>
            <strong>Cart</strong>
            <button className="btn" onClick={()=> setOpen(false)}>Close</button>
          </div>
          <div style={{padding:16, display:'grid', gap:12}}>
            {items.length===0 && <div className="muted">Cart is empty</div>}
            {items.map((i,idx)=> (
              <div key={idx} className="card" style={{padding:12, display:'flex', justifyContent:'space-between'}}>
                <div>
                  <div>{i.title} {i.size||''} {i.color||''}</div>
                  <div style={{color:'var(--muted)'}}>x{i.qty} • {formatPrice(i.unitPrice)}</div>
                </div>
                <div>
                  <div>{formatPrice(i.qty * i.unitPrice)}</div>
                  <button className="btn" onClick={()=> remove(idx)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'auto', padding:16, borderTop:'1px solid var(--border)'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span>Subtotal</span>
              <strong>{formatPrice(totals.subtotal)}</strong>
            </div>
            <Link to="/cart" className="btn primary" style={{width:'100%', marginTop:12}} onClick={()=> setOpen(false)}>Go to Cart</Link>
          </div>
        </div>
      )}
    </div>
  )
}
