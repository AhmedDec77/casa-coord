import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TRADE_LABELS } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export default function AppShell({ children }) {
  const { profile, signOut } = useAuth()
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>
          CASA <span style={{ color: 'var(--accent)' }}>Coord</span>
        </Link>
        <div style={styles.userBlock}>
          {profile && (
            <div style={styles.userInfo}>
              <span style={styles.userName}>{profile.full_name}</span>
              <span style={styles.userTrade}>{TRADE_LABELS[profile.trade]}</span>
            </div>
          )}
          <button onClick={() => setShowPasswordModal(true)} style={styles.passwordButton}>
            🔑
          </button>
          <button onClick={signOut} style={styles.logoutButton}>
            Abmelden
          </button>
        </div>
      </header>
      <main style={styles.main}>{children}</main>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  )
}

function ChangePasswordModal({ onClose }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
    setTimeout(() => onClose(), 2000)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Passwort ändern</h2>

        {success ? (
          <div style={styles.successMsg}>
            ✓ Passwort erfolgreich geändert.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={styles.label}>
              Neues Passwort
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={styles.input}
                placeholder="Mindestens 8 Zeichen"
              />
            </label>
            <label style={styles.label}>
              Passwort bestätigen
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                style={styles.input}
              />
            </label>

            {error && <div style={styles.errorMsg}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={styles.cancelButton}>
                Abbrechen
              </button>
              <button type="submit" disabled={submitting} style={styles.submitButton}>
                {submitting ? 'Wird gespeichert…' : 'Passwort ändern'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 28px',
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--line)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 19,
    fontWeight: 700,
    color: 'var(--ink)',
    textDecoration: 'none',
  },
  userBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    lineHeight: 1.3,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
  },
  userTrade: {
    fontSize: 11,
    color: 'var(--ink-soft)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  passwordButton: {
    fontSize: 14,
    padding: '7px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    cursor: 'pointer',
    color: 'var(--ink-soft)',
  },
  logoutButton: {
    fontSize: 12,
    padding: '7px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    cursor: 'pointer',
    color: 'var(--ink-soft)',
  },
  main: {
    flex: 1,
    padding: '28px',
    maxWidth: 1280,
    width: '100%',
    margin: '0 auto',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28, 26, 23, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 60,
  },
  modal: {
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
    width: '100%',
    maxWidth: 380,
    boxShadow: 'var(--shadow-md)',
  },
  modalTitle: {
    fontSize: 19,
    marginBottom: 18,
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
    fontSize: 14,
    fontFamily: 'inherit',
  },
  errorMsg: {
    background: '#fef2f2',
    color: '#b91c1c',
    fontSize: 13,
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #fecaca',
  },
  successMsg: {
    background: '#f0fdf4',
    color: '#16a34a',
    fontSize: 14,
    fontWeight: 600,
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    textAlign: 'center',
  },
  cancelButton: {
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    color: 'var(--ink)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--ink)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
