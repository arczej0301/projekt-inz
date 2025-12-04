import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './LoginPage.css'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  
  const { loginWithEmail, loginWithGoogle, registerWithEmail } = useAuth()

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

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Walidacja hasła
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne')
      setLoading(false)
      return
    }
    
    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków')
      setLoading(false)
      return
    }
    
    const result = await registerWithEmail(email, password, {
      fullName,
      address,
      phone,
      createdAt: new Date().toISOString()
    })
    
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

  const toggleRegisterMode = () => {
    setIsRegistering(!isRegistering)
    setError('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setAddress('')
    setPhone('')
  }

  return (
    <div className="login-page">
      <div className={`login-container ${isRegistering ? 'register-mode' : ''}`}>
        <div className="login-header">
          <h1>AgroFarm</h1>
          <p>{isRegistering ? 'Utwórz nowe konto' : 'Zaloguj się do systemu zarządzania gospodarstwem'}</p>
        </div>
        
        <form onSubmit={isRegistering ? handleRegister : handleEmailLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          {isRegistering && (
            <>
              <div className="form-group">
                <label>Imię i nazwisko</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Adres</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Numer telefonu</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          
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
              minLength={6}
            />
          </div>
          
          {isRegistering && (
            <div className="form-group">
              <label>Powtórz hasło</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (isRegistering ? 'Rejestracja...' : 'Logowanie...') : (isRegistering ? 'Zarejestruj się' : 'Zaloguj się')}
          </button>
        </form>
        
        {!isRegistering && (
          <>
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
          </>
        )}
        
        <div className="toggle-register">
          <p>
            {isRegistering ? 'Masz już konto?' : 'Nie masz jeszcze konta?'}
            <button 
              type="button" 
              onClick={toggleRegisterMode}
              className="toggle-button"
            >
              {isRegistering ? 'Zaloguj się' : 'Utwórz konto'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage