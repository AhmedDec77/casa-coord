import { useState } from 'react'
import { TRADE_COLORS, STATUS_COLORS, STATUS_LABELS } from '../lib/supabase'
import { groupTasks } from '../lib/taskGroups'

const DAY_WIDTH = 28
const ROW_HEIGHT = 40
const GROUP_ROW_HEIGHT = 38
const LABEL_WIDTH = 220
const ASSIGNEE_WIDTH = 120

export default function GanttChart({ tasks, profiles, onTaskClick }) {
  const [collapsed, setCollapsed] = useState({})

  if (tasks.length === 0) {
    return (
      <div style={styles.empty}>Noch keine Aufgaben für dieses Projekt.</div>
    )
  }

  const groups = groupTasks(tasks)
  const allCodes = groups.map((g) => g.code)
  const allCollapsed = allCodes.every((code) => collapsed[code] ?? true)

  function toggleGroup(code) {
    setCollapsed((prev) => ({ ...prev, [code]: !prev[code] }))
  }

  function expandAll() {
    const next = {}
    allCodes.forEach((code) => { next[code] = false })
    setCollapsed(next)
  }

  function collapseAll() {
    const next = {}
    allCodes.forEach((code) => { next[code] = true })
    setCollapsed(next)
  }

  function assigneeName(task) {
    if (!task.assigned_to) return null
    const p = profiles?.find((p) => p.id === task.assigned_to)
    return p ? p.full_name : null
  }

  const dates = tasks.flatMap((t) => [new Date(t.start_date), new Date(t.end_date)])
  const minDate = startOfDay(new Date(Math.min(...dates)))
  const maxDate = startOfDay(new Date(Math.max(...dates)))
  // marge d'un jour de chaque côté
  minDate.setDate(minDate.getDate() - 1)
  maxDate.setDate(maxDate.getDate() + 2)

  const totalDays = Math.max(1, daysBetween(minDate, maxDate))
  const chartWidth = totalDays * DAY_WIDTH
  const today = startOfDay(new Date())
  const todayOffset = daysBetween(minDate, today)

  const dayMarks = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(minDate)
    d.setDate(d.getDate() + i)
    return d
  })

  // Construit une liste plate de lignes (en-tête de groupe ou tâche), pour
  // garder les colonnes (libellés, responsable) et la zone des barres alignées.
  const rows = []
  for (const group of groups) {
    const isCollapsed = collapsed[group.code] ?? true
    rows.push({ type: 'group', code: group.code, label: group.label, count: group.tasks.length, collapsed: isCollapsed })
    if (!isCollapsed) {
      for (const task of group.tasks) {
        rows.push({ type: 'task', task })
      }
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.toolbarRow}>
        <div style={styles.legend}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: STATUS_COLORS[key] }} />
              <span style={styles.legendLabel}>{label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={allCollapsed ? expandAll : collapseAll}
          style={styles.expandAllButton}
        >
          {allCollapsed ? '+ Alle aufklappen' : '− Alle zuklappen'}
        </button>
      </div>
      <div style={styles.scrollArea}>
        <div style={{ display: 'flex', minWidth: LABEL_WIDTH + ASSIGNEE_WIDTH + chartWidth }}>
          {/* Colonne des libellés */}
          <div style={{ width: LABEL_WIDTH, flexShrink: 0 }}>
            <div style={styles.headerCell}>Aufgabe</div>
            {rows.map((row) =>
              row.type === 'group' ? (
                <button
                  key={`g-${row.code}`}
                  onClick={() => toggleGroup(row.code)}
                  style={styles.groupLabelRow}
                  title={row.label}
                >
                  <span style={styles.groupToggleBox}>{row.collapsed ? '+' : '−'}</span>
                  <span style={styles.groupLabelText}>{row.label}</span>
                  <span style={styles.groupCount}>{row.count}</span>
                </button>
              ) : (
                <button
                  key={row.task.id}
                  onClick={() => onTaskClick(row.task)}
                  style={{
                    ...styles.labelRow,
                    borderLeft: `4px solid ${TRADE_COLORS[row.task.trade]}`,
                  }}
                  title={row.task.title}
                >
                  <span style={styles.labelText}>{row.task.title}</span>
                </button>
              )
            )}
          </div>

          {/* Colonne du responsable, même code couleur que la table */}
          <div style={{ width: ASSIGNEE_WIDTH, flexShrink: 0 }}>
            <div style={styles.headerCell}>Verantw.</div>
            {rows.map((row) =>
              row.type === 'group' ? (
                <div key={`g-${row.code}`} style={styles.groupAssigneeRow} />
              ) : (
                <div key={row.task.id} style={styles.assigneeRow}>
                  {assigneeName(row.task) ? (
                    <span
                      style={{
                        ...styles.assigneeBadge,
                        background: TRADE_COLORS[row.task.trade] + '22',
                        color: TRADE_COLORS[row.task.trade],
                      }}
                      title={assigneeName(row.task)}
                    >
                      {assigneeName(row.task)}
                    </span>
                  ) : (
                    <span style={styles.assigneeEmpty}>—</span>
                  )}
                </div>
              )
            )}
          </div>

          {/* Zone du Gantt */}
          <div style={{ position: 'relative', width: chartWidth }}>
            {/* en-tête des jours */}
            <div style={{ display: 'flex', height: 36, borderBottom: '1px solid var(--line)' }}>
              {dayMarks.map((d, i) => (
                <div
                  key={i}
                  style={{
                    width: DAY_WIDTH,
                    flexShrink: 0,
                    fontSize: 10,
                    color: 'var(--ink-soft)',
                    textAlign: 'center',
                    paddingTop: 4,
                    borderRight: '1px solid var(--line)',
                    background: isWeekend(d) ? '#f4f3f0' : 'transparent',
                  }}
                >
                  {d.getDate() === 1 || i === 0
                    ? d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
                    : d.getDate()}
                </div>
              ))}
            </div>

            {/* ligne "aujourd'hui" */}
            {todayOffset >= 0 && todayOffset < totalDays && (
              <div
                style={{
                  position: 'absolute',
                  top: 36,
                  bottom: 0,
                  left: todayOffset * DAY_WIDTH,
                  width: 2,
                  background: '#dc2626',
                  zIndex: 2,
                }}
              />
            )}

            {/* lignes (en-tête de groupe ou tâche) */}
            {rows.map((row) => {
              if (row.type === 'group') {
                return (
                  <div
                    key={`g-${row.code}`}
                    style={{
                      height: GROUP_ROW_HEIGHT,
                      borderBottom: '1px solid var(--line)',
                      borderTop: '1px solid var(--line)',
                      background: '#f3f1ec',
                    }}
                  />
                )
              }
              const task = row.task
              const start = daysBetween(minDate, startOfDay(new Date(task.start_date)))
              const span = daysBetween(
                startOfDay(new Date(task.start_date)),
                startOfDay(new Date(task.end_date))
              ) + 1
              return (
                <div
                  key={task.id}
                  style={{
                    position: 'relative',
                    height: ROW_HEIGHT,
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  {dayMarks.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: i * DAY_WIDTH,
                        top: 0,
                        bottom: 0,
                        width: DAY_WIDTH,
                        borderRight: '1px solid var(--line)',
                        background: isWeekend(d) ? '#f4f3f0' : 'transparent',
                      }}
                    />
                  ))}
                  <button
                    onClick={() => onTaskClick(task)}
                    style={{
                      position: 'absolute',
                      left: start * DAY_WIDTH + 2,
                      width: span * DAY_WIDTH - 4,
                      top: 7,
                      height: ROW_HEIGHT - 14,
                      borderRadius: 6,
                      background: STATUS_COLORS[task.status],
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      padding: '0 6px',
                    }}
                    title={`${task.title} — ${task.progress}%`}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${task.progress}%`,
                        background: 'rgba(255,255,255,0.35)',
                      }}
                    />
                    <span style={{ position: 'relative', fontSize: 11, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {task.progress}%
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function startOfDay(d) {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

function isWeekend(d) {
  const day = d.getDay()
  return day === 0 || day === 6
}

var styles = {
  wrapper: {
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)',
    overflow: 'hidden',
  },
  toolbarRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid var(--line)',
    background: '#faf9f7',
  },
  legend: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 11,
    color: 'var(--ink-soft)',
    fontWeight: 500,
  },
  expandAllButton: {
    fontSize: 12,
    fontWeight: 600,
    padding: '5px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    cursor: 'pointer',
    color: 'var(--ink)',
  },
  scrollArea: {
    overflowX: 'auto',
  },
  headerCell: {
    height: 36,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 12,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--ink-soft)',
    borderBottom: '1px solid var(--line)',
    borderRight: '1px solid var(--line)',
    background: '#faf9f7',
  },
  groupLabelRow: {
    height: GROUP_ROW_HEIGHT,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 10px',
    background: '#f3f1ec',
    border: 'none',
    borderBottom: '1px solid var(--line)',
    borderTop: '1px solid var(--line)',
    borderRight: '1px solid var(--line)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  groupToggleBox: {
    flexShrink: 0,
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1,
    color: 'var(--ink)',
    background: '#fff',
    border: '1.5px solid var(--ink)',
    borderRadius: 4,
  },
  groupLabelText: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--ink)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  groupCount: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    color: 'var(--ink-soft)',
    background: '#fff',
    borderRadius: 999,
    padding: '1px 6px',
    border: '1px solid var(--line-strong)',
    flexShrink: 0,
  },
  groupAssigneeRow: {
    height: GROUP_ROW_HEIGHT,
    background: '#f3f1ec',
    borderBottom: '1px solid var(--line)',
    borderTop: '1px solid var(--line)',
    borderRight: '1px solid var(--line)',
  },
  labelRow: {
    height: ROW_HEIGHT,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    background: '#fff',
    border: 'none',
    borderBottom: '1px solid var(--line)',
    borderRight: '1px solid var(--line)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  labelText: {
    fontSize: 13,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  assigneeRow: {
    height: ROW_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    background: '#fff',
    borderBottom: '1px solid var(--line)',
    borderRight: '1px solid var(--line)',
  },
  assigneeBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '3px 7px',
    borderRadius: 999,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  assigneeEmpty: {
    fontSize: 12,
    color: 'var(--line-strong)',
  },
  empty: {
    padding: 32,
    textAlign: 'center',
    color: 'var(--ink-soft)',
    border: '1px dashed var(--line-strong)',
    borderRadius: 'var(--radius-md)',
  },
}
