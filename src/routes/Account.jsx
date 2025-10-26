import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabaseClient'

const schema = yup.object({
  full_name: yup.string().required(),
  phone: yup.string().nullable(),
  default_address: yup.string().nullable(),
})

export default function Account(){
  const session = useAuthStore(s=>s.session)
  const profile = useAuthStore(s=>s.profile)
  const fetchProfile = useAuthStore(s=>s.fetchProfile)

  const { register, handleSubmit, reset, formState:{ errors } } = useForm({ resolver: yupResolver(schema), values: { full_name: profile?.full_name || '', phone: profile?.phone || '', default_address: profile?.default_address || '' } })

  async function onSubmit(values){
    if(!session) return alert('Sign in first')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...values })
    if(error) alert(error.message); else { alert('Saved'); fetchProfile() }
  }

  async function signIn(){
    const email = prompt('Email:')
    const password = prompt('Password:')
    const { error } = await useAuthStore.getState().signIn(email, password)
    if(error) alert(error.message)
  }

  async function signUp(){
    const email = prompt('Email:')
    const password = prompt('Password:')
    const { error } = await useAuthStore.getState().signUp(email, password)
    if(error) alert(error.message); else alert('Check your email to confirm')
  }

  return (
    <div className="container" style={{padding:'24px 0', display:'grid', gap:16}}>
      <h2>Account</h2>
      {!session && (
        <div className="card" style={{padding:12, display:'flex', gap:8}}>
          <button className="btn primary" onClick={signIn}>Sign In</button>
          <button className="btn" onClick={signUp}>Sign Up</button>
        </div>
      )}
      {session && (
        <div className="card" style={{padding:12}}>
          <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <label>Full Name</label>
              <input {...register('full_name')} />
              {errors.full_name && <span style={{color:'crimson'}}>{errors.full_name.message}</span>}
            </div>
            <div className="form-row">
              <label>Phone</label>
              <input {...register('phone')} />
            </div>
            <div className="form-row" style={{gridColumn:'1/-1'}}>
              <label>Default Address</label>
              <textarea rows="3" {...register('default_address')} />
            </div>
            <div style={{gridColumn:'1/-1', display:'flex', gap:8}}>
              <button className="btn primary" type="submit">Save</button>
              <button className="btn" type="button" onClick={()=> useAuthStore.getState().signOut()}>Sign Out</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
