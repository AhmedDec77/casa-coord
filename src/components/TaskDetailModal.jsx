import { TRADE_LABELS, TRADE_COLORS, STATUS_LABELS, STATUS_COLORS } from '../lib/supabase'
import TaskBlockersList from './TaskBlockersList'

export default function TaskDetailModal({ task, profiles, onClose }) {
  const assignee = profiles?.find((p) => p.id === task.assigned_to)

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeButton} aria-label="Schließen">
          ✕
        </button>

        <div style={styles.headerRow}>
          <span
            style={{
              ...styles.badge,
              background: TRADE_COLORS[task.trade] + '22',
              color: TRADE_COLORS[task.trade],
            }}
          >
            {TRADE_LABELS[task.trade]}
          </span>
          <span
            style={{
              ...styles.badge,
              background: STATUS_COLORS[task.status] + '22',
              color: STATUS_COLORS[task.status],
            }}
          >
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        <h2 style={styles.title}>{task.title}</h2>

        {task.description && task.description !== task.title && (
          <p style={styles.description}>{task.description}</p>
        )}

        <div style={styles.metaGrid}>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Zugewiesen an</span>
            <span style={styles.metaValue}>{assignee ? assignee.full_name : '—'}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Zeitraum</span>
            <span style={styles.metaValue}>
              {formatDate(task.start_date)} → {formatDate(task.end_date)}
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Fortschritt</span>
            <span style={styles.metaValue}>{task.progress}%</span>
          </div>
        </div>

        <div style={styles.blockersSection}>
          <span style={styles.metaLabel}>Blockierungsverlauf</span>
          <TaskBlockersListAlways taskId={task.id} />
        </div>
      </div>
    </div>
  )
}

// Affiche l'historique des blocages même si la tâche n'est plus bloquée actuellement
// (TaskBlockersList lui-même gère déjà le "rien à afficher si vide").
function TaskBlockersListAlways({ taskId }) {
  return <TaskBlockersList taskId={taskId} />
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const styles = {
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
    position: 'relative',
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
    width: '100%',
    maxWidth: 520,
    boxShadow: 'var(--shadow-md)',
    maxHeight: '85vh',
    overflowY: 'auto',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--ink-soft)',
  },
  headerRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 19,
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: 12,
    paddingRight: 30,
  },
  description: {
    fontSize: 14,
    color: 'var(--ink-soft)',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    marginBottom: 20,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 14,
    padding: '16px 0',
    borderTop: '1px solid var(--line)',
    borderBottom: '1px solid var(--line)',
    marginBottom: 18,
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--ink-soft)',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 600,
  },
  blockersSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
}
