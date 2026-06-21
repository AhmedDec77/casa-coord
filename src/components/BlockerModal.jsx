import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MAX_PHOTOS = 4
const MAX_PHOTO_MB = 8

export default function BlockerModal({ task, onClose, onConfirm, onCancel }) {
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [progressLabel, setProgressLabel] = useState(null)

  function handleFilesSelected(e) {
    const selected = Array.from(e.target.files || [])
    const tooBig = selected.find((f) => f.size > MAX_PHOTO_MB * 1024 * 1024)
    if (tooBig) {
      setError(`Foto "${tooBig.name}" ist zu groß (max. ${MAX_PHOTO_MB} MB).`)
      return
    }
    const combined = [...files, ...selected].slice(0, MAX_PHOTOS)
    setFiles(combined)
    setError(null)
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!note.trim()) {
      setError('Bitte beschreibe kurz, was blockiert.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const photoPaths = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setProgressLabel(`Foto ${i + 1}/${files.length} wird hochgeladen…`)
        const ext = file.name.split('.').pop()
        const path = `${task.id}/${Date.now()}-${i}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('task-photos')
          .upload(path, file, { upsert: false })
        if (uploadError) throw uploadError
        photoPaths.push(path)
      }

      setProgressLabel('Wird gespeichert…')
      const { error: insertError } = await supabase.from('task_blockers').insert({
        task_id: task.id,
        reported_by: user.id,
        note: note.trim(),
        photo_paths: photoPaths,
      })
      if (insertError) throw insertError

      await onConfirm()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Ein Fehler ist aufgetreten.')
      setSubmitting(false)
      setProgressLabel(null)
    }
  }

  return (
    <div style={styles.overlay} onClick={submitting ? undefined : onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Aufgabe blockiert</h2>
        <p style={styles.subtitle}>
          "{task.title}" — bitte beschreibe, was die Aufgabe blockiert, bevor du fortfährst.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={styles.label}>
            Was blockiert? <span style={{ color: '#dc2626' }}>*</span>
            <textarea
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="z. B. Material fehlt, Zugang versperrt, Absprache mit Architektin nötig…"
              style={styles.textarea}
            />
          </label>

          <label style={styles.label}>
            Fotos (optional, max. {MAX_PHOTOS})
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFilesSelected}
              disabled={files.length >= MAX_PHOTOS}
              style={styles.fileInput}
            />
          </label>

          {files.length > 0 && (
            <div style={styles.thumbGrid}>
              {files.map((file, i) => (
                <div key={i} style={styles.thumbWrapper}>
                  <img src={URL.createObjectURL(file)} alt={file.name} style={styles.thumb} />
                  <button type="button" onClick={() => removeFile(i)} style={styles.thumbRemove} title="Entfernen">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}
          {progressLabel && <div style={styles.progress}>{progressLabel}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onCancel} disabled={submitting} style={styles.cancelButton}>
              Abbrechen
            </button>
            <button type="submit" disabled={submitting} style={styles.submitButton}>
              {submitting ? 'Wird gespeichert…' : 'Blockierung melden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
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
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
    width: '100%',
    maxWidth: 460,
    boxShadow: 'var(--shadow-md)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  title: {
    fontSize: 20,
    marginBottom: 6,
    color: '#dc2626',
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--ink-soft)',
    marginBottom: 18,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ink-soft)',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    fontFamily: 'inherit',
    fontSize: 14,
    resize: 'vertical',
  },
  fileInput: {
    fontSize: 13,
  },
  thumbGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  thumbWrapper: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid var(--line)',
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 11,
    cursor: 'pointer',
    lineHeight: 1,
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    fontSize: 13,
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #fecaca',
  },
  progress: {
    fontSize: 12,
    color: 'var(--ink-soft)',
    fontStyle: 'italic',
  },
  cancelButton: {
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--line-strong)',
    background: '#fff',
    color: 'var(--ink)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: '#dc2626',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
