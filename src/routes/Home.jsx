import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/Product/ProductCard'
import styles from './Home.module.css'
import { supabase, hasSupabaseConfig } from '../lib/supabaseClient'

function mapProduct(record){
  const ratings = record.product_ratings || []
  const count = ratings.length
  const average = count
    ? ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / count
    : null
  const fallback = record.rating != null ? Number(record.rating) : null
  return {
    ...record,
    images: record.product_images || record.images || [],
    rating: average ?? fallback ?? 0,
    rating_count: count,
  }
}

export default function Home(){
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load(){
      setLoading(true)
      setError('')
      try{
        if(!hasSupabaseConfig){
          throw new Error('Supabase configuration missing. Add products once your database is ready.')
        }
        const { data, error } = await supabase
          .from('products')
          .select('*, product_images(*), product_ratings(rating)')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(8)
        if(error) throw error
        setProducts((data || []).map(mapProduct))
      } catch(err){
        console.error(err)
        setError(err.message || 'Failed to load products')
        setProducts([])
      } finally{
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className={styles.page}>
      <section className={`section ${styles.hero}`}>
        <div className="container">
          <div className={`${styles.heroCard} card glass`}>
            <div className={styles.heroCopy}>
              <span className="eyebrow">Season 03 · Drop 05</span>
              <h1>Bold prints, fan energy, everyday comfort.</h1>
              <p>Curated anime tees & hoodies designed with the community. Premium fabrics, obsessively detailed artwork, limited releases weekly.</p>
              <div className={styles.heroActions}>
                <Link to="/catalog" className="btn primary">Shop now</Link>
                <Link to="/catalog?q=hoodie" className="btn ghost">New hoodies</Link>
              </div>
            </div>

            <div className={styles.heroStats}>
              <div>
                <span className={styles.statValue}>24h</span>
                <span className={styles.statLabel}>Express shipping</span>
              </div>
              <div>
                <span className={styles.statValue}>Premium</span>
                <span className={styles.statLabel}>Combed cotton blends</span>
              </div>
              <div>
                <span className={styles.statValue}>Limited</span>
                <span className={styles.statLabel}>Weekly drops only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <span className="eyebrow">Featured</span>
              <h2>Fresh arrivals</h2>
            </div>
            <Link to="/catalog" className="btn ghost">View full catalog</Link>
          </div>

          <div className="grid products">
            {loading && Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="card" style={{padding:16}}>
                <div className="skeleton" style={{aspectRatio:'4/5'}} />
              </div>
            ))}
            {!loading && !error && products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
            {!loading && error && (
              <div className="card" style={{padding:16}}>
                <strong style={{color:'var(--danger)'}}>{error}</strong>
                <p className="text-soft">Visit the admin panel to add products.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
