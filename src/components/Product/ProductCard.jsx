import React from 'react'
import styles from './ProductCard.module.css'
import { Heart, Plus, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { formatPrice } from '../../lib/utils'

export default function ProductCard({ product }){
  const toggleWishlist = useCartStore(s => s.toggleWishlist)
  const add = useCartStore(s => s.add)
  const wishlist = useCartStore(s => s.wishlist)
  const wish = wishlist.includes(product.id)
  const img = product.images?.[0]
  const ratingValue = Number.isFinite(product.rating) ? Number(product.rating).toFixed(1) : '—'
  const ratingCount = Number(product.rating_count || 0)

  function handleQuickAdd() {
    add({
      productId: product.id,
      variantId: null,
      title: product.title,
      qty: 1,
      size: null,
      color: null,
      unitPrice: Number(product.base_price)
    })
  }

  return (
    <article className={`card ${styles.card}`}>
      <div className={styles.media}>
        <Link to={`/product/${product.slug}`} className={styles.thumb} aria-label={`View ${product.title}`}>
          {img
            ? <img src={img.url} alt={img.alt || product.title} loading="lazy" />
            : <div className="skeleton" />}
          <span className={styles.scrim} aria-hidden />
        </Link>
        <button
          type="button"
          className={`${styles.wishlist} btn ghost`}
          onClick={() => toggleWishlist(product.id)}
          aria-label={wish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} fill={wish ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.headline}>
          <Link to={`/product/${product.slug}`} className={styles.title}>{product.title}</Link>
          <p className={styles.description}>{product.description}</p>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.price}>{formatPrice(product.base_price)}</div>
          <div className={styles.rating}>
            <Star size={16} aria-hidden />
            {ratingValue}
            {ratingCount > 0 && <span className={styles.ratingCount}>({ratingCount})</span>}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="btn primary"
            onClick={handleQuickAdd}
          >
            <Plus size={16} aria-hidden />
            Quick add
          </button>
        </div>
      </div>
    </article>
  )
}
