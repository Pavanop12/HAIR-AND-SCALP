import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ImageUploader from '../components/ImageUploader'
import ResultCard from '../components/ResultCard'

export default function Upload() {
  const { user } = useAuth()
  const [result, setResult] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleResult = (data) => {
    setResult(data)
    setSaved(false)
    setSaveError('')
    if (data?.preview) setPreview(data.preview)
  }

  const handleSave = async () => {
    if (!result || !user) return
    setSaving(true); setSaveError('')
    try {
      let image_url = null

      // Upload image to Supabase Storage
      if (result.file) {
        const ext = result.file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('scalp-images')
          .upload(path, result.file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('scalp-images').getPublicUrl(path)
        image_url = urlData?.publicUrl || null
        if (!image_url) throw new Error('Image uploaded but could not create a URL. Check that the Storage bucket is public or use signed URLs.')
      } else {
        throw new Error('No image file found to upload.')
      }

      // Save scan to DB
      const { error: dbError } = await supabase.from('scans').insert({
        user_id: user.id,
        disease: result.disease,
        confidence: result.confidence,
        severity_score: result.severity_score,
        all_predictions: result.all_predictions,
        image_url,
      })

      if (dbError) throw dbError
      setSaved(true)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80, position: 'relative', zIndex: 1 }}>

        <div style={{ marginBottom: 40, textAlign: 'center', maxWidth: 980, marginLeft: 'auto', marginRight: 'auto' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
            🔬 Analyze <span className="grad-text">Scalp Image</span>
          </h1>
          <p style={{ color: 'var(--text2)' }}>Upload a clear scalp photo for AI-powered disease detection</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: result ? 'minmax(0, 520px) minmax(0, 520px)' : 'minmax(0, 600px)',
          gap: 32,
          justifyContent: 'center',
          alignItems: 'start',
          maxWidth: 1120,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          {/* Left: Uploader */}
          <div>
            <div className="glass" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📸 Upload Image</h2>
              <ImageUploader onResult={handleResult} onImageSelected={setPreview} />
            </div>
          </div>

          {/* Right: Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                {saved ? (
                  <motion.div className="glass" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ padding: 40, textAlign: 'center', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'var(--success)' }}>Scan Saved!</h2>
                    <p style={{ color: 'var(--text2)', marginBottom: 28 }}>
                      Your scan has been stored in your timeline. Visit Progress to see your recovery journey.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <a href="/progress" className="btn btn-primary">📈 View Progress</a>
                      <button className="btn btn-ghost" onClick={() => { setResult(null); setSaved(false) }}>New Scan</button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {saveError && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {saveError}</div>}
                    <ResultCard result={result} onSave={handleSave} saving={saving} />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
