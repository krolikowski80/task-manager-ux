import { useState } from 'react';
import './auth.css';

function Login({ onLogin, switchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'https://app.krolikowski.cloud/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user, data.access_token);
      } else {
        setError(data.error || 'Błąd logowania');
      }
    } catch (error) {
      setError('Błąd połączenia z serwerem');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'guest', password: 'guest' }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user, data.access_token);
      } else {
        setError('Błąd logowania jako gość');
      }
    } catch (error) {
      setError('Błąd połączenia z serwerem');
      console.error('Guest login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Logowanie</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nazwa użytkownika:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Wprowadź nazwę użytkownika"
            />
          </div>

          <div className="form-group">
            <label>Hasło:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Wprowadź hasło"
            />
          </div>

          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? 'Logowanie...' : '🔑 Zaloguj się'}
          </button>
        </form>

        <div className="guest-section">
          <div className="divider">
            <span>lub</span>
          </div>
          
          <button 
            type="button" 
            onClick={handleGuestLogin}
            className="guest-button"
            disabled={isLoading}
          >
            {isLoading ? 'Ładowanie...' : '👤 Wejdź jako gość'}
          </button>
        </div>

        <p className="auth-switch">
          Nie masz konta?{' '}
          <button 
            type="button" 
            onClick={switchToRegister}
            className="link-button"
            disabled={isLoading}
          >
            Zarejestruj się
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;