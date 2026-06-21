import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'task-photos'

export default function TaskBlockersList({ taskId }) {
  const [blockers, setBlockers] = useState([])
  const [photoUrls, setPhotoUrls] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('task_blockers')
        .select(
          'id, note, photo_paths, created_at, reported_by, resolved_at, resolved_by, ' +
          'reporter:reported_by (full_name), resolver:resolved_by (full_name)'
        )
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
      if (error) {
        console.error(error)
        setLoading(false)
        return
      }
      if (cancelled) return
      setBlockers(data ?? [])

      // Génère des URLs signées pour chaque photo (bucket privé)
      const allPaths = (data ?? []).flatMap((b) => b.photo_paths || [])
      if (allPaths.length > 0) {
        const { data: signed, error: signError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrls(allPaths, 60 * 60) // 1h
        if (!signError && signed) {
          const map = {}
          signed.forEach((s) => {
            if (s.signedUrl) map[s.path] = s.signedUrl
          })
          setPhotoUrls(map)
        }
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [taskId])

  if (loading || blockers.length === 0) return null

  return (
    <div style={styles.wrapper}>
      {blockers.map((b) => {
        const isResolved = !!b.resolved_at
        return (
          <div
            key={b.id}
            style={{
              ...styles.entry,
              ...(isResolved ? styles.entryResolved : styles.entryActive),
            }}
          >
            <div style={styles.entryHeader}>
              <span style={styles.entryAuthor}>{b.reporter?.full_name ?? 'Unbekannt'}</span>
              <span style={{ ...styles.statusBadge, ...(isResolved ? styles.statusBadgeResolved : styles.statusBadgeActive) }}>
                {isResolved ? 'Gelöst' : 'Aktiv'}
              </span>
              <span style={styles.entryDate}>{formatDate(b.created_at)}</span>
            </div>
            <p style={styles.entryNote}>{b.note}</p>
            {b.photo_paths?.length > 0 && (
              <div style={styles.photoGrid}>
                {b.photo_paths.map((path) =>
                  photoUrls[path] ? (
                    <a key={path} href={photoUrls[path]} target="_blank" rel="noreferrer">
                      <img src={photoUrls[path]} alt="" style={styles.photoThumb} />
                    </a>
                  ) : null
                )}
              </div>
            )}
            {isResolved && (
              <div style={styles.resolvedNote}>
                ✓ Gelöst am {formatDate(b.resolved_at)}
                {b.resolver?.full_name ? ` von ${b.resolver.full_name}` : ''}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const styles = {
  wrapper: {
    padding: '10px 14px',
    background: '#faf9f7',
    borderTop: '1px solid var(--line)',
    borderBottom: '1px solid var(--line)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  entry: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid transparent',
  },
  entryActive: {
    background: '#fef2f2',
    borderColor: '#fecaca',
  },
  entryResolved: {
    background: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  entryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
  },
  entryAuthor: {
    fontWeight: 700,
    color: 'var(--ink)',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 999,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  statusBadgeActive: {
    background: '#dc2626',
    color: '#fff',
  },
  statusBadgeResolved: {
    background: '#16a34a',
    color: '#fff',
  },
  entryDate: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--ink-soft)',
    marginLeft: 'auto',
  },
  entryNote: {
    fontSize: 13,
    color: 'var(--ink)',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  photoGrid: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  photoThumb: {
    width: 56,
    height: 56,
    objectFit: 'cover',
    borderRadius: 6,
    border: '1px solid var(--line)',
  },
  resolvedNote: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: 600,
  },
}
