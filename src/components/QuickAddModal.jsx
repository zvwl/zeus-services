import { useState, useEffect } from 'react'
import './QuickAddModal.css'
import { X, ShoppingCart } from 'lucide-react'
import FlyingCartAnimation from './FlyingCartAnimation'

export default function QuickAddModal({ item, onClose, onAddToCart, formatPrice }) {
  const [selectedOptions, setSelectedOptions] = useState({})
  const [error, setError] = useState('')
  const [showFlyingAnimation, setShowFlyingAnimation] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const getSelectableFields = (itemData) => {
    if (!itemData) return []

    const customFields = Array.isArray(itemData.custom_fields)
      ? itemData.custom_fields
          .filter(field => field && field.fieldName)
          .map(field => ({
            fieldName: field.fieldName,
            options: Array.isArray(field.availableOptions) && field.availableOptions.length > 0
              ? field.availableOptions
              : (Array.isArray(field.selectedOptions) ? field.selectedOptions : [])
          }))
          .filter(field => field.options.length > 0)
      : []

    if (customFields.length > 0) return customFields

    const fallback = []
    if (Array.isArray(itemData.platforms) && itemData.platforms.length > 0) {
      fallback.push({ fieldName: 'Platform', options: itemData.platforms })
    }
    if (Array.isArray(itemData.versions) && itemData.versions.length > 0) {
      fallback.push({ fieldName: 'Version', options: itemData.versions })
    }
    return fallback
  }

  const selectableFields = getSelectableFields(item)

  // Auto-select if only one option
  useEffect(() => {
    const nextSelections = {}
    selectableFields.forEach((field) => {
      nextSelections[field.fieldName] = field.options.length === 1 ? field.options[0] : ''
    })
    setSelectedOptions(nextSelections)
  }, [item])

  const handleAddToCart = () => {
    // Validate selections
    const missingField = selectableFields.find(field => !selectedOptions[field.fieldName])
    if (missingField) {
      setError(`Please select ${missingField.fieldName.toLowerCase()}`)
      return
    }

    // Start flying animation
    setShowFlyingAnimation(true)
  }

  const handleAnimationComplete = async () => {
    setShowFlyingAnimation(false)
    setIsAddingToCart(true)
    try {
      const versionValue = selectedOptions.Version || ''
      const selectedEntries = selectableFields
        .filter(field => selectedOptions[field.fieldName])
        .map(field => [field.fieldName, selectedOptions[field.fieldName]])

      const singlePlatformSelection = selectedEntries.length === 1
        && String(selectedEntries[0][0]).toLowerCase() === 'platform'

      const fullPlatform = singlePlatformSelection
        ? String(selectedEntries[0][1])
        : selectedEntries.map(([fieldName, value]) => `${fieldName}: ${value}`).join(' | ')

      onAddToCart({
        ...item,
        version: versionValue,
        customSelections: selectedOptions,
      }, fullPlatform)
      onClose()
    } catch (err) {
      console.error('Error adding to cart:', err)
      setError('Failed to add item to cart')
    } finally {
      setIsAddingToCart(false)
    }
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
          {selectableFields.map((field) => {
            const fieldId = `modal-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`
            return (
              <div className="modal-option-group" key={field.fieldName}>
                <label htmlFor={fieldId}>Select {field.fieldName} *</label>
                <select
                  id={fieldId}
                  value={selectedOptions[field.fieldName] || ''}
                  onChange={(e) => {
                    setSelectedOptions(prev => ({ ...prev, [field.fieldName]: e.target.value }))
                    setError('')
                  }}
                  className="modal-select"
                >
                  <option value="">Choose {field.fieldName.toLowerCase()}</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}

          {error && (
            <p className="modal-error">{error}</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-secondary" onClick={onClose} disabled={showFlyingAnimation || isAddingToCart}>
            Cancel
          </button>
          <button className="modal-btn modal-btn-primary cta-button" onClick={handleAddToCart} disabled={showFlyingAnimation || isAddingToCart}>
            <ShoppingCart size={18} />
            Add to Cart
          </button>
        </div>

        {/* Flying Cart Animation */}
        <FlyingCartAnimation
          isActive={showFlyingAnimation}
          itemIcon={item.icon || '/zeusservicesPackage.webp'}
          onComplete={handleAnimationComplete}
        />
      </div>
    </div>
  )
}
