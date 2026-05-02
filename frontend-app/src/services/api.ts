import { supabase } from '../lib/supabase'

const BASE_URL = 'http://127.0.0.1:8000/api'

async function getHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {}
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

async function handleResponse(response: Response) {
  if (response.status === 401) {
    await supabase.auth.signOut()
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Erro: ${response.statusText}`)
  }
  return response.json()
}

export const api = {
  get: async (endpoint: string) => {
    const headers = await getHeaders()
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers })
    return handleResponse(response)
  },

  post: async (endpoint: string, body?: unknown) => {
    const headers = await getHeaders()
    headers['Content-Type'] = 'application/json'
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse(response)
  },

  patch: async (endpoint: string, body: unknown) => {
    const headers = await getHeaders()
    headers['Content-Type'] = 'application/json'
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })
    return handleResponse(response)
  },

  delete: async (endpoint: string) => {
    const headers = await getHeaders()
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })
    return handleResponse(response)
  }
}
