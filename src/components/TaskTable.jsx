import { Fragment, useState } from 'react'
import { TRADE_LABELS, TRADE_COLORS, STATUS_LABELS, STATUS_COLORS } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { groupTasks } from '../lib/taskGroups'
import { addWorkingDays, countWorkingDays, taskDurationWorkingDays } from '../lib/workingDays'
import BlockerModal from './BlockerModal'
import TaskBlockersList from './TaskBlockersList'
import TaskDetailModal from './TaskDetailModal'

// Styles locaux pour DateDurationCells — déclarés avant le composant
// pour éviter ReferenceError (const n'est pas hoisted).
var cellStyles = {
  td: {
    padding: '6px 8px',
    verticalAlign: 'middle',
    overflow: 'hidden',
  },
  dateInput: {
    border: '1px solid var(--line-strong)',
    borderRadius: 4,
    padding: '5px 2px',
    fontSize: 11,
    width: '100%',
    maxWidth: '100%',
  },
  durationCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    alignItems: 'center',
  },
  durationInput: {
    border: '1px solid var(--line-strong)',
    borderRadius: 4,
    padding: '5px 2px',
    fontSize: 11,
    width: '100%',
    maxWidth: '100%',
    textAlign: 'center',
  },
  saturdayToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontSize: 9,
    color: 'var(--ink-soft)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
}

// Composant dédié pour les cellules Start / Ende / Dauer
// avec état local pour synchronisation immédiate sans attendre le re-render parent.
function DateDurationCells({ task, editable, onUpdate }) {
  const [startDate, setStartDate] = useState(task.start_date || '')
  const [endDate, setEndDate] = useState(task.end_date || '')
  const [includeSaturday, setIncludeSaturday] = useState(!!task.include_saturday)

  const duration = startDate && endDate
    ? countWorkingDays(startDate, endDate, includeSaturday)
    : 0

  function handleStartChange(newStart) {
    if (!newStart) return
    let newEnd = endDate
    if (newStart > endDate) newEnd = newStart
    setStartDate(newStart)
    setEndDate(newEnd)
    const patch = { start_date: newStart, end_date: newEnd }
    onUpdate(task.id, patch)
  }

  function handleEndChange(newEnd) {
    if (!newEnd) return
    let newStart = startDate
    if (newEnd < startDate) newStart = newEnd
    setEndDate(newEnd)
    setStartDate(newStart)
    const patch = { end_date: newEnd, start_date: newStart }
    onUpdate(task.id, patch)
  }

  function handleDurationChange(days) {
    if (!days || days < 1 || !startDate) return
    const newEnd = addWorkingDays(startDate, days, includeSaturday)
    setEndDate(newEnd)
    onUpdate(task.id, { end_date: newEnd })
  }

  function handleSaturdayChange(checked) {
    setIncludeSaturday(checked)
    onUpdate(task.id, { include_saturday: checked })
  }

  return (
    <>
      <td style={cellStyles.td}>
        <input
          type="date"
          value={startDate}
          disabled={!editable}
          onChange={(e) => handleStartChange(e.target.value)}
          style={cellStyles.dateInput}
        />
      </td>
      <td style={cellStyles.td}>
        <input
          type="date"
          value={endDate}
          disabled={!editable}
          onChange={(e) => handleEndChange(e.target.value)}
          style={cellStyles.dateInput}
        />
      </td>
      <td style={cellStyles.td}>
        <div style={cellStyles.durationCell}>
          <input
            type="number"
            min={1}
            value={duration || ''}
            disabled={!editable}
            onChange={(e) => handleDurationChange(Number(e.target.value))}
            style={cellStyles.durationInput}
            title="Dauer in Arbeitstagen — Enddatum wird automatisch angepasst"
          />
          <label style={cellStyles.saturdayToggle} title="Samstag als Arbeitstag zählen">
            <input
              type="checkbox"
              checked={includeSaturday}
              disabled={!editable}
              onChange={(e) => handleSaturdayChange(e.target.checked)}
            />
            <span>Sa</span>
          </label>
        </div>
      </td>
    </>
  )
}

// Styles locaux pour DateDurationCells (identiques aux styles de la table)

var styles = {
  wrapper: {
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)',
  },
  toolbarRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 12px',
    borderBottom: '1px solid var(--line)',
    background: '#faf9f7',
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
  table: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '10px 8px',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: 'var(--ink-soft)',
    background: '#faf9f7',
    borderBottom: '1px solid var(--line)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  groupHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 12px',
    background: '#f3f1ec',
    border: 'none',
    borderBottom: '1px solid var(--line)',
    borderTop: '1px solid var(--line)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  groupToggleBox: {
    flexShrink: 0,
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1,
    color: 'var(--ink)',
    background: '#fff',
    border: '1.5px solid var(--ink)',
    borderRadius: 5,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--ink)',
  },
  groupCount: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: 'var(--ink-soft)',
    background: '#fff',
    borderRadius: 999,
    padding: '1px 8px',
    border: '1px solid var(--line-strong)',
  },
  tr: {
    borderBottom: '1px solid var(--line)',
  },
  td: {
    padding: '6px 8px',
    verticalAlign: 'middle',
    overflow: 'hidden',
  },
  tdTitle: {
    padding: '6px 8px',
    verticalAlign: 'middle',
    overflow: 'hidden',
  },
  inlineInput: {
    border: '1px solid var(--line-strong)',
    background: '#fff',
    padding: '4px 6px',
    borderRadius: 4,
    width: '100%',
    fontSize: 13,
  },
  titleCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  titleLink: {
    border: 'none',
    background: 'transparent',
    padding: '4px 6px',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
    color: 'var(--ink)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  },
  editTitleButton: {
    border: 'none',
    background: 'transparent',
    color: 'var(--ink-soft)',
    cursor: 'pointer',
    fontSize: 12,
    padding: 4,
    flexShrink: 0,
  },
  select: {
    border: '1px solid var(--line-strong)',
    borderRadius: 4,
    padding: '5px 4px',
    background: '#fff',
    fontSize: 11,
    width: '100%',
    maxWidth: '100%',
  },
  dateInput: {
    border: '1px solid var(--line-strong)',
    borderRadius: 4,
    padding: '5px 2px',
    fontSize: 11,
    width: '100%',
    maxWidth: '100%',
  },
  durationCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    alignItems: 'center',
  },
  durationInput: {
    border: '1px solid var(--line-strong)',
    borderRadius: 4,
    padding: '5px 2px',
    fontSize: 11,
    width: '100%',
    maxWidth: '100%',
    textAlign: 'center',
  },
  saturdayToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontSize: 9,
    color: 'var(--ink-soft)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '3px 7px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'inline-block',
    maxWidth: '100%',
  },
  progressCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    width: '100%',
  },
  progressSlider: {
    width: '100%',
    maxWidth: '100%',
  },
  progressValue: {
    fontSize: 10,
    color: 'var(--ink-soft)',
    textAlign: 'center',
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


export default function TaskTable({ tasks, profiles, onUpdate, onDelete }) {
  const { user, isAdmin } = useAuth()
  const [collapsed, setCollapsed] = useState({})
  const [blockerModalTask, setBlockerModalTask] = useState(null)
  const [detailTask, setDetailTask] = useState(null)
  const [editingTitleId, setEditingTitleId] = useState(null)

  function canEdit(task) {
    return isAdmin || task.assigned_to === user.id
  }

  // Qui peut toucher au champ "Zugewiesen an" :
  // admin (toujours), le titulaire actuel (pour se libérer), ou n'importe
  // qui si la tâche n'est pas encore assignée (pour se l'attribuer).
  function canChangeAssignee(task) {
    return isAdmin || task.assigned_to === user.id || !task.assigned_to
  }

  function handleAssigneeChange(task, newAssigneeId) {
    // Un non-admin ne peut s'assigner qu'à lui-même ou se désassigner.
    if (!isAdmin && newAssigneeId && newAssigneeId !== user.id) return

    const patch = { assigned_to: newAssigneeId || null }

    if (newAssigneeId) {
      const assigneeProfile = profiles.find((p) => p.id === newAssigneeId)
      // Aligne automatiquement le Gewerk sur le métier de la personne assignée
      // (sauf coordinateur et architecte qui n'ont pas de corps d'exécution propre).
      if (
        assigneeProfile &&
        assigneeProfile.trade !== 'coordinateur' &&
        assigneeProfile.trade !== 'architecte' &&
        assigneeProfile.trade !== task.trade
      ) {
        patch.trade = assigneeProfile.trade
      }
    }

    onUpdate(task.id, patch)
  }

  function toggleGroup(code) {
    setCollapsed((prev) => ({ ...prev, [code]: !prev[code] }))
  }

  function expandAll() {
    const next = {}
    groups.forEach((g) => { next[g.code] = false })
    setCollapsed(next)
  }

  function collapseAll() {
    const next = {}
    groups.forEach((g) => { next[g.code] = true })
    setCollapsed(next)
  }

  const allCollapsed = groups.every((g) => collapsed[g.code] ?? true)

  function handleStatusChange(task, newStatus) {
    if (newStatus === 'bloque') {
      setBlockerModalTask(task)
      return
    }
    onUpdate(task.id, { status: newStatus })
  }

  async function handleBlockerConfirmed() {
    await onUpdate(blockerModalTask.id, { status: 'bloque' })
    setBlockerModalTask(null)
  }

  function handleBlockerCancelled() {
    setBlockerModalTask(null)
  }

  if (tasks.length === 0) {
    return <div style={styles.empty}>Noch keine Aufgaben. Füge oben die erste Aufgabe hinzu.</div>
  }

  const groups = groupTasks(tasks)

  return (
    <div style={styles.wrapper}>
      <div style={styles.toolbarRow}>
        <button
          onClick={allCollapsed ? expandAll : collapseAll}
          style={styles.expandAllButton}
        >
          {allCollapsed ? '+ Alle aufklappen' : '− Alle zuklappen'}
        </button>
      </div>
      <table style={styles.table}>
        <colgroup>
          <col style={{ width: '28%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '3%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={styles.th}>Aufgabe</th>
            <th style={styles.th}>Gewerk</th>
            <th style={styles.th}>Zugewiesen an</th>
            <th style={styles.th}>Start</th>
            <th style={styles.th}>Ende</th>
            <th style={styles.th}>Dauer</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Fortschritt</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        {groups.map((group) => {
          const isCollapsed = collapsed[group.code] ?? true
          return (
            <tbody key={group.code}>
              <tr>
                <td colSpan={9} style={{ padding: 0 }}>
                  <button
                    onClick={() => toggleGroup(group.code)}
                    style={styles.groupHeader}
                  >
                    <span style={styles.groupToggleBox}>{isCollapsed ? '+' : '−'}</span>
                    <span style={styles.groupLabel}>{group.label}</span>
                    <span style={styles.groupCount}>{group.tasks.length}</span>
                  </button>
                </td>
              </tr>
              {!isCollapsed && group.tasks.map((task) => {
                const editable = canEdit(task)
                return (
                  <Fragment key={task.id}>
                    <tr style={styles.tr}>
                      <td style={styles.tdTitle}>
                        {editingTitleId === task.id ? (
                          <input
                            autoFocus
                            defaultValue={task.title}
                            disabled={!editable}
                            onBlur={(e) => {
                              if (e.target.value !== task.title) onUpdate(task.id, { title: e.target.value })
                              setEditingTitleId(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur()
                              if (e.key === 'Escape') setEditingTitleId(null)
                            }}
                            style={{ ...styles.inlineInput, fontWeight: 600 }}
                          />
                        ) : (
                          <div style={styles.titleCell}>
                            <button
                              onClick={() => setDetailTask(task)}
                              style={styles.titleLink}
                              title="Details anzeigen"
                            >
                              {task.title}
                            </button>
                            {editable && (
                              <button
                                onClick={() => setEditingTitleId(task.id)}
                                style={styles.editTitleButton}
                                title="Titel bearbeiten"
                              >
                                ✎
                              </button>
                            )}
                          </div>
                        )}
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
                          disabled={!canChangeAssignee(task)}
                          onChange={(e) => handleAssigneeChange(task, e.target.value)}
                          style={styles.select}
                        >
                          <option value="">—</option>
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id} disabled={!isAdmin && p.id !== user.id}>
                              {p.full_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <DateDurationCells
                        task={task}
                        editable={editable}
                        onUpdate={onUpdate}
                      />
                      <td style={styles.td}>
                        <select
                          value={task.status}
                          disabled={!editable}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
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
                            style={styles.progressSlider}
                          />
                          <span style={styles.progressValue}>{task.progress}%</span>
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
                    <tr>
                      <td colSpan={9} style={{ padding: 0 }}>
                        <TaskBlockersList taskId={task.id} />
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          )
        })}
      </table>

      {blockerModalTask && (
        <BlockerModal
          task={blockerModalTask}
          onClose={handleBlockerCancelled}
          onCancel={handleBlockerCancelled}
          onConfirm={handleBlockerConfirmed}
        />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          profiles={profiles}
          onClose={() => setDetailTask(null)}
        />
      )}
    </div>
  )
}
