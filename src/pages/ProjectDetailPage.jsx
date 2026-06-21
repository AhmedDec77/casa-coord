import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'
import GanttChart from '../components/GanttChart'
import TaskTable from '../components/TaskTable'
import NewTaskForm from '../components/NewTaskForm'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

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
        <div>
          <h1 style={styles.title}>{project.name}</h1>
          {project.client_name && <p style={styles.subtitle}>{project.client_name}</p>}
        </div>
      </div>

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
}
