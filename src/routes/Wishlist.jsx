import React, { useEffect, useState } from 'react'
import ProductCard from '../components/Product/ProductCard'
import { useCartStore } from '../stores/cartStore'
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

export default function Wishlist(){
  const wishlist = useCartStore(s => s.wishlist)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load(){
      if(!wishlist.length){
        setProducts([])
        return
      }
      setLoading(true)
      setError('')
      try{
        if(!hasSupabaseConfig){
          throw new Error('Supabase configuration missing. Wishlist items require products stored in the database.')
        }
        const { data, error } = await supabase
          .from('products')
          .select('*, product_images(*), product_ratings(rating)')
          .in('id', wishlist)
        if(error) throw error
        const orderByWishlist = (data || []).map(mapProduct).sort((a, b) => wishlist.indexOf(a.id) - wishlist.indexOf(b.id))
        setProducts(orderByWishlist)
      } catch(err){
        console.error(err)
        setError(err.message || 'Failed to load wishlist')
        setProducts([])
      } finally{
        setLoading(false)
      }
    }
    load()
  }, [wishlist])

  return (
    <div className="container" style={{padding:'24px 0', display:'grid', gap:16}}>
      <h2>Wishlist</h2>
      {loading && <div className="text-soft">Loading wishlist...</div>}
      {!loading && error && <div className="badge" style={{background:'rgba(255,23,68,0.12)', borderColor:'transparent', color:'var(--danger)'}}>{error}</div>}
      {!loading && !error && !products.length && <div className="text-soft">No items saved yet.</div>}
      <div className="grid products">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
