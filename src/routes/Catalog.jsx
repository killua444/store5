import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/Product/ProductCard'
import styles from './Catalog.module.css'
import { supabase, hasSupabaseConfig } from '../lib/supabaseClient'

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price - Low to High' },
  { value: 'price-desc', label: 'Price - High to Low' },
  { value: 'popularity', label: 'Top rated' }
]

function mapProduct(record){
  return {
    ...record,
    images: record.product_images || record.images || [],
    rating: record.rating || 4.8,
  }
}

export default function Catalog(){
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const q = params.get('q')?.toLowerCase() || ''
  const pageSize = 12

  useEffect(() => {
    async function load(){
      setLoading(true)
      setError('')
      try{
        if(!hasSupabaseConfig){
          throw new Error('Supabase configuration missing. Add products from the admin area once the database is ready.')
        }
        const { data, error } = await supabase
          .from('products')
          .select('*, product_images(*)')
          .eq('active', true)
          .order('created_at', { ascending: false })
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

  useEffect(() => {
    setPage(1)
  }, [q, sort])

  const filtered = useMemo(() => {
    let list = products
    if (q) {
      list = list.filter(p => p.title.toLowerCase().includes(q))
    }
    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => a.base_price - b.base_price)
      case 'price-desc':
        return [...list].sort((a, b) => b.base_price - a.base_price)
      case 'popularity':
        return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))
      default:
        return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [products, q, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  function clearSearch(){
    setParams(current => {
      const next = new URLSearchParams(current)
      next.delete('q')
      return next
    })
  }

  return (
    <section className={`section ${styles.catalog}`}>
      <div className="container">
        <header className={styles.header}>
          <div className={styles.heading}>
            <span className="eyebrow">Catalog</span>
            <h1>Find your next favorite piece</h1>
            <p>{filtered.length} {filtered.length === 1 ? 'product' : 'products'} {q && <>for '{q}'</>}</p>
          </div>
          <div className={styles.controls}>
            {q && <button type="button" className="btn ghost" onClick={clearSearch}>Clear search</button>}
            <select
              className={styles.select}
              value={sort}
              onChange={event => setSort(event.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid products">
          {loading && Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="card" style={{padding:16}}>
              <div className="skeleton" style={{aspectRatio:'4/5'}} />
            </div>
          ))}
          {!loading && !error && pageItems.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
          {!loading && error && (
            <div className="card" style={{padding:16}}>
              <strong style={{color:'var(--danger)'}}>{error}</strong>
              <p className="text-soft">Add products in the admin panel to populate the catalog.</p>
            </div>
          )}
          {!loading && !error && !pageItems.length && (
            <div className="card" style={{padding:16}}>
              <strong>No products match your filters yet.</strong>
              <p className="text-soft">Try adjusting search or add new products from the admin.</p>
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className={styles.pagination}>
            <button className="btn ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </button>
            <span className="badge">{page}/{totalPages}</span>
            <button className="btn ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
