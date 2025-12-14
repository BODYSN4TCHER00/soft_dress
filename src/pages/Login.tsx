import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado (solo una vez)
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/staff/menu';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login({ email, password });
      
      if (!success) {
        // Verificar si el usuario existe pero está inactivo
        // El AuthContext ya maneja el cierre de sesión para usuarios inactivos
        setError('Credenciales inválidas o tu cuenta está inactiva. Contacta al administrador.');
        setLoading(false);
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Soft Dress</h1>
          <p>Iniciar Sesión</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

