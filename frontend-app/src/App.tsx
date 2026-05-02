import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Mapa from './pages/Mapa'
import Unidades from './pages/Unidades'
import Detalhes from './pages/Detalhes'
import Triagem from './pages/Triagem'
import Admin from './pages/Admin'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Mapa />} />
            <Route path="clinicas" element={<Unidades />} />
            <Route path="clinicas/:id" element={<Detalhes />} />
            <Route path="triagem" element={<Triagem />} />
            <Route path="admin" element={
              <ProtectedRoute><Admin /></ProtectedRoute>
            } />
          </Route>
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
