import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Star, ShoppingCart, MessageCircle, Mail } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { formatPrice } from '../lib/utils'
import { supabase, hasSupabaseConfig } from '../lib/supabaseClient'
import { openWhatsApp } from '../lib/utils'
import ProductRatingForm from '../components/Product/ProductRatingForm'
import styles from './ProductDetail.module.css'

function mapProduct(record){
  return {
    ...record,
    images: (record.product_images || []).map(img => ({
      url: img.url,
      alt: img.alt || record.title,
      id: img.id,
    })),
    variants: record.variants || [],
    rating: record.rating || 4.8,
  }
}

export default function ProductDetail(){
  const { slug } = useParams()
  const add = useCartStore(s => s.add)
  const [product, setProduct] = useState(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [size, setSize] = useState('M')
  const [color, setColor] = useState('Black')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 })
  const [ratingError, setRatingError] = useState('')
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [orderEmail, setOrderEmail] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')

  useEffect(() => {
    async function load(){
      setLoading(true)
      setError('')
      try{
        if(!hasSupabaseConfig){
          throw new Error('Supabase configuration missing. Add products through the admin once configured.')
        }
        const { data, error } = await supabase
          .from('products')
          .select('*, product_images(*), variants(*)')
          .eq('slug', slug)
          .single()
        if(error) throw error
        const mapped = mapProduct(data)
        setProduct(mapped)
        const firstVariant = mapped.variants[0]
        if(firstVariant){
          setSize(firstVariant.size || 'M')
          setColor(firstVariant.color || 'Black')
        }
        setImgIdx(0)
        await refreshRatings(mapped.id)
      } catch(err){
        console.error(err)
        setProduct(null)
        setError(err.message || 'Failed to load product')
        setRatingSummary({ average: 0, count: 0 })
      } finally{
        setLoading(false)
      }
    }
    load()
  }, [slug])

  async function refreshRatings(productId){
    if(!hasSupabaseConfig){
      setRatingSummary({ average: 0, count: 0 })
      setRatingError('Supabase configuration missing. Ratings disabled.')
      return
    }
    try{
      setRatingError('')
      const { data, error } = await supabase
        .from('product_ratings')
        .select('rating')
        .eq('product_id', productId)
      if(error) throw error
      const ratings = data || []
      const count = ratings.length
      const average = count ? ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / count : 0
      setRatingSummary({ average, count })
    } catch(err){
      console.error(err)
      setRatingError(err.message || 'Failed to load ratings')
      setRatingSummary({ average: 0, count: 0 })
    }
  }

  useEffect(() => {
    if (!product) return
    const availableColors = product.variants
      .filter(variant => variant.size === size)
      .map(variant => variant.color)
    if (availableColors.length && !availableColors.includes(color)) {
      setColor(availableColors[0])
    }
  }, [size, product, color])

  useEffect(() => {
    if (!lightboxOpen) return
    function onKey(event){
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowRight') {
        setImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1))
      }
      if (event.key === 'ArrowLeft') {
        setImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const images = product?.images || []
  const hasMultipleImages = images.length > 1
  const image = images[imgIdx]
  const sizeOptions = useMemo(
    () => Array.from(new Set((product?.variants || []).map(v => v.size).filter(Boolean))),
    [product]
  )
  const colorOptions = useMemo(
    () => Array.from(new Set((product?.variants || []).filter(v => v.size === size).map(v => v.color).filter(Boolean))),
    [product, size]
  )
  const variant = useMemo(() => {
    if(!product) return null
    return product.variants.find(v => v.size === size && v.color === color) || product.variants.find(v => v.size === size) || null
  }, [product, size, color])

  function handlePrev(){
    setImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  function handleNext(){
    setImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  function handleAddToCart(){
    if(!product) return
    const unitPrice = Number((variant?.price ?? product.base_price) || 0)
    add({
      productId: product.id,
      variantId: variant?.id || null,
      title: product.title,
      qty: 1,
      size,
      color,
      unitPrice,
    })
  }

  function handleBuyNow(){
    if(!product){
      setError('Product not available.')
      return
    }
    if(!whatsappNumber){
      setError('WhatsApp contact number is not configured.')
      return
    }
    const unitPrice = Number((variant?.price ?? product.base_price) || 0)
    const message = [
      `Hello Haruki team!`,
      ``,
      `I'd like to purchase: ${product.title}`,
      variant ? `Variant: ${variant.size || 'One size'} / ${variant.color || 'Default'}` : '',
      `Price: ${formatPrice(unitPrice)}`,
      ``,
      `Please let me know how to proceed.`,
    ].filter(Boolean).join('%0A')
    openWhatsApp(whatsappNumber, message)
  }

  async function handleEmailOrder(event){
    event.preventDefault()
    setOrderMessage('')
    if(!product){
      setOrderMessage('Product not available.')
      return
    }
    if(!orderEmail.trim()){
      setOrderMessage('Please provide an email address so we can reach you.')
      return
    }
    setOrderSubmitting(true)
    try{
      const payload = {
        order_code: `WEB-${Date.now()}`,
        status: 'pending',
        subtotal: Number((variant?.price ?? product.base_price) || 0),
        shipping: 0,
        total: Number((variant?.price ?? product.base_price) || 0),
        currency: product.currency || 'MAD',
        customer_name: null,
        customer_email: orderEmail.trim().toLowerCase(),
        customer_phone: null,
        customer_address: null,
        notes: [orderNotes, `Product: ${product.title}`, `Variant: ${size} / ${color}`].filter(Boolean).join('\n'),
        to_whatsapp: null,
      }
      const { data: insertedOrder, error } = await supabase.from('orders').insert(payload).select('id').single()
      if(error) throw error
      const itemPayload = {
        order_id: insertedOrder.id,
        product_id: product.id,
        variant_id: variant?.id || null,
        title: product.title,
        qty: 1,
        unit_price: Number((variant?.price ?? product.base_price) || 0),
        line_total: Number((variant?.price ?? product.base_price) || 0),
      }
      await supabase.from('order_items').insert(itemPayload)
      setOrderMessage('Thanks! We received your order and will contact you soon.')
      setOrderSubmitting(false)
      setOrderNotes('')
      setOrderEmail('')
    } catch(err){
      console.error(err)
      setOrderMessage(err.message || 'Unable to submit order.')
      setOrderSubmitting(false)
    }
  }

  if(loading){
    return (
      <section className="section">
        <div className="container">
          <div className="card" style={{padding:24}}>
            <div className="skeleton" style={{height:32, width:220, marginBottom:16}} />
            <div className="skeleton" style={{height:200}} />
          </div>
        </div>
      </section>
    )
  }

  if (error || !product) {
    return (
      <section className="section">
        <div className="container">
          <div className="card">
            <h2>Product unavailable</h2>
            <p className="text-soft">{error || 'The item you are looking for has moved or sold out.'}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`section ${styles.detail}`}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.gallery}>
            <div className={`card ${styles.preview}`}>
              {image ? (
                <button
                  type="button"
                  className={styles.previewButton}
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Open gallery"
                >
                  <img src={image.url} alt={image.alt || product.title} />
                  {hasMultipleImages && <span className={styles.previewHint}>View gallery</span>}
                </button>
              ) : <div className="skeleton" />}
            </div>
            {hasMultipleImages && (
              <div className={styles.thumbs}>
                {images.map((im, idx) => (
                  <button
                    type="button"
                    key={im.url || idx}
                    className={`${styles.thumbButton} ${idx === imgIdx ? styles.thumbActive : ''}`}
                    onClick={() => setImgIdx(idx)}
                    aria-label={`Preview image ${idx + 1}`}
                  >
                    <img src={im.url} alt={im.alt || 'Preview'} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`card ${styles.info}`}>
            <div className={styles.header}>
              <span className="badge primary">Haruki Originals</span>
              <h1>{product.title}</h1>
              <div className={styles.meta}>
                <span className={styles.rating}>
                  <Star size={16} aria-hidden />
                  {ratingSummary.count ? ratingSummary.average.toFixed(1) : '—'}
                </span>
                <span className="text-micro">
                  {ratingSummary.count} {ratingSummary.count === 1 ? 'rating' : 'ratings'}
                </span>
                <span className={styles.dot} aria-hidden />
                <span>{product.category || 'Apparel'}</span>
                {variant?.stock != null && (
                  <>
                    <span className={styles.dot} aria-hidden />
                    <span>{variant.stock} in stock</span>
                  </>
                )}
              </div>
              <div className={styles.price}>{formatPrice((variant?.price ?? product.base_price) || 0)}</div>
              <p className={styles.description}>{product.description}</p>
            </div>

            {product.variants.length > 0 && (
              <div className={styles.pickList}>
                {sizeOptions.length > 0 && (
                  <div>
                    <span className="eyebrow">Size</span>
                    <div className={styles.optionRow}>
                      {sizeOptions.map(option => (
                        <button
                          key={option}
                          type="button"
                          className={`btn ${option === size ? 'primary' : 'ghost'} ${styles.option}`}
                          onClick={() => setSize(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {colorOptions.length > 0 && (
                  <div>
                    <span className="eyebrow">Color</span>
                    <div className={styles.optionRow}>
                      {colorOptions.map(option => (
                        <button
                          key={option}
                          type="button"
                          className={`btn ${option === color ? 'primary' : 'ghost'} ${styles.option}`}
                          onClick={() => setColor(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={styles.actions}>
              <button className="btn primary" onClick={handleAddToCart}>
                <ShoppingCart size={16} />
                Add to cart
              </button>
              <button className="btn ghost" onClick={handleBuyNow}>
                <MessageCircle size={16} />
                Buy via WhatsApp
              </button>
            </div>
            {ratingError && (
              <div className="badge" style={{background:'rgba(255,23,68,0.12)', borderColor:'transparent', color:'var(--danger)'}}>
                {ratingError}
              </div>
            )}
          </div>
        </div>
        <ProductRatingForm productId={product.id} onSubmitted={() => refreshRatings(product.id)} />
        <div className="card" style={{padding:20, display:'grid', gap:12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
            <div>
              <h3 style={{margin:0}}>Order without WhatsApp</h3>
              <p className="text-soft" style={{margin:0}}>Send us your email and we’ll confirm your order by mail.</p>
            </div>
            <button className="btn ghost" onClick={() => setEmailModalOpen(true)}>
              <Mail size={16} />
              Request checkout link
            </button>
          </div>
          {orderMessage && (
            <div className="badge" style={{background:'rgba(0,224,255,0.12)', borderColor:'transparent', color:'var(--accent)'}}>
              {orderMessage}
            </div>
          )}
        </div>
      </div>
      {lightboxOpen && image && (
        <div className={styles.lightbox} role="dialog" aria-modal="true">
          {hasMultipleImages && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={handlePrev}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}
          <figure className={styles.lightboxContent}>
            <img src={images[imgIdx].url} alt={images[imgIdx].alt || product.title} />
            <figcaption className={styles.lightboxCaption}>
              {imgIdx + 1} / {images.length}
            </figcaption>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setLightboxOpen(false)}
              aria-label="Close gallery"
            >
              ✕
            </button>
          </figure>
          {hasMultipleImages && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={handleNext}
              aria-label="Next image"
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  )
}
