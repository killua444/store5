import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../stores/adminAuth'

export default function AdminRoute({ children }){
  const authorized = useAdminAuth(s => s.authorized)
  const location = useLocation()

  if (!authorized) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
  }

  return children
}
