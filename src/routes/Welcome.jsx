import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Welcome.module.css'

const highlights = [
  { label: 'Designs live', value: '40+' },
  { label: 'Next-day delivery', value: 'Morocco' },
  { label: 'Community', value: '7K+ fans' }
]

export default function Welcome(){
  return (
    <section className={`section ${styles.hero}`}>
      <div className="container">
        <div className={`${styles.panel} card glass`}>
          <div className={styles.copy}>
            <span className="eyebrow">Welcome to Haruki</span>
            <h1>Anime tees & hoodies built for everyday wear</h1>
            <p>Premium fabrics. Officially inspired artwork. Limited drops every week for the fandom that lives beyond the screen.</p>
            <div className={styles.actions}>
              <Link to="/catalog" className="btn primary">Browse catalog</Link>
              <Link to="/account" className="btn ghost">Sign in</Link>
            </div>
          </div>

          <div className={styles.highlights}>
            {highlights.map(item => (
              <div key={item.label} className={styles.highlight}>
                <span className={styles.highlightValue}>{item.value}</span>
                <span className={styles.highlightLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
