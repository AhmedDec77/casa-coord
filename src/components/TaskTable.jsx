import { TRADE_LABELS, TRADE_COLORS, STATUS_LABELS, STATUS_COLORS } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function TaskTable({ tasks, profiles, onUpdate, onDelete }) {
  const { user, isAdmin } = useAuth()

  function canEdit(task) {
    return isAdmin || task.assigned_to === user.id
  }

  if (tasks.length === 0) {
    return <div style={styles.empty}>Noch keine Aufgaben. Füge oben die erste Aufgabe hinzu.</div>
  }

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Aufgabe</th>
            <th style={styles.th}>Gewerk</th>
            <th style={styles.th}>Zugewiesen an</th>
            <th style={styles.th}>Start</th>
            <th style={styles.th}>Ende</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Fortschritt</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const editable = canEdit(task)
            return (
              <tr key={task.id} style={styles.tr}>
                <td style={styles.tdTitle}>
                  <input
                    defaultValue={task.title}
                    disabled={!editable}
                    onBlur={(e) => {
                      if (e.target.value !== task.title) onUpdate(task.id, { title: e.target.value })
                    }}
                    style={{ ...styles.inlineInput, fontWeight: 600 }}
                  />
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      background: TRADE_COLORS[task.trade] + '22',
                      color: TRADE_COLORS[task.trade],
                    }}
                  >
                    {TRADE_LABELS[task.trade]}
                  </span>
                </td>
                <td style={styles.td}>
                  <select
                    value={task.assigned_to || ''}
                    disabled={!isAdmin}
                    onChange={(e) => onUpdate(task.id, { assigned_to: e.target.value || null })}
                    style={styles.select}
                  >
                    <option value="">—</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={styles.td}>
                  <input
                    type="date"
                    defaultValue={task.start_date}
                    disabled={!editable}
                    onChange={(e) => onUpdate(task.id, { start_date: e.target.value })}
                    style={styles.dateInput}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="date"
                    defaultValue={task.end_date}
                    disabled={!editable}
                    onChange={(e) => onUpdate(task.id, { end_date: e.target.value })}
                    style={styles.dateInput}
                  />
                </td>
                <td style={styles.td}>
                  <select
                    value={task.status}
                    disabled={!editable}
                    onChange={(e) => onUpdate(task.id, { status: e.target.value })}
                    style={{
                      ...styles.select,
                      color: STATUS_COLORS[task.status],
                      fontWeight: 600,
                    }}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={styles.td}>
                  <div style={styles.progressCell}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      defaultValue={task.progress}
                      disabled={!editable}
                      onChange={(e) => onUpdate(task.id, { progress: Number(e.target.value) })}
                      style={{ width: 80 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--ink-soft)', width: 32 }}>
                      {task.progress}%
                    </span>
                  </div>
                </td>
                <td style={styles.td}>
                  {isAdmin && (
                    <button onClick={() => onDelete(task.id)} style={styles.deleteButton} title="Löschen">
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  wrapper: {
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--ink-soft)',
    background: '#faf9f7',
    borderBottom: '1px solid var(--line)',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid var(--line)',
  },
  td: {
    padding: '8px 12px',
    verticalAlign: 'middle',
  },
  tdTitle: {
    padding: '8px 12px',
    verticalAlign: 'middle',
    minWidth: 200,
  },
  inlineInput: {
    border: '1px solid transparent',
    background: 'transparent',
    padding: '4px 6px',
    borderRadius: 4,
    width: '100%',
    fontSize: 13,
  },
  select: {
    border: '1px solid var(--line-strong)',
    borderRadius: 4,
    padding: '5px 6px',
    background: '#fff',
    fontSize: 12,
  },
  dateInput: {
    border: '1px solid var(--line-strong)',
    borderRadius: 4,
    padding: '5px 6px',
    fontSize: 12,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  progressCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    border: 'none',
    background: 'transparent',
    color: 'var(--ink-soft)',
    cursor: 'pointer',
    fontSize: 14,
    padding: 4,
  },
  empty: {
    padding: 32,
    textAlign: 'center',
    color: 'var(--ink-soft)',
    border: '1px dashed var(--line-strong)',
    borderRadius: 'var(--radius-md)',
  },
}
