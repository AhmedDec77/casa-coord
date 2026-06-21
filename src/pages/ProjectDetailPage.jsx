import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'
import GanttChart from '../components/GanttChart'
import TaskTable from '../components/TaskTable'
import NewTaskForm from '../components/NewTaskForm'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const { isAdmin } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditProject, setShowEditProject] = useState(false)

  const loadAll = useCallback(async () => {
    const [projectRes, tasksRes, profilesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tasks').select('*').eq('project_id', projectId).order('start_date'),
      supabase.from('profiles').select('*').order('full_name'),
    ])
    if (projectRes.error) console.error(projectRes.error)
    if (tasksRes.error) console.error(tasksRes.error)
    if (profilesRes.error) console.error(profilesRes.error)
    setProject(projectRes.data)
    setTasks(tasksRes.data ?? [])
    setProfiles(profilesRes.data ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!cancelled) await loadAll()
    })()

    // Realtime : tout changement de tâche sur ce projet rafraîchit la vue
    // pour que les autres corps de métier voient la mise à jour en direct.
    const channel = supabase
      .channel(`tasks-project-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        () => loadAll()
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [projectId, loadAll])

  async function handleCreateTask(values) {
    const { error } = await supabase.from('tasks').insert({
      ...values,
      project_id: projectId,
    })
    if (error) throw error
    loadAll()
  }

  async function handleUpdateTask(taskId, patch) {
    const { error } = await supabase.from('tasks').update(patch).eq('id', taskId)
    if (error) {
      console.error(error)
      alert('Änderung abgelehnt: Du kannst nur deine eigenen Aufgaben bearbeiten.')
      loadAll()
      return
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)))
  }

  async function handleDeleteTask(taskId) {
    if (!confirm('Diese Aufgabe löschen?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) {
      console.error(error)
      return
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  if (loading) {
    return (
      <AppShell>
        <p style={{ color: 'var(--ink-soft)' }}>Lädt…</p>
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell>
        <p>Projekt nicht gefunden.</p>
        <Link to="/">← Zurück zu den Projekten</Link>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Link to="/" style={styles.backLink}>
        ← Alle Projekte
      </Link>

      <div style={styles.header}>
        <div style={{ ...styles.colorBar, background: project.color }} />
        <div style={{ flex: 1 }}>
          <h1 style={styles.title}>{project.name}</h1>
          {project.client_name && <p style={styles.subtitle}>{project.client_name}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => setShowEditProject(true)} style={styles.editButton}>
            Modifier
          </button>
        )}
      </div>

      {showEditProject && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditProject(false)}
          onSaved={() => {
            setShowEditProject(false)
            loadAll()
          }}
        />
      )}

      <section style={{ marginBottom: 32 }}>
        <h2 style={styles.sectionTitle}>Zeitplan (Gantt)</h2>
        <GanttChart tasks={tasks} onTaskClick={() => {}} />
      </section>

      <section>
        <h2 style={styles.sectionTitle}>Aufgaben</h2>
        <NewTaskForm profiles={profiles} onCreate={handleCreateTask} />
        <TaskTable
          tasks={tasks}
          profiles={profiles}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      </section>
    </AppShell>
  )
}

function EditProjectModal({ project, onClose, onSaved }) {
  const [name, setName] = useState(project.name || '')
  const [clientName, setClientName] = useState(project.client_name || '')
  const [address, setAddress] = useState(project.address || '')
  const [startDate, setStartDate] = useState(project.start_date || '')
  const [endDate, setEndDate] = useState(project.end_date || '')
  const [color, setColor] = useState(project.color || '#2563eb')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase
      .from('projects')
      .update({
        name,
        client_name: clientName || null,
        address: address || null,
        start_date: startDate || null,
        end_date: endDate || null,
        color,
      })
      .eq('id', project.id)
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
  }

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, marginBottom: 18 }}>Modifier le projet</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ModalField label="Nom du projet">
            <input required value={name} onChange={(e) => setName(e.target.value)} style={modalStyles.input} />
          </ModalField>
          <ModalField label="Client">
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} style={modalStyles.input} />
          </ModalField>
          <ModalField label="Adresse">
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={modalStyles.input} />
          </ModalField>
          <div style={{ display: 'flex', gap: 12 }}>
            <ModalField label="Début" style={{ flex: 1 }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={modalStyles.input} />
            </ModalField>
            <ModalField label="Fin" style={{ flex: 1 }}>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={modalStyles.input} />
            </ModalField>
          </div>
          <ModalField label="Couleur">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ ...modalStyles.input, height: 38, padding: 4 }} />
          </ModalField>

          {error && <div style={{ color: '#b91c1c', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={modalStyles.secondaryButton}>
              Annuler
            </button>
            <button type="submit" disabled={submitting} style={modalStyles.primaryButton}>
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalField({ label, children, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', ...style }}>
      {label}
      {children}
    </label>
  )
}

const modalStyles = {
  overlay: {
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
  input: {
    padding: '9px 11px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
  },
  primaryButton: {
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--ink)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
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
}

const styles = {
  backLink: {
    display: 'inline-block',
    fontSize: 13,
    color: 'var(--ink-soft)',
    textDecoration: 'none',
    marginBottom: 18,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  colorBar: {
    width: 6,
    height: 42,
    borderRadius: 4,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    color: 'var(--ink-soft)',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
  },
  editButton: {
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    color: 'var(--ink)',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
}
