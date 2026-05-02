import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-container-padding">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="material-symbols-outlined text-primary text-[40px]">dentistry</span>
          <h1 className="font-h1 text-h1 text-on-surface">Conecta Odonto</h1>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant/20">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[24px]">admin_panel_settings</span>
            <h2 className="font-h2 text-h2 text-on-surface">Portal Admin</h2>
          </div>

          {error && (
            <div className="p-3 rounded-lg mb-4 bg-error-container text-on-error-container flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@conectaodonto.com"
                required
                className="w-full bg-surface-container rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-outline"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-container rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-outline"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-on-primary rounded-lg font-button shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
