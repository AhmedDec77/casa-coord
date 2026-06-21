import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'
import MonthCalendar from '../components/MonthCalendar'

export default function ProjectsCalendarPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('archived', false)
      .order('start_date', { ascending: true, nullsFirst: false })
    if (error) console.error(error)
    setProjects(data ?? [])
    setLoading(false)
  }

  return (
    <AppShell>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Übersicht</div>
          <h1 style={styles.title}>Aktive Projekte</h1>
        </div>
        {isAdmin && (
          <button style={styles.newButton} onClick={() => setShowNewProject(true)}>
            + Nouveau projet
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Lädt…</p>
      ) : projects.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>Noch keine Projekte vorhanden.</p>
      ) : (
        <>
          <div style={styles.grid}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>

          <MonthCalendar
            projects={projects}
            onProjectClick={(project) => navigate(`/projects/${project.id}`)}
          />
        </>
      )}

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => {
            setShowNewProject(false)
            loadProjects()
          }}
        />
      )}
    </AppShell>
  )
}

function ProjectCard({ project, onClick }) {
  const dateRange = formatDateRange(project.start_date, project.end_date)
  return (
    <button onClick={onClick} style={{ ...styles.card, borderTopColor: project.color }}>
      <div style={styles.cardTitle}>{project.name}</div>
      {project.client_name && (
        <div style={styles.cardClient}>{project.client_name}</div>
      )}
      <div style={styles.cardDate}>{dateRange}</div>
    </button>
  )
}

function formatDateRange(start, end) {
  if (!start && !end) return 'Termine offen'
  const fmt = (d) =>
    new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  if (start && end) return `${fmt(start)} → ${fmt(end)}`
  return fmt(start || end)
}

function NewProjectModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [address, setAddress] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState('#2563eb')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('projects').insert({
      name,
      client_name: clientName || null,
      address: address || null,
      start_date: startDate || null,
      end_date: endDate || null,
      color,
      created_by: user.id,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onCreated()
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, marginBottom: 18 }}>Nouveau projet</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nom du projet">
            <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Client">
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Adresse">
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label="Début" style={{ flex: 1 }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Fin" style={{ flex: 1 }}>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <Field label="Couleur">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ ...inputStyle, height: 38, padding: 4 }} />
          </Field>

          {error && <div style={{ color: '#b91c1c', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={styles.secondaryButton}>
              Annuler
            </button>
            <button type="submit" disabled={submitting} style={styles.newButton}>
              {submitting ? 'Création…' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', ...style }}>
      {label}
      {children}
    </label>
  )
}

const inputStyle = {
  padding: '9px 11px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line-strong)',
  background: '#fff',
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 12,
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-soft)',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
  },
  newButton: {
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--ink)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  secondaryButton: {
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    color: 'var(--ink)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
  },
  card: {
    textAlign: 'left',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--line)',
    borderTop: '4px solid',
    borderRadius: 'var(--radius-md)',
    padding: '18px 18px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 19,
    fontWeight: 600,
    marginBottom: 4,
  },
  cardClient: {
    fontSize: 13,
    color: 'var(--ink-soft)',
    marginBottom: 10,
  },
  cardDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--ink-soft)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28, 26, 23, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 50,
  },
  modal: {
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
    width: '100%',
    maxWidth: 420,
    boxShadow: 'var(--shadow-md)',
  },
}
