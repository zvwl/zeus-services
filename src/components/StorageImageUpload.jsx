'use client'

import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function StorageImageUpload({ bucket, value, onChange, label = 'Image' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
      onChange(urlData.publicUrl)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="storage-upload">
      <div
        className={`upload-dropzone ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {uploading ? (
          <div className="upload-state">
            <div className="upload-spinner" />
            <span>Uploading…</span>
          </div>
        ) : value && (value.startsWith('http') || value.startsWith('/')) ? (
          <div className="upload-preview">
            <img src={value} alt="Preview" onError={(e) => { e.target.style.display = 'none' }} />
            <div className="upload-overlay">
              <Upload size={18} strokeWidth={2} />
              <span>Click or drop to replace</span>
            </div>
          </div>
        ) : (
          <div className="upload-state">
            <ImageIcon size={28} strokeWidth={1.5} color="#64748b" />
            <span>Click or drop an image to upload</span>
            <small>PNG, JPG, WebP — max 5 MB</small>
          </div>
        )}
      </div>

      {value && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste an image URL"
            style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.85rem' }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}
            title="Clear image"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {!value && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste an image URL directly"
          style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.85rem', boxSizing: 'border-box' }}
        />
      )}

      {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem' }}>{error}</p>}

      <style>{`
        .storage-upload { display: flex; flex-direction: column; }
        .upload-dropzone {
          min-height: 120px;
          border: 2px dashed rgba(212,175,55,0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-dropzone:hover, .upload-dropzone.uploading {
          border-color: rgba(251,191,36,0.6);
          background: rgba(251,191,36,0.04);
        }
        .upload-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          color: #64748b;
          font-size: 0.875rem;
        }
        .upload-state small { color: #475569; font-size: 0.75rem; }
        .upload-preview { position: relative; width: 100%; }
        .upload-preview img { width: 100%; max-height: 160px; object-fit: cover; display: block; }
        .upload-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 0.35rem;
          color: #f1f5f9; font-size: 0.85rem;
          opacity: 0; transition: opacity 0.2s;
        }
        .upload-dropzone:hover .upload-overlay { opacity: 1; }
        .upload-spinner {
          width: 24px; height: 24px;
          border: 2px solid rgba(251,191,36,0.3);
          border-top-color: #fbbf24;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
