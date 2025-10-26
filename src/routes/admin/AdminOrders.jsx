import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Trash2, Eye } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

const emptyOrderForm = () => ({
  order_code: generateOrderCode(),
  status: 'pending',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_address: '',
  notes: '',
  shipping: 0,
  currency: 'MAD',
  to_whatsapp: '',
})

export default function AdminOrders(){
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [orderForm, setOrderForm] = useState(emptyOrderForm)
  const [lineItems, setLineItems] = useState([{ productId: '', qty: 1 }])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    loadInitial()
  }, [])

  async function loadInitial(){
    setLoading(true)
    const [ordersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id,title,base_price,currency'),
    ])
    if(!ordersRes.error) setOrders(ordersRes.data || [])
    if(!productsRes.error) setProducts(productsRes.data || [])
    setLoading(false)
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = filters.status ? order.status === filters.status : true
      const query = filters.search.trim().toLowerCase()
      if(!query) return matchesStatus
      const haystack = [
        order.order_code,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
      ].join(' ').toLowerCase()
      return matchesStatus && haystack.includes(query)
    })
  }, [orders, filters])

  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      if(!product) return sum
      return sum + Number(product.base_price || 0) * Number(item.qty || 0)
    }, 0)
  }, [lineItems, products])

  const total = subtotal + Number(orderForm.shipping || 0)

  function updateLineItem(index, changes){
    setLineItems(items => items.map((item, idx) => idx === index ? { ...item, ...changes } : item))
  }

  function addLineItem(){
    setLineItems(items => [...items, { productId: '', qty: 1 }])
  }

  function removeLineItem(index){
    setLineItems(items => items.filter((_, idx) => idx !== index))
  }

  function resetOrderForm(){
    setOrderForm(emptyOrderForm())
    setLineItems([{ productId: '', qty: 1 }])
  }

  async function handleCreateOrder(event){
    event.preventDefault()

    const preparedItems = lineItems.filter(item => item.productId && item.qty > 0)
    if(!preparedItems.length){
      alert('Add at least one product to the order.')
      return
    }

    setCreating(true)
    const payload = {
      ...orderForm,
      subtotal,
      shipping: Number(orderForm.shipping || 0),
      total,
    }

    const { data: insertedOrder, error } = await supabase
      .from('orders')
      .insert(payload)
      .select('*')
      .single()

    if(error){
      alert(error.message)
      setCreating(false)
      return
    }

    const itemsToInsert = preparedItems.map(item => {
      const product = products.find(p => p.id === item.productId)
      return {
        order_id: insertedOrder.id,
        product_id: item.productId,
        variant_id: null,
        title: product?.title || 'Product',
        qty: Number(item.qty),
        unit_price: Number(product?.base_price || 0),
        line_total: Number(product?.base_price || 0) * Number(item.qty),
      }
    })

    const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert)
    setCreating(false)
    if(itemsErr){
      alert(itemsErr.message)
      return
    }

    resetOrderForm()
    await loadInitial()
    setSelectedOrder(insertedOrder)
    fetchOrderItems(insertedOrder)
  }

  async function fetchOrderItems(order){
    setDetailLoading(true)
    const { data, error } = await supabase.from('order_items').select('*').eq('order_id', order.id)
    setDetailLoading(false)
    if(error){
      alert(error.message)
      return
    }
    setSelectedItems(data || [])
  }

  async function handleSelectOrder(order){
    setSelectedOrder(order)
    fetchOrderItems(order)
  }

  async function handleStatusUpdate(order, status){
    setUpdatingStatus(order.id)
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id)
    setUpdatingStatus(null)
    if(error){
      alert(error.message)
      return
    }
    setOrders(list => list.map(o => o.id === order.id ? { ...o, status } : o))
    if(selectedOrder?.id === order.id){
      setSelectedOrder(prev => ({ ...prev, status }))
    }
  }

  async function handleDelete(order){
    if(!window.confirm(`Delete order ${order.order_code}? This cannot be undone.`)) return
    setDeletingId(order.id)
    await supabase.from('order_items').delete().eq('order_id', order.id)
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    setDeletingId(null)
    if(error){
      alert(error.message)
      return
    }
    setOrders(list => list.filter(o => o.id !== order.id))
    if(selectedOrder?.id === order.id){
      setSelectedOrder(null)
      setSelectedItems([])
    }
  }

  return (
    <div style={{display:'grid', gap:24}}>
      <section className="card" style={{padding:20, display:'grid', gap:16}}>
        <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
          <div>
            <h3 style={{margin:0}}>Create manual order</h3>
            <p className="text-soft" style={{margin:0}}>Capture WhatsApp or retail orders manually.</p>
          </div>
          <button type="button" className="btn ghost" onClick={resetOrderForm}>Reset</button>
        </header>
        <form onSubmit={handleCreateOrder} style={{display:'grid', gap:16}}>
          <div className="form-grid" style={{gap:12}}>
            <label style={{display:'grid', gap:6}}>
              <span className="text-micro">Order code</span>
              <input value={orderForm.order_code} onChange={e => setOrderForm(prev => ({ ...prev, order_code: e.target.value }))} />
            </label>
            <label style={{display:'grid', gap:6}}>
              <span className="text-micro">Status</span>
              <select value={orderForm.status} onChange={e => setOrderForm(prev => ({ ...prev, status: e.target.value }))}>
                {STATUS_OPTIONS.map(status => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label style={{display:'grid', gap:6}}>
              <span className="text-micro">Customer name</span>
              <input value={orderForm.customer_name} onChange={e => setOrderForm(prev => ({ ...prev, customer_name: e.target.value }))} placeholder="e.g. Yuki Ito" />
            </label>
            <label style={{display:'grid', gap:6}}>
              <span className="text-micro">Customer email</span>
              <input value={orderForm.customer_email} onChange={e => setOrderForm(prev => ({ ...prev, customer_email: e.target.value }))} type="email" />
            </label>
            <label style={{display:'grid', gap:6}}>
              <span className="text-micro">Customer phone</span>
              <input value={orderForm.customer_phone} onChange={e => setOrderForm(prev => ({ ...prev, customer_phone: e.target.value }))} />
            </label>
            <label style={{display:'grid', gap:6}}>
              <span className="text-micro">Currency</span>
              <select value={orderForm.currency} onChange={e => setOrderForm(prev => ({ ...prev, currency: e.target.value }))}>
                <option value="MAD">MAD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label style={{display:'grid', gap:6, gridColumn:'1/-1'}}>
              <span className="text-micro">Customer address</span>
              <textarea value={orderForm.customer_address} onChange={e => setOrderForm(prev => ({ ...prev, customer_address: e.target.value }))} rows={2} />
            </label>
          </div>

          <div style={{display:'grid', gap:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span className="text-micro">Items</span>
              <button type="button" className="btn ghost" onClick={addLineItem}>
                <Plus size={16} />
                Add item
              </button>
            </div>
            <div style={{display:'grid', gap:12}}>
              {lineItems.map((item, index) => {
                const product = products.find(p => p.id === item.productId)
                return (
                  <div key={index} style={{display:'grid', gap:12, gridTemplateColumns:'minmax(0, 2fr) minmax(0, 1fr) auto', alignItems:'center'}}>
                    <select
                      value={item.productId}
                      onChange={e => updateLineItem(index, { productId: e.target.value })}
                      required
                    >
                      <option value="">Select product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.title} · {product.base_price} {product.currency}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={e => updateLineItem(index, { qty: Number(e.target.value) })}
                      required
                    />
                    <button type="button" className="btn ghost" onClick={() => removeLineItem(index)} disabled={lineItems.length === 1}>
                      <Trash2 size={16} />
                    </button>
                    {product && (
                      <span className="text-micro" style={{gridColumn:'1 / -1'}}>
                        Line total: {(Number(product.base_price || 0) * Number(item.qty || 0)).toFixed(2)} {product.currency}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="form-grid" style={{gap:12}}>
            <label style={{display:'grid', gap:6}}>
              <span className="text-micro">Shipping</span>
              <input
                type="number"
                value={orderForm.shipping}
                onChange={e => setOrderForm(prev => ({ ...prev, shipping: Number(e.target.value) }))}
              />
            </label>
            <label style={{display:'grid', gap:6}}>
              <span className="text-micro">WhatsApp</span>
              <input
                value={orderForm.to_whatsapp}
                onChange={e => setOrderForm(prev => ({ ...prev, to_whatsapp: e.target.value }))}
                placeholder="+212 600-000000"
              />
            </label>
          </div>

          <label style={{display:'grid', gap:6}}>
            <span className="text-micro">Notes</span>
            <textarea value={orderForm.notes} onChange={e => setOrderForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
          </label>

          <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12, alignItems:'center'}}>
            <div style={{display:'grid', gap:4}}>
              <span className="text-soft">Subtotal: {subtotal.toFixed(2)} {orderForm.currency}</span>
              <strong>Total: {total.toFixed(2)} {orderForm.currency}</strong>
            </div>
            <button type="submit" className="btn primary" disabled={creating}>
              {creating ? 'Saving...' : 'Create order'}
            </button>
          </div>
        </form>
      </section>

      <section className="card" style={{padding:20, display:'grid', gap:16}}>
        <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
          <div>
            <h3 style={{margin:0}}>Orders</h3>
            <p className="text-soft" style={{margin:0}}>Track and manage every order placed through the store.</p>
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <input
              placeholder="Search orders"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map(status => <option key={status}>{status}</option>)}
            </select>
          </div>
        </header>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Placed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{textAlign:'center', padding:'16px 0'}}>Loading...</td></tr>
              )}
              {!loading && filteredOrders.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:'center', padding:'16px 0', color:'var(--text-soft)'}}>No orders found.</td></tr>
              )}
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.order_code}</td>
                  <td>
                    <div style={{display:'grid'}}>
                      <strong>{order.customer_name || 'Guest'}</strong>
                      <span className="text-micro">{order.customer_email || order.customer_phone || '—'}</span>
                    </div>
                  </td>
                  <td><StatusPill status={order.status} /></td>
                  <td>{Number(order.total || 0).toFixed(2)} {order.currency}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <div style={{display:'flex', gap:8}}>
                      <button type="button" className="btn" onClick={() => handleSelectOrder(order)}>
                        <Eye size={16} />
                        View
                      </button>
                      <select
                        value={order.status}
                        onChange={e => handleStatusUpdate(order, e.target.value)}
                        disabled={updatingStatus === order.id}
                      >
                        {STATUS_OPTIONS.map(status => <option key={status}>{status}</option>)}
                      </select>
                      <button type="button" className="btn ghost" onClick={() => handleDelete(order)} disabled={deletingId === order.id}>
                        {deletingId === order.id ? 'Deleting…' : (
                          <>
                            <Trash2 size={16} />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedOrder && (
        <section className="card" style={{padding:20, display:'grid', gap:16}}>
          <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <h3 style={{margin:0}}>Order • {selectedOrder.order_code}</h3>
              <p className="text-soft" style={{margin:0}}>Created {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
            <StatusPill status={selectedOrder.status} />
          </header>

          <div style={{display:'grid', gap:12}}>
            <div style={{display:'grid', gap:4}}>
              <strong>Customer</strong>
              <span>{selectedOrder.customer_name || 'Guest'}</span>
              <span className="text-soft">{selectedOrder.customer_email || 'No email'}</span>
              <span className="text-soft">{selectedOrder.customer_phone || 'No phone'}</span>
              <span className="text-soft">{selectedOrder.customer_address || 'No address'}</span>
            </div>

            <div style={{display:'grid', gap:4}}>
              <strong>Totals</strong>
              <span className="text-soft">Subtotal: {Number(selectedOrder.subtotal || 0).toFixed(2)} {selectedOrder.currency}</span>
              <span className="text-soft">Shipping: {Number(selectedOrder.shipping || 0).toFixed(2)} {selectedOrder.currency}</span>
              <strong>Total: {Number(selectedOrder.total || 0).toFixed(2)} {selectedOrder.currency}</strong>
            </div>

            {selectedOrder.notes && (
              <div style={{display:'grid', gap:4}}>
                <strong>Notes</strong>
                <p className="text-soft" style={{margin:0}}>{selectedOrder.notes}</p>
              </div>
            )}
          </div>

          <div>
            <h4>Items</h4>
            {detailLoading && <div className="text-soft">Loading items…</div>}
            {!detailLoading && !selectedItems.length && (
              <div className="text-soft">No items recorded.</div>
            )}
            {!detailLoading && selectedItems.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.qty}</td>
                        <td>{Number(item.unit_price || 0).toFixed(2)} {selectedOrder.currency}</td>
                        <td>{Number(item.line_total || 0).toFixed(2)} {selectedOrder.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function StatusPill({ status }){
  const palette = {
    pending: { bg:'rgba(255,46,99,0.15)', color:'#ff2e63' },
    confirmed: { bg:'rgba(0,224,255,0.16)', color:'#00e0ff' },
    shipped: { bg:'rgba(46,204,113,0.18)', color:'#2ecc71' },
    delivered: { bg:'rgba(46,204,113,0.18)', color:'#2ecc71' },
    cancelled: { bg:'rgba(255,23,68,0.12)', color:'#ff1744' },
  }
  const tone = palette[status] || { bg:'rgba(255,255,255,0.12)', color:'var(--text)' }
  return (
    <span className="badge" style={{background:tone.bg, color:tone.color, borderColor:'transparent'}}>
      {status}
    </span>
  )
}

function generateOrderCode(){
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ORD-${Date.now().toString(36).toUpperCase()}-${random}`
}
