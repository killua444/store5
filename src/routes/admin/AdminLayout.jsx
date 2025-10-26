import React, { useMemo } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package2,
  ShoppingBag,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react'
import { useAdminAuth } from '../../stores/adminAuth'

const navLinks = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package2 },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/settings', label: 'Settings', icon: SlidersHorizontal },
]

export default function AdminLayout(){
  const navigate = useNavigate()
  const location = useLocation()
  const email = useAdminAuth(s => s.email)
  const logout = useAdminAuth(s => s.logout)

  const activeSection = useMemo(() => {
    const match = navLinks.find(link => {
      if(link.end){
        return location.pathname === link.to
      }
      return location.pathname.startsWith(link.to)
    })
    return match?.label || 'Overview'
  }, [location.pathname])

  function handleLogout(){
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="container" style={{padding:'32px 0'}}>
      <div style={{display:'grid', gap:24, gridTemplateColumns:'minmax(220px, 260px) minmax(0, 1fr)'}}>
        <aside
          style={{
            position:'sticky',
            top:24,
            alignSelf:'start',
            display:'grid',
            gap:16,
            padding:20,
            borderRadius:'16px',
            background:'linear-gradient(160deg, rgba(10,14,36,0.95), rgba(10,10,35,0.7))',
            border:'1px solid rgba(130,148,220,0.2)',
            boxShadow:'var(--shadow-sm)',
          }}
        >
          <div style={{display:'grid', gap:8}}>
            <span className="badge primary" style={{justifySelf:'start'}}>Admin</span>
            <div style={{display:'grid', gap:4}}>
              <strong style={{fontSize:'1.1rem'}}>{email}</strong>
              <span className="text-micro">Manage products, orders, and storefront settings</span>
            </div>
          </div>

          <nav style={{display:'grid', gap:8}}>
            {navLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `${isActive ? 'btn primary' : 'btn ghost'}`}
                style={{justifyContent:'flex-start', gap:10}}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="btn ghost"
            onClick={handleLogout}
            style={{display:'flex', gap:10, justifyContent:'flex-start'}}
          >
            <LogOut size={18} />
            Log out
          </button>
        </aside>

        <section style={{display:'grid', gap:24}}>
          <header style={{display:'flex', flexWrap:'wrap', gap:12, alignItems:'center', justifyContent:'space-between'}}>
            <div>
              <h2 style={{margin:0}}>{activeSection}</h2>
              <p className="text-soft" style={{margin:0}}>Monitor store performance and keep the catalog fresh.</p>
            </div>
          </header>
          <Outlet />
        </section>
      </div>
    </div>
  )
}
