import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'
import { calcTotals, composeWhatsAppMessage, formatPrice, openWhatsApp, uuid } from '../lib/utils'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/authStore'
import styles from './CartPage.module.css'

export default function CartPage(){
  const items = useCartStore(s => s.items)
  const updateQty = useCartStore(s => s.updateQty)
  const remove = useCartStore(s => s.remove)
  const clear = useCartStore(s => s.clear)
  const promo = useCartStore(s => s.promo)
  const setPromo = useCartStore(s => s.setPromo)
  const shipping = useCartStore(s => s.shipping)
  const setShipping = useCartStore(s => s.setShipping)
  const profile = useAuthStore(s => s.profile)
  const session = useAuthStore(s => s.session)

  const [notes, setNotes] = useState('')
  const [promoInput, setPromoInput] = useState(promo?.code || '')

  const discountedItems = useMemo(() => {
    if (!promo) return items
    return items.map(item => ({
      ...item,
      unitPrice: item.unitPrice * (1 - promo.pct / 100)
    }))
  }, [items, promo])

  const totals = calcTotals(discountedItems, shipping)

  useEffect(() => {
    setPromoInput(promo?.code || '')
  }, [promo])

  function applyPromo(event){
    event.preventDefault()
    setPromo(promoInput.trim())
  }

  async function sendOrder(){
    const orderCode = uuid()
    const message = composeWhatsAppMessage({
      orderCode,
      customer: {
        name: profile?.full_name,
        phone: profile?.phone,
        email: session?.user?.email,
        address: profile?.default_address
      },
      items: discountedItems.map(item => ({
        title: item.title,
        size: item.size,
        color: item.color,
        qty: item.qty,
        unitPrice: Number(item.unitPrice)
      })),
      totals,
      notes
    })

    openWhatsApp(import.meta.env.VITE_WHATSAPP_NUMBER, message)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user?.id || null,
      order_code: orderCode,
      customer_name: profile?.full_name || null,
      customer_phone: profile?.phone || null,
      customer_email: session?.user?.email || null,
      address: profile?.default_address || null,
      notes,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      currency: import.meta.env.VITE_STORE_CURRENCY || 'MAD',
      to_whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER,
      status: 'pending'
    }).select('*').single()

    if (!error) {
      await supabase.from('order_items').insert(discountedItems.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId,
        title: item.title,
        size: item.size,
        color: item.color,
        qty: item.qty,
        unit_price: item.unitPrice,
        line_total: item.qty * item.unitPrice,
      })))
      clear()
      alert('Order sent via WhatsApp and saved as pending!')
    } else {
      alert(`Failed to save order: ${error.message}`)
    }
  }

  return (
    <section className={`section ${styles.cart}`}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <span className="eyebrow">Cart</span>
            <h1>Ready to checkout?</h1>
            <p className="text-soft">{items.length} {items.length === 1 ? 'item' : 'items'} in your bag.</p>
          </div>
          {promo && (
            <div className={styles.promoBadge}>
              <span>Promo applied</span>
              <strong>{promo.code}</strong>
            </div>
          )}
        </header>

        {!items.length ? (
          <div className={`${styles.empty} card`}>
            <h2>Your cart is empty</h2>
            <p className="text-soft">Discover new drops and add them to your bag to check out.</p>
            <Link to="/catalog" className="btn primary">Browse catalog</Link>
          </div>
        ) : (
          <div className={styles.layout}>
            <div className={`${styles.items} card`}>
              <div className={styles.itemHead}>
                <span>Product</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>Total</span>
                <span className="sr-only">Remove item</span>
              </div>

              {items.map((item, index) => {
                const discounted = discountedItems[index] || item
                return (
                  <div key={`${item.productId}-${index}`} className={styles.itemRow}>
                    <div className={styles.itemMeta}>
                      <strong>{item.title}</strong>
                      <div className={styles.itemOptions}>
                        <span>{item.size}</span>
                        <span>{item.color}</span>
                      </div>
                    </div>

                    <div className={styles.qty}>
                      <label className="sr-only" htmlFor={`qty-${index}`}>Quantity for {item.title}</label>
                      <input
                        id={`qty-${index}`}
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={event => updateQty(index, Number(event.target.value))}
                      />
                    </div>

                    <div className={styles.unit}>{formatPrice(discounted.unitPrice)}</div>
                    <div className={styles.total}>{formatPrice(discounted.unitPrice * item.qty)}</div>

                    <button type="button" className="btn ghost" onClick={() => remove(index)}>
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>

            <aside className={`${styles.summary} card`}>
              <div className={styles.summaryHead}>
                <h2>Order summary</h2>
                <p className="text-soft">Apply your promo code and add delivery notes before sending the order.</p>
              </div>

              <form className={styles.promo} onSubmit={applyPromo}>
                <label htmlFor="promo" className={styles.label}>Promo code</label>
                <div className={styles.promoRow}>
                  <input
                    id="promo"
                    value={promoInput}
                    onChange={event => setPromoInput(event.target.value.toUpperCase())}
                    placeholder="HARUKI10"
                  />
                  <button type="submit" className="btn ghost">Apply</button>
                </div>
              </form>

              <div className={styles.shipping}>
                <label htmlFor="shipping" className={styles.label}>Shipping</label>
                <input
                  id="shipping"
                  type="number"
                  value={shipping}
                  onChange={event => setShipping(event.target.value)}
                  min="0"
                />
              </div>

              <div className={styles.summaryRows}>
                <div>
                  <span>Subtotal</span>
                  <strong>{formatPrice(totals.subtotal)}</strong>
                </div>
                <div>
                  <span>Shipping</span>
                  <strong>{formatPrice(totals.shipping)}</strong>
                </div>
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <strong>{formatPrice(totals.total)}</strong>
                </div>
              </div>

              <label htmlFor="notes" className={styles.label}>Notes for seller</label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Let us know about packaging or delivery preferences."
              />

              <button
                type="button"
                className="btn primary"
                disabled={!items.length}
                onClick={sendOrder}
              >
                Send order via WhatsApp
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}
