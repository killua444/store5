import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, Sun, Moon, Search } from 'lucide-react'
import styles from './Header.module.css'
import { useThemeStore } from '../../stores/themeStore'
import { useCartStore } from '../../stores/cartStore'

export default function Header() {
  const brandLogo = import.meta.env.VITE_LOGO_MAIN || '/assets/haruki-logo.svg'
  const fallbackLogo = import.meta.env.VITE_LOGO_FALLBACK || '/assets/haruki-logo.svg'

  const toggle = useThemeStore(s => s.toggle)
  const theme = useThemeStore(s => s.theme)
  const items = useCartStore(s => s.items)
  const wishlist = useCartStore(s => s.wishlist)
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q')?.toString().trim() || ''
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog')
  }
  return (
    <header className={`header ${styles.header}`}>
      <div className="container">
        <div className={styles.layout}>
          <div className={styles.brandBlock}>
            <Link to="/" className={styles.brand} aria-label="Go to home">
              <img
                src={brandLogo}
                alt="Haruki logo"
                className={styles.brandLogo}
                onError={event => { event.currentTarget.src = fallbackLogo }}
              />
            </Link>
            <span className={styles.tagline}>Anime streetwear & collectibles</span>
          </div>

          <form onSubmit={onSubmit} className={styles.search} role="search">
            <Search size={18} aria-hidden />
            <input
              name="q"
              placeholder="Search anime tees & hoodies"
              aria-label="Search products"
              autoComplete="off"
            />
            <button type="submit" className={styles.searchAction}>Search</button>
          </form>

          <nav className={styles.nav} aria-label="Primary">
            <Link to="/catalog" className={styles.link}>Shop</Link>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.ghostButton}`}
              onClick={toggle}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/wishlist" className={`${styles.iconButton} ${styles.softButton}`} aria-label="Wishlist">
              <Heart size={18} />
              <span className={styles.label}>Wishlist</span>
              <span className={styles.counter}>{wishlist.length}</span>
            </Link>
            <Link to="/cart" className={`${styles.iconButton} ${styles.primaryButton}`} aria-label="Cart">
              <ShoppingCart size={18} />
              <span className={styles.label}>Cart</span>
              <span className={styles.counter}>{items.length}</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
