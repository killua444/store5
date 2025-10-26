import React, { useEffect, useMemo, useState } from 'react'
import { supabase, hasSupabaseConfig } from '../../lib/supabaseClient'

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  base_price: '',
  currency: 'MAD',
  category_id: '',
  active: true,
}

function slugify(value = ''){
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractStoragePath(url){
  if(!url) return null
  const marker = '/storage/v1/object/public/product-images/'
  const idx = url.indexOf(marker)
  if(idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

export default function AdminProducts(){
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [imageProductId, setImageProductId] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    load()
  }, [])

  async function load(){
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), variants(*)')
      .order('created_at', { ascending: false })
    if(error) console.error(error)
    setProducts(data || [])
    setLoading(false)
  }

  function resetForm(){
    setForm(emptyForm)
    setEditingId(null)
  }

  function startEdit(product){
    setEditingId(product.id)
    setForm({
      title: product.title || '',
      slug: product.slug || '',
      description: product.description || '',
      base_price: product.base_price ?? '',
      currency: product.currency || 'MAD',
      category_id: product.category_id || '',
      active: product.active ?? true,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event){
    event.preventDefault()
    if(!form.title){
      alert('Title is required')
      return
    }
    const payload = {
      ...form,
      base_price: Number(form.base_price) || 0,
      slug: form.slug || slugify(form.title),
      category_id: form.category_id || null,
    }
    if(!payload.slug){
      alert('Unable to generate a slug, please enter one manually.')
      return
    }

    setSaving(true)
    const request = editingId
      ? supabase.from('products').update(payload).eq('id', editingId).select('id').single()
      : supabase.from('products').insert(payload).select('id').single()
    const { error } = await request
    setSaving(false)
    if(error){
      alert(error.message)
      return
    }

    resetForm()
    load()
  }

  async function handleDelete(product){
    if(!window.confirm(`Delete ${product.title}? This cannot be undone.`)) return
    setDeletingId(product.id)
    const imageIds = product.product_images?.map(img => img.id) || []
    const imagePaths = product.product_images?.map(img => extractStoragePath(img.url)).filter(Boolean) || []
    if(imageIds.length){
      await supabase.from('product_images').delete().in('id', imageIds)
    }
    if(imagePaths.length){
      await supabase.storage.from('product-images').remove(imagePaths)
    }
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    setDeletingId(null)
    if(error){
      alert(error.message)
      return
    }
    if(product.id === editingId){
      resetForm()
    }
    if(product.id === imageProductId){
      setImageProductId(null)
    }
    load()
  }

  function openImages(product){
    setImageProductId(product.id)
  }

  async function uploadImage(product){
    const promptForUrl = async () => {
      const url = window.prompt('Paste the hosted image URL (https://...)')
      if(!url) return
      const { error } = await supabase.from('product_images').insert({
        product_id: product.id,
        url: url.trim(),
        alt: product.title,
      })
      if(error){
        alert(error.message)
      } else {
        load()
      }
    }

    if(!hasSupabaseConfig){
      await promptForUrl()
      return
    }

    const picker = document.createElement('input')
    picker.type = 'file'
    picker.accept = 'image/*'
    picker.onchange = async () => {
      const file = picker.files?.[0]
      if(!file) return
      setUploadingImage(true)
      const extension = file.name.split('.').pop()
      const unique = (() => {
        if(typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`
      })()
      const path = `${product.id}/${unique}.${extension}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: false })
      if(uploadError){
        console.warn('Upload failed, switching to URL prompt.', uploadError)
        setUploadingImage(false)
        await promptForUrl()
        return
      }
      const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(path)
      const { error: insertError } = await supabase.from('product_images').insert({
        product_id: product.id,
        url: publicData.publicUrl,
        alt: product.title,
      })
      setUploadingImage(false)
      if(insertError){
        alert(insertError.message)
        return
      }
      load()
    }
    picker.click()
  }

  async function deleteImage(product, image){
    if(!window.confirm('Remove this image?')) return
    const path = extractStoragePath(image.url)
    if(path){
      await supabase.storage.from('product-images').remove([path])
    }
    const { error } = await supabase.from('product_images').delete().eq('id', image.id)
    if(error){
      alert(error.message)
      return
    }
    load()
  }

const imageProduct = useMemo(
  () => products.find(p => p.id === imageProductId),
  [imageProductId, products]
)

const filteredProducts = useMemo(() => {
  return products.filter(product => {
    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'active'
        ? product.active
        : !product.active
    const query = search.trim().toLowerCase()
    const matchesQuery = query
      ? [product.title, product.slug, product.currency].join(' ').toLowerCase().includes(query)
      : true
    return matchesStatus && matchesQuery
  })
}, [products, search, statusFilter])

  return (
    <div style={{display:'grid', gap:16}}>
      <div className="card" style={{padding:16, display:'grid', gap:16}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8}}>
          <h3>{editingId ? 'Edit product' : 'Create product'}</h3>
          {editingId && (
            <button type="button" className="btn ghost" onClick={resetForm}>Cancel edit</button>
          )}
        </div>
        <form className="form-grid" onSubmit={handleSubmit} style={{gap:16}}>
          <label style={{display:'grid', gap:6}}>
            <span className="text-micro">Title</span>
            <input value={form.title} onChange={e=> setForm(prev => ({...prev, title:e.target.value}))} required />
          </label>
          <label style={{display:'grid', gap:6}}>
            <span className="text-micro">Slug</span>
            <input value={form.slug} onChange={e=> setForm(prev => ({...prev, slug:e.target.value}))} placeholder="auto-generated if empty" />
          </label>
          <label style={{display:'grid', gap:6}}>
            <span className="text-micro">Price</span>
            <input type="number" step="0.01" value={form.base_price} onChange={e=> setForm(prev => ({...prev, base_price: e.target.value}))} required />
          </label>
          <label style={{display:'grid', gap:6}}>
            <span className="text-micro">Currency</span>
            <select value={form.currency} onChange={e=> setForm(prev => ({...prev, currency: e.target.value}))}>
              <option value="MAD">MAD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label style={{display:'grid', gap:6, gridColumn:'1/-1'}}>
            <span className="text-micro">Description</span>
            <textarea value={form.description} onChange={e=> setForm(prev => ({...prev, description:e.target.value}))} rows={4} />
          </label>
          <label style={{display:'grid', gap:6}}>
            <span className="text-micro">Category ID</span>
            <input value={form.category_id ?? ''} onChange={e=> setForm(prev => ({...prev, category_id: e.target.value}))} placeholder="Optional reference" />
          </label>
          <label style={{display:'flex', alignItems:'center', gap:8}}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={e=> setForm(prev => ({...prev, active: e.target.checked}))}
            />
            <span>Active</span>
          </label>
          <div style={{gridColumn:'1/-1', display:'flex', gap:12}}>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update product' : 'Create product'}
            </button>
            {!editingId && (
              <button type="button" className="btn ghost" onClick={resetForm}>Reset</button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{padding:16, display:'grid', gap:16}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
          <div>
            <h3 style={{margin:0}}>Products ({filteredProducts.length} / {products.length})</h3>
            {loading && <span className="text-micro">Refreshing…</span>}
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <input
              placeholder="Search products"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Price</th>
                <th>Status</th>
                <th>Images</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{textAlign:'center', padding:'16px 0', color:'var(--text-soft)'}}>No products yet.</td>
                </tr>
              )}
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>{product.slug}</td>
                  <td>{product.base_price} {product.currency}</td>
                  <td>{product.active ? <span className="badge primary">Active</span> : <span className="badge">Draft</span>}</td>
                  <td>{product.product_images?.length || 0}</td>
                  <td>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      <button type="button" className="btn" onClick={() => startEdit(product)}>Edit</button>
                      <button type="button" className="btn" onClick={() => openImages(product)}>Images</button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {imageProduct && (
        <div className="card" style={{padding:16, display:'grid', gap:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
            <div>
              <h3>Images · {imageProduct.title}</h3>
              <p className="text-soft">{imageProduct.product_images?.length || 0} image(s)</p>
              {!hasSupabaseConfig && (
                <span className="badge" style={{marginTop:4}}>
                  Storage disabled: paste hosted image URLs instead of uploading files.
                </span>
              )}
            </div>
            <div style={{display:'flex', gap:8}}>
              <button type="button" className="btn ghost" onClick={() => setImageProductId(null)}>Close</button>
              <button
                type="button"
                className="btn primary"
                onClick={() => uploadImage(imageProduct)}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Add image'}
              </button>
            </div>
          </div>
          <div style={{display:'grid', gap:12}}>
            {(imageProduct.product_images || []).length === 0 && (
              <div className="badge" style={{justifySelf:'start'}}>No images yet.</div>
            )}
            <div style={{display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))'}}>
              {(imageProduct.product_images || []).map(image => (
                <div key={image.id} className="card" style={{padding:12, display:'grid', gap:12}}>
                  <img src={image.url} alt={image.alt || imageProduct.title} style={{width:'100%', borderRadius:'12px', objectFit:'cover', aspectRatio:'1/1'}} />
                  <button type="button" className="btn ghost" onClick={() => deleteImage(imageProduct, image)}>Delete image</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
