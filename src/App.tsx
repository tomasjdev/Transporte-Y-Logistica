import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import CapturaViaje from './pages/bitacora/CapturaViaje'
import ListaViajes from './pages/bitacora/ListaViajes'
import Boleta from './pages/bitacora/Boleta'
import Catalogos from './pages/bitacora/Catalogos'
import Productos from './pages/inventario/Productos'
import RegistroMovimiento from './pages/inventario/RegistroMovimiento'
import Movimientos from './pages/inventario/Movimientos'

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
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bitacora"
          element={
            <ProtectedRoute>
              <Layout>
                <ListaViajes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bitacora/boleta/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Boleta />
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
        <Route
          path="/bitacora/catalogos"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>
                <Catalogos />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario"
          element={
            <ProtectedRoute>
              <Layout>
                <Productos />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario/movimientos/nuevo"
          element={
            <ProtectedRoute>
              <Layout>
                <RegistroMovimiento />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario/movimientos"
          element={
            <ProtectedRoute>
              <Layout>
                <Movimientos />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
