import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './LoginPage.css'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { loginWithEmail, loginWithGoogle } = useAuth()

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const result = await loginWithEmail(email, password)
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    
    const result = await loginWithGoogle()
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleTestLogin = () => {
    setEmail('test@test.pl')
    setPassword('123456')
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>AgroFarm</h1>
          <p>Zaloguj się do systemu zarządzania gospodarstwem</p>
        </div>
        
        <form onSubmit={handleEmailLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
        
        <div className="login-divider">
          <span>LUB</span>
        </div>
        
        <button 
          onClick={handleGoogleLogin}
          className="google-login-button"
          disabled={loading}
        >
          Zaloguj się przez Google
        </button>
        
        <button 
          onClick={handleTestLogin}
          className="test-login-button"
        >
          Użyj testowych danych
        </button>
        
        <div className="test-credentials">
          <p>Testowe dane:</p>
          <p>Email: test@test.pl</p>
          <p>Hasło: 123456</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage