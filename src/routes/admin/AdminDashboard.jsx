import React, { useEffect, useMemo, useState } from 'react'
import { supabase, hasSupabaseConfig } from '../../lib/supabaseClient'
import { ArrowUpRight, Package2, ShoppingBag, CircleDollarSign } from 'lucide-react'

const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function AdminDashboard(){
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [orderItems, setOrderItems] = useState([])

  useEffect(() => {
    async function load(){
      setLoading(true)
      setError('')
      if(!hasSupabaseConfig){
        throw new Error('Supabase configuration missing. Set your credentials to see live data.')
      }
      try {
        const [ordersRes, productsRes, itemsRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('products').select('id,title,slug,base_price,currency,active'),
          supabase.from('order_items').select('order_id, product_id, qty, line_total'),
        ])
        if(ordersRes.error) throw ordersRes.error
        if(productsRes.error) throw productsRes.error
        if(itemsRes.error) throw itemsRes.error

        setOrders(ordersRes.data || [])
        setProducts(productsRes.data || [])
        setOrderItems(itemsRes.data || [])
      } catch (err) {
        console.error(err)
        setProducts([])
        setOrders([])
        setOrderItems([])
        setError(err.message || 'Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = useMemo(() => {
    if(!orders.length) return {
      revenue: 0,
      avgOrder: 0,
      pending: 0,
      productCount: products.length,
      statusBreakdown: [],
      recentOrders: [],
      topProducts: [],
    }

    const validOrders = orders.filter(order => order.status !== 'cancelled')
    const revenue = validOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const avgOrder = validOrders.length ? revenue / validOrders.length : 0
    const pending = orders.filter(order => order.status === 'pending').length

    const statusBreakdown = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    const productMap = new Map(products.map(product => [product.id, product]))
    const productTotals = orderItems.reduce((acc, item) => {
      const entry = acc[item.product_id] || { qty: 0, revenue: 0 }
      entry.qty += Number(item.qty || 0)
      entry.revenue += Number(item.line_total || 0)
      acc[item.product_id] = entry
      return acc
    }, {})

    const topProducts = Object.entries(productTotals)
      .map(([productId, totals]) => ({
        productId,
        title: productMap.get(productId)?.title || 'Unknown product',
        qty: totals.qty,
        revenue: totals.revenue,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    return {
      revenue,
      avgOrder,
      pending,
      productCount: products.length,
      statusBreakdown: statusOrder.map(status => ({ status, count: statusBreakdown[status] || 0 })),
      recentOrders: orders.slice(0, 6),
      topProducts,
    }
  }, [orders, products, orderItems])

  return (
    <div style={{display:'grid', gap:24}}>
      {error && (
        <div className="card" style={{padding:16, border:'1px solid rgba(255,23,68,0.35)'}}>
          <strong style={{color:'var(--danger)'}}>
            {hasSupabaseConfig ? 'Failed to load admin data' : 'Supabase not configured'}
          </strong>
          <div className="text-soft">{error}</div>
        </div>
      )}

      <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))'}}>
        <StatCard
          icon={CircleDollarSign}
          label="Total revenue"
          primary={stats.revenue}
          prefix="MAD "
          highlight={validNumber(stats.revenue)}
          loading={loading}
        />
        <StatCard
          icon={ShoppingBag}
          label="Avg. order value"
          primary={stats.avgOrder}
          prefix="MAD "
          loading={loading}
        />
        <StatCard
          icon={ArrowUpRight}
          label="Pending orders"
          primary={stats.pending}
          loading={loading}
        />
        <StatCard
          icon={Package2}
          label="Active products"
          primary={stats.productCount}
          loading={loading}
        />
      </div>

      <div style={{display:'grid', gap:24, gridTemplateColumns:'minmax(0, 2fr) minmax(0, 1fr)'}}>
        <div className="card" style={{padding:16, display:'grid', gap:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{margin:0}}>Recent orders</h3>
            <span className="text-micro">{stats.recentOrders.length} latest</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.order_code}</td>
                    <td><StatusPill status={order.status} /></td>
                    <td>{Number(order.total || 0).toFixed(2)} {order.currency}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!stats.recentOrders.length && (
                  <tr>
                    <td colSpan={4} style={{textAlign:'center', padding:'16px 0', color:'var(--text-soft)'}}>
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{display:'grid', gap:24}}>
          <div className="card" style={{padding:16, display:'grid', gap:16}}>
            <h3 style={{margin:0}}>Status breakdown</h3>
            <div style={{display:'grid', gap:12}}>
              {stats.statusBreakdown.map(({ status, count }) => (
                <div key={status} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <StatusPill status={status} />
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:16, display:'grid', gap:16}}>
            <h3 style={{margin:0}}>Top products</h3>
            <div style={{display:'grid', gap:12}}>
              {stats.topProducts.map(product => (
                <div key={product.productId} style={{display:'flex', flexDirection:'column', gap:4}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <strong>{product.title}</strong>
                    <span className="badge">{product.qty} sold</span>
                  </div>
                  <span className="text-micro">Revenue: MAD {product.revenue.toFixed(2)}</span>
                </div>
              ))}
              {!stats.topProducts.length && (
                <span className="text-soft">No sales yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, primary, prefix = '', highlight, loading }){
  return (
    <div className="card" style={{padding:18, display:'grid', gap:10}}>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <div style={{
          width:40,
          height:40,
          borderRadius:'50%',
          display:'grid',
          placeItems:'center',
          background:'rgba(0,224,255,0.14)',
          color:'var(--accent)',
        }}>
          <Icon size={18} />
        </div>
        <span className="text-micro">{label}</span>
      </div>
      <strong style={{fontSize:'1.6rem'}}>
        {loading ? '—' : `${prefix}${formatNumber(primary)}`}
      </strong>
      {highlight && (
        <span className="text-soft" style={{fontSize:'0.85rem'}}>Includes all non-cancelled orders</span>
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
    <span
      className="badge"
      style={{background:tone.bg, color:tone.color, borderColor:'transparent'}}
    >
      {status}
    </span>
  )
}

function formatNumber(value){
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function validNumber(value){
  return Number.isFinite(value) && value > 0
}
