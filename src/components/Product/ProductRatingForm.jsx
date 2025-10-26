import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { supabase, hasSupabaseConfig } from '../../lib/supabaseClient'

const stars = [1, 2, 3, 4, 5]

export default function ProductRatingForm({ productId, onSubmitted }) {
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!hasSupabaseConfig) {
      setError('Ratings are unavailable until Supabase is configured.')
      return
    }
    if (!email.trim()) {
      setError('Please provide an email so we can keep ratings unique.')
      return
    }
    if (!rating) {
      setError('Select a rating between 1 and 5 stars.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        product_id: productId,
        email: email.trim().toLowerCase(),
        rating,
        comment: comment.trim() || null,
      }
      const { error: upsertError } = await supabase
        .from('product_ratings')
        .upsert(payload, { onConflict: 'product_id,email' })
      if (upsertError) throw upsertError
      setMessage('Thanks! Your rating has been saved.')
      setSubmitting(false)
      if (onSubmitted) onSubmitted()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to save rating.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{padding:16, display:'grid', gap:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12}}>
        <div>
          <h3 style={{margin:0}}>Rate this product</h3>
          <p className="text-soft" style={{margin:0}}>We require an email address to keep ratings fair.</p>
        </div>
      </div>

      <label style={{display:'grid', gap:6}}>
        <span className="text-micro">Email</span>
        <input
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          disabled={submitting}
        />
      </label>

      <div style={{display:'grid', gap:8}}>
        <span className="text-micro">Rating</span>
        <div style={{display:'flex', gap:8}}>
          {stars.map(value => (
            <button
              key={value}
              type="button"
              className="btn ghost"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value > 1 ? 's' : ''}`}
              disabled={submitting}
              style={{display:'flex', alignItems:'center', gap:6, padding:'8px 12px'}}
            >
              <Star
                size={18}
                fill={value <= rating ? 'currentColor' : 'none'}
                strokeWidth={1.6}
              />
              {value}
            </button>
          ))}
        </div>
      </div>

      <label style={{display:'grid', gap:6}}>
        <span className="text-micro">Comment (optional)</span>
        <textarea
          rows={3}
          value={comment}
          onChange={event => setComment(event.target.value)}
          placeholder="What do you think of this product?"
          disabled={submitting}
        />
      </label>

      {error && <div className="badge" style={{background:'rgba(255,23,68,0.12)', borderColor:'transparent', color:'var(--danger)'}}>{error}</div>}
      {message && <div className="badge" style={{background:'rgba(46,204,113,0.16)', borderColor:'transparent', color:'var(--success)'}}>{message}</div>}

      <button type="submit" className="btn primary" disabled={submitting || !hasSupabaseConfig}>
        {submitting ? 'Submitting...' : 'Submit rating'}
      </button>
    </form>
  )
}
