import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  login: () => void
  loginWithToken: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'qubera_auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setIsAuthenticated(e.newValue === '1')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // storage unavailable
    }
    setIsAuthenticated(true)
  }

  const loginWithToken = (token: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
      localStorage.setItem('qubera_token', token)
    } catch {
      // storage unavailable
    }
    setIsAuthenticated(true)
  }

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('qubera_token')
      localStorage.removeItem('qubera_user')
    } catch {
      // ignore
    }
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
