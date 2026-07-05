import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../../../services/httpClient';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';
import styles from './AuthForm.module.css';

type Tab = 'login' | 'register';

export function AuthForm() {
  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/orgs');
    } catch (err) {
      setError(err instanceof ApiError ? err.messages.join(' ') : 'Não foi possível concluir a ação.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
          onClick={() => setTab('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
          onClick={() => setTab('register')}
        >
          Cadastro
        </button>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        {tab === 'register' && (
          <TextField
            id="name"
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        )}
        <TextField
          id="email"
          type="email"
          label="E-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <div>
          <TextField
            id="password"
            type="password"
            label="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
          {tab === 'register' && <p className={styles.hint}>Mínimo de 8 caracteres.</p>}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" fullWidth disabled={submitting}>
          {tab === 'login' ? 'Entrar' : 'Criar conta'}
        </Button>
      </form>
    </div>
  );
}
