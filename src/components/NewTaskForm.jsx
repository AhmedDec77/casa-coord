import { useState } from 'react'
import { TRADE_LABELS } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function NewTaskForm({ profiles, onCreate }) {
  const { user, isAdmin, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [trade, setTrade] = useState(profile?.trade === 'architecte' || profile?.trade === 'coordinateur' ? 'general' : profile?.trade || 'general')
  const [assignedTo, setAssignedTo] = useState(isAdmin ? '' : user.id)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onCreate({
        title,
        trade,
        assigned_to: assignedTo || (isAdmin ? null : user.id),
        start_date: startDate,
        end_date: endDate || startDate,
        status: 'a_faire',
        progress: 0,
      })
      setTitle('')
      setStartDate('')
      setEndDate('')
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={styles.openButton}>
        + Aufgabe hinzufügen
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        required
        placeholder="Name der Aufgabe"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ ...styles.input, flex: '2 1 220px' }}
      />
      <select value={trade} onChange={(e) => setTrade(e.target.value)} style={styles.input}>
        {Object.entries(TRADE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {isAdmin && (
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={styles.input}>
          <option value="">Zuweisen an…</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      )}
      <input
        required
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={styles.input}
        title="Startdatum"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={styles.input}
        title="Enddatum (optional, sonst = Start)"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setOpen(false)} style={styles.cancelButton}>
          Abbrechen
        </button>
        <button type="submit" disabled={submitting} style={styles.submitButton}>
          {submitting ? 'Wird hinzugefügt…' : 'Hinzufügen'}
        </button>
      </div>
      {error && <div style={{ color: '#b91c1c', fontSize: 12, width: '100%' }}>{error}</div>}
    </form>
  )
}

const styles = {
  openButton: {
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px dashed var(--line-strong)',
    background: 'transparent',
    color: 'var(--ink-soft)',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 16,
  },
  form: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    padding: 14,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 16,
  },
  input: {
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    fontSize: 13,
  },
  cancelButton: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
  submitButton: {
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--ink)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  },
}
