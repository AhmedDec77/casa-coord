import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const RESOLVED_LIMIT = 10

export default function BlockersOverview({ projects }) {
  const navigate = useNavigate()
  const [active, setActive] = useState([])
  const [resolved, setResolved] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (projects.length === 0) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('task_blockers')
        .select(
          'id, note, created_at, resolved_at, ' +
          'reporter:reported_by (full_name), resolver:resolved_by (full_name), ' +
          'task:task_id (id, title, project_id)'
        )
        .order('created_at', { ascending: false })
      if (error) {
        console.error(error)
        setLoading(false)
        return
      }
      if (cancelled) return

      const projectById = Object.fromEntries(projects.map((p) => [p.id, p]))
      const enrich = (b) => ({ ...b, project: b.task ? projectById[b.task.project_id] : null })
      const withProject = (data ?? []).filter((b) => b.task && projectById[b.task.project_id])

      setActive(withProject.filter((b) => !b.resolved_at).map(enrich))
      setResolved(
        withProject
          .filter((b) => b.resolved_at)
          .sort((a, b) => new Date(b.resolved_at) - new Date(a.resolved_at))
          .slice(0, RESOLVED_LIMIT)
          .map(enrich)
      )
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projects])

  if (loading || (active.length === 0 && resolved.length === 0)) return null

  function goToTask(blocker) {
    navigate(`/projects/${blocker.task.project_id}`)
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.title}>Blockierungen</div>

      {active.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>Noch nicht gelöst</span>
            <span style={styles.activeCount}>{active.length}</span>
          </div>
          <div style={styles.table}>
            {active.map((b) => (
              <button key={b.id} onClick={() => goToTask(b)} style={styles.row}>
                <span style={{ ...styles.projectDot, background: b.project?.color ?? '#999' }} />
                <span style={styles.rowProject}>{b.project?.name}</span>
                <span style={styles.rowTask}>{b.task?.title}</span>
                <span style={styles.rowNote}>{b.note}</span>
                <span style={styles.rowMeta}>
                  {b.reporter?.full_name} · {formatDate(b.created_at)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabelResolved}>Kürzlich gelöst</span>
          </div>
          <div style={styles.table}>
            {resolved.map((b) => (
              <button key={b.id} onClick={() => goToTask(b)} style={{ ...styles.row, ...styles.rowResolved }}>
                <span style={{ ...styles.projectDot, background: b.project?.color ?? '#999' }} />
                <span style={styles.rowProject}>{b.project?.name}</span>
                <span style={styles.rowTask}>{b.task?.title}</span>
                <span style={styles.rowNote}>{b.note}</span>
                <span style={styles.rowMeta}>
                  Gelöst {formatDate(b.resolved_at)}
                  {b.resolver?.full_name ? ` von ${b.resolver.full_name}` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const styles = {
  wrapper: {
    marginTop: 32,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    padding: 20,
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-soft)',
    marginBottom: 16,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#dc2626',
  },
  sectionLabelResolved: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--ink-soft)',
  },
  activeCount: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: '#fff',
    background: '#dc2626',
    borderRadius: 999,
    padding: '1px 8px',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  rowResolved: {
    background: '#f7f6f3',
    border: '1px solid var(--line)',
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  rowProject: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--ink-soft)',
    flexShrink: 0,
    width: 100,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowTask: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ink)',
    flexShrink: 0,
    width: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowNote: {
    fontSize: 12,
    color: 'var(--ink-soft)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  rowMeta: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: 'var(--ink-soft)',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
}
