import { useState, useEffect } from 'react'
import './QuickAddModal.css'
import { X, ShoppingCart } from 'lucide-react'

export default function QuickAddModal({ item, onClose, onAddToCart, formatPrice }) {
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('')
  const [error, setError] = useState('')

  // Auto-select if only one option
  useEffect(() => {
    if (item.platforms?.length === 1) {
      setSelectedPlatform(item.platforms[0])
    }
    if (item.versions?.length === 1) {
      setSelectedVersion(item.versions[0])
    }
  }, [item])

  const handleAddToCart = () => {
    // Validate selections
    if (item.platforms?.length > 0 && !selectedPlatform) {
      setError('Please select a platform')
      return
    }
    if (item.versions?.length > 0 && !selectedVersion) {
      setError('Please select a version')
      return
    }

    const fullPlatform = `${selectedPlatform} ${selectedVersion}`.trim()
    onAddToCart(item, fullPlatform)
    onClose()
  }

  const handleClose = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="quick-add-modal-overlay" onClick={handleClose}>
      <div className="quick-add-modal">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="modal-header">
          <div className="modal-item-icon">
            <img 
              src={item.icon || '/zeusservicesPackage.webp'} 
              alt={item.name}
              onError={(e) => {
                e.target.src = '/zeusservicesPackage.webp'
              }}
            />
          </div>
          <div>
            <h3>{item.name}</h3>
            <p className="modal-price">{formatPrice ? formatPrice(item.price) : `£${item.price}`}</p>
          </div>
        </div>

        {item.description && (
          <p className="modal-description">{item.description}</p>
        )}

        <div className="modal-options">
          {/* Platform Selection */}
          {item.platforms?.length > 0 && (
            <div className="modal-option-group">
              <label htmlFor="modal-platform">Select Platform *</label>
              <select
                id="modal-platform"
                value={selectedPlatform}
                onChange={(e) => {
                  setSelectedPlatform(e.target.value)
                  setError('')
                }}
                className="modal-select"
              >
                <option value="">Choose a platform</option>
                {item.platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Version Selection */}
          {item.versions?.length > 0 && (
            <div className="modal-option-group">
              <label htmlFor="modal-version">Select Version *</label>
              <select
                id="modal-version"
                value={selectedVersion}
                onChange={(e) => {
                  setSelectedVersion(e.target.value)
                  setError('')
                }}
                className="modal-select"
              >
                <option value="">Choose a version</option>
                {item.versions.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="modal-error">{error}</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn modal-btn-primary" onClick={handleAddToCart}>
            <ShoppingCart size={18} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
