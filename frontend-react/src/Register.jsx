import { useState } from 'react';
import './auth.css';

function Register({ onLogin, switchToLogin }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = 'https://app.krolikowski.cloud/api';
    //const API_URL = 'https://app.krolikowski.cloud:5000';  // Zmiana na HTTPS dla bezpieczeństwa
    // const API_URL = 'http://localhost:5000'; // Dla lokalnego testowania
    // const API_URL = 'http://85.193.192.108:5000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Walidacja po stronie frontend
        if (password !== confirmPassword) {
            setError('Hasła nie są identyczne');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Hasło musi mieć co najmniej 6 znaków');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Automatyczne logowanie po rejestracji
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Wywołaj callback do App.jsx
                onLogin(data.user, data.access_token);
            } else {
                setError(data.error || 'Błąd rejestracji');
            }
        } catch (error) {
            setError('Błąd połączenia z serwerem');
            console.error('Register error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Rejestracja</h2>

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
                            placeholder="Wybierz nazwę użytkownika"
                            minLength="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            placeholder="Wprowadź adres email"
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
                            placeholder="Wprowadź hasło (min. 6 znaków)"
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label>Potwierdź hasło:</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            placeholder="Wprowadź hasło ponownie"
                            minLength="6"
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="auth-button">
                        {isLoading ? 'Rejestracja...' : '✨ Utwórz konto'}
                    </button>
                </form>

                <p className="auth-switch">
                    Masz już konto?{' '}
                    <button
                        type="button"
                        onClick={switchToLogin}
                        className="link-button"
                        disabled={isLoading}
                    >
                        Zaloguj się
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Register;