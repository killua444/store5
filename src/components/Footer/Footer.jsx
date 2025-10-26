import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

const YEAR = new Date().getFullYear()

export default function Footer(){
  const roundLogo = import.meta.env.VITE_LOGO_ROUND || import.meta.env.VITE_LOGO_MAIN || '/assets/haruki-logo.svg'
  const fallbackLogo = import.meta.env.VITE_LOGO_FALLBACK || '/assets/haruki-logo.svg'

  return (
    <footer className={`footer ${styles.footer}`}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logo} aria-label="Haruki home">
              <img
                src={roundLogo}
                alt="Haruki logo"
                onError={event => { event.currentTarget.src = fallbackLogo }}
              />
            </Link>
            <p>Anime-first streetwear. Premium fabrics, limited drops, curated for the fandom.</p>
          </div>

          <nav className={styles.links} aria-label="Footer navigation">
            <Link to="/catalog">Catalog</Link>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/cart">Cart</Link>
          </nav>

          <div className={styles.meta}>
            <span className="eyebrow">Support</span>
            <a className={styles.metaLink} href="mailto:support@haruki.store">support@haruki.store</a>
            <span className={styles.metaText}>Mon — Sat · 10:00 — 18:00 GMT</span>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© {YEAR} Haruki. All rights reserved.</span>
          <div className={styles.bottomLinks}>
            <Link to="/catalog">Latest drops</Link>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
