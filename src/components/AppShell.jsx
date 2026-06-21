import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TRADE_LABELS } from '../lib/supabase'

export default function AppShell({ children }) {
  const { profile, signOut } = useAuth()

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
          <button onClick={signOut} style={styles.logoutButton}>
            Abmelden
          </button>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
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
    gap: 14,
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
}
