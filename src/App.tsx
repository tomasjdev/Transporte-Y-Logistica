import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import CapturaViaje from './pages/bitacora/CapturaViaje'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <div>Dashboard (pendiente)</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bitacora/viajes/nuevo"
          element={
            <ProtectedRoute>
              <Layout>
                <CapturaViaje />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bitacora/viajes/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CapturaViaje />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
