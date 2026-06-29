import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'

export default function ImageUploader({ onResult, onImageSelected }) {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
      onImageSelected?.(e.target.result)
    }
    reader.readAsDataURL(f)
  }, [onImageSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  const analyze = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/predict`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      if (data.success === false) {
        setError(data.message || 'The uploaded image is not a scalp image.')
        onResult(null)
        return
      }
      onResult({ ...data, file, preview })
    } catch (err) {
      setError(err.message.includes('fetch') ? 'Cannot connect to AI server. Make sure the FastAPI server is running on port 8000.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setPreview(null); setFile(null); setError(''); onResult(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Drop zone */}
      <div {...getRootProps()} id="dropzone" style={{
        border: `2px dashed ${isDragActive ? 'var(--purple)' : preview ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 16, padding: preview ? 0 : 48,
        cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden',
        background: isDragActive ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
        textAlign: 'center', position: 'relative',
      }}>
        <input {...getInputProps()} id="file-input" />
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.img key="preview" src={preview} alt="Scalp preview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>
                {isDragActive ? 'Drop your image here!' : 'Drag & drop a scalp image'}
              </p>
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>or click to browse — JPG, PNG up to 10MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Actions */}
      {preview && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 12 }}>
          <button id="analyze-btn" className="btn btn-primary" onClick={analyze} disabled={loading} style={{ flex: 1, padding: 14 }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Analyzing with AI...
              </span>
            ) : '🔬 Analyze Image'}
          </button>
          <button className="btn btn-ghost" onClick={reset} disabled={loading}>Reset</button>
        </motion.div>
      )}
    </div>
  )
}
