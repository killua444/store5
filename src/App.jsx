import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header/Header.jsx'
import Footer from './components/Footer/Footer.jsx'
import Home from './routes/Home.jsx'
import Welcome from './routes/Welcome.jsx'
import Catalog from './routes/Catalog.jsx'
import CartPage from './routes/CartPage.jsx'
import Account from './routes/Account.jsx'
import AdminLayout from './routes/admin/AdminLayout.jsx'
import AdminDashboard from './routes/admin/AdminDashboard.jsx'
import AdminProducts from './routes/admin/AdminProducts.jsx'
import AdminOrders from './routes/admin/AdminOrders.jsx'
import AdminSettings from './routes/admin/AdminSettings.jsx'
import AdminLogin from './routes/admin/AdminLogin.jsx'
import AdminRoute from './routes/admin/AdminRoute.jsx'
import Toast from './components/Toast/Toast.jsx'
import CartDrawer from './components/Cart/CartDrawer.jsx'
import { useThemeStore } from './stores/themeStore.js'
import { useAuth } from './lib/useAuth.js'

const ProductDetail = lazy(() => import('./routes/ProductDetail.jsx'))

export default function App() {
  useAuth()
  const theme = useThemeStore(s => s.theme)

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('theme-light', 'theme-dark')
    html.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light')
  }, [theme])

  return (
    <div className="app-root">
      <Header />
      <main>
        <Suspense fallback={<div className="skeleton" style={{height:120}}/>}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/home" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace/>} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <Toast />
    </div>
  )
}
