import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-Mail oder Passwort falsch.'
          : error.message
      )
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.eyebrow}>Baustellen-Koordination</div>
        <h1 style={styles.title}>CASA Coord</h1>
        <p style={styles.subtitle}>
          Anmelden, um den Projektfortschritt zu verfolgen.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            E-Mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
            />
          </label>
          <label style={styles.label}>
            Passwort
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'radial-gradient(circle at 20% 20%, #eceae4 0%, var(--bg) 55%)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    padding: '36px 32px',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-soft)',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    marginBottom: 6,
  },
  subtitle: {
    color: 'var(--ink-soft)',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ink-soft)',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    color: 'var(--ink)',
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    fontSize: 13,
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #fecaca',
  },
  button: {
    marginTop: 4,
    padding: '11px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--ink)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
