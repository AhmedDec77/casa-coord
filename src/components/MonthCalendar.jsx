import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const WEEKDAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export default function MonthCalendar({ projects, onProjectClick }) {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
  const [tasksByProject, setTasksByProject] = useState({})

  const loadAllTasks = useCallback(async () => {
    if (projects.length === 0) return
    const { data, error } = await supabase
      .from('tasks')
      .select('project_id, start_date, end_date, progress')
      .in('project_id', projects.map((p) => p.id))
    if (error) {
      console.error(error)
      return
    }
    const grouped = {}
    for (const t of data ?? []) {
      if (!grouped[t.project_id]) grouped[t.project_id] = []
      grouped[t.project_id].push(t)
    }
    setTasksByProject(grouped)
  }, [projects])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!cancelled) await loadAllTasks()
    })()
    return () => {
      cancelled = true
    }
  }, [loadAllTasks])

  const weeks = useMemo(() => buildWeeks(monthCursor), [monthCursor])

  const projectsWithDates = projects.filter((p) => p.start_date && p.end_date)

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.title}>Projektkalender</div>
        <div style={styles.nav}>
          <button style={styles.navButton} onClick={() => setMonthCursor(addMonths(monthCursor, -1))} aria-label="Vorheriger Monat">
            ←
          </button>
          <div style={styles.monthLabel}>
            {MONTHS_DE[monthCursor.getMonth()]} {monthCursor.getFullYear()}
          </div>
          <button style={styles.navButton} onClick={() => setMonthCursor(addMonths(monthCursor, 1))} aria-label="Nächster Monat">
            →
          </button>
        </div>
      </div>

      <div style={styles.weekdayRow}>
        {WEEKDAYS_DE.map((d) => (
          <div key={d} style={styles.weekdayCell}>{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} style={styles.weekRow}>
          {week.map((day) => (
            <div
              key={day.toISOString()}
              style={{
                ...styles.dayCell,
                opacity: day.getMonth() === monthCursor.getMonth() ? 1 : 0.35,
              }}
            >
              <div style={styles.dayNumber}>{day.getDate()}</div>
              <div style={styles.barsStack}>
                {projectsWithDates.map((project) => {
                  const inRange = dateInRange(day, project.start_date, project.end_date)
                  if (!inRange) return null
                  const tasks = tasksByProject[project.id] ?? []
                  const achieved = dayAchievement(day, tasks)
                  return (
                    <button
                      key={project.id}
                      onClick={() => onProjectClick(project)}
                      title={`${project.name} — ${Math.round(achieved * 100)}% erledigt (Tag)`}
                      style={{
                        ...styles.dayBar,
                        background: hexToRgba(project.color, 0.25),
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: `${Math.round(achieved * 100)}%`,
                          background: project.color,
                        }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {projectsWithDates.length > 0 && (
        <div style={styles.legend}>
          {projectsWithDates.map((p) => (
            <div key={p.id} style={styles.legendItem}>
              <span style={{ ...styles.legendSwatch, background: p.color }} />
              <span>{p.name}</span>
            </div>
          ))}
          <div style={styles.legendNote}>Hell = geplant · Voll = erledigt</div>
        </div>
      )}
    </div>
  )
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

// Construit une grille de semaines (lundi -> dimanche) couvrant le mois affiché
function buildWeeks(monthCursor) {
  const firstOfMonth = startOfMonth(monthCursor)
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7 // 0 = lundi
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - firstWeekday)

  const lastOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0)
  const lastWeekday = (lastOfMonth.getDay() + 6) % 7
  const gridEnd = new Date(lastOfMonth)
  gridEnd.setDate(gridEnd.getDate() + (6 - lastWeekday))

  const weeks = []
  let cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function dateInRange(day, startStr, endStr) {
  const d = stripTime(day)
  const start = stripTime(new Date(startStr))
  const end = stripTime(new Date(endStr))
  return d >= start && d <= end
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

// Moyenne d'avancement des tâches actives ce jour-là (0 si aucune tâche ce jour)
function dayAchievement(day, tasks) {
  const active = tasks.filter((t) => dateInRange(day, t.start_date, t.end_date))
  if (active.length === 0) return 0
  const sum = active.reduce((acc, t) => acc + (t.progress ?? 0), 0)
  return sum / active.length / 100
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const styles = {
  wrapper: {
    marginTop: 32,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    padding: 20,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-soft)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
  monthLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    fontWeight: 600,
    minWidth: 140,
    textAlign: 'center',
  },
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: 4,
  },
  weekdayCell: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--ink-soft)',
    textAlign: 'center',
    padding: '4px 0',
  },
  weekRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
    marginBottom: 2,
  },
  dayCell: {
    minHeight: 64,
    background: '#fbfaf8',
    border: '1px solid var(--line)',
    borderRadius: 6,
    padding: '4px 4px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  dayNumber: {
    fontSize: 11,
    color: 'var(--ink-soft)',
    paddingLeft: 2,
  },
  barsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  dayBar: {
    height: 8,
    borderRadius: 3,
    padding: 0,
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTop: '1px solid var(--line)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'var(--ink-soft)',
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
    display: 'inline-block',
  },
  legendNote: {
    fontSize: 11,
    color: 'var(--ink-soft)',
    fontStyle: 'italic',
    marginLeft: 'auto',
  },
}
