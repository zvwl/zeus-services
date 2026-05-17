'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { useCart } from '@/contexts/CartContext'
import FlyingCartAnimation from '@/components/FlyingCartAnimation'

function getSelectableFields(itemData) {
  if (!itemData) return []
  return Array.isArray(itemData.custom_fields)
    ? itemData.custom_fields
        .filter(f => f && f.fieldName)
        .map(f => ({
          fieldName: f.fieldName,
          type: f.type || 'dropdown',
          required: f.required !== false,
          options: Array.isArray(f.availableOptions) && f.availableOptions.length > 0
            ? f.availableOptions
            : (Array.isArray(f.selectedOptions) ? f.selectedOptions : []),
          unit: f.unit || '',
          pricePerUnit: parseFloat(f.pricePerUnit) || 0,
          minValue: parseInt(f.minValue) || 0,
          maxValue: parseInt(f.maxValue) || 1000000,
          stepValue: parseInt(f.stepValue) || 1,
        }))
        .filter(f => f.type === 'number' || f.options.length > 0)
    : []
}

function parseSelectionsFromCartItem(cartItem, fields) {
  const parsed = {}
  if (!cartItem || !Array.isArray(fields) || fields.length === 0) return parsed

  if (cartItem.customSelections && typeof cartItem.customSelections === 'object') {
    fields.forEach(field => {
      const candidate = cartItem.customSelections[field.fieldName]
      if (candidate && field.options.includes(candidate)) parsed[field.fieldName] = candidate
    })
  }

  const platformRaw = String(cartItem.platform || '').trim()
  const versionRaw = String(cartItem.version || '').trim()

  if (platformRaw.includes(':')) {
    platformRaw.split('|').forEach(segment => {
      const [rawField, ...rawValueParts] = segment.split(':')
      if (!rawField || rawValueParts.length === 0) return
      const fieldName = rawField.trim().toLowerCase()
      const value = rawValueParts.join(':').trim()
      const field = fields.find(f => f.fieldName.toLowerCase() === fieldName)
      if (field && value && field.options.includes(value)) parsed[field.fieldName] = value
    })
  }

  const platformField = fields.find(f => f.fieldName.toLowerCase() === 'platform')
  const versionField = fields.find(f => f.fieldName.toLowerCase() === 'version')

  if (platformField && !parsed[platformField.fieldName] && platformRaw && !platformRaw.includes(':')) {
    if (platformField.options.includes(platformRaw)) parsed[platformField.fieldName] = platformRaw
  }

  if (versionField && !parsed[versionField.fieldName] && versionRaw && versionField.options.includes(versionRaw)) {
    parsed[versionField.fieldName] = versionRaw
  }

  return parsed
}

export default function ItemPurchaseSection({ item, game, category, categorySlug, gameSlug, itemSlug }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatPrice, addToCart, updateQuantity, removeFromCart, cartItems } = useCart()

  const selectableFields = getSelectableFields(item)
  const selectedCartId = searchParams.get('cartId') || ''

  // Compute adjusted price based on number fields
  const computePrice = (options) => {
    let total = item.price
    selectableFields.forEach(f => {
      if (f.type === 'number' && f.pricePerUnit > 0) {
        const val = parseFloat(options[f.fieldName]) || 0
        total += val * f.pricePerUnit
      }
    })
    return total
  }

  const [selectedOptions, setSelectedOptions] = useState(() => {
    const initial = {}
    selectableFields.forEach(f => { initial[f.fieldName] = f.options.length === 1 ? f.options[0] : '' })
    return initial
  })
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const adjustedPrice = computePrice(selectedOptions)
  const [addingToCart, setAddingToCart] = useState(false)
  const [showFlyingAnimation, setShowFlyingAnimation] = useState(false)

  // Strip cartId from URL without triggering a navigation
  useEffect(() => {
    if (!searchParams.has('cartId')) return
    const next = new URLSearchParams(searchParams.toString())
    next.delete('cartId')
    const qs = next.toString()
    router.replace(`/${categorySlug}/${gameSlug}/${itemSlug}${qs ? `?${qs}` : ''}`)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Derive cart state from selections
  const selectedEntries = selectableFields
    .filter(f => selectedOptions[f.fieldName])
    .map(f => [f.fieldName, selectedOptions[f.fieldName]])

  const selectionSummary = selectedEntries.map(([k, v]) => `${k}: ${v}`).join(' | ')
  const singlePlatform = selectedEntries.length === 1 && String(selectedEntries[0][0]).toLowerCase() === 'platform'
  const platformDisplay = singlePlatform ? String(selectedEntries[0][1]) : selectionSummary
  const versionValue = selectedOptions.Version || ''
  const cartId = `${item.id}-${platformDisplay}-${versionValue}`

  const hasMissingSelections = selectableFields.some(f => {
    const val = selectedOptions[f.fieldName]
    if (f.type === 'number') return !val || parseFloat(val) <= 0
    if (f.type === 'multiselect') return !Array.isArray(val) || val.length === 0
    return !val // dropdown
  })
  const existingCartItem = !hasMissingSelections ? cartItems.find(ci => ci.cartId === cartId) : null
  const isInCart = !!existingCartItem
  const cartQuantity = existingCartItem?.quantity ?? 1

  // Auto-select variant when arriving from cart link
  useEffect(() => {
    if (selectableFields.length === 0) return
    if (!hasMissingSelections) return

    let source = selectedCartId ? cartItems.find(ci => ci.cartId === selectedCartId) : null
    if (!source) {
      const same = cartItems.filter(ci => ci.id === item.id)
      if (same.length === 1) source = same[0]
    }
    if (!source) return

    const inferred = parseSelectionsFromCartItem(source, selectableFields)
    if (Object.keys(inferred).length === 0) return

    setSelectedOptions(prev => {
      const next = { ...prev }
      let changed = false
      selectableFields.forEach(f => {
        if (!next[f.fieldName] && inferred[f.fieldName]) { next[f.fieldName] = inferred[f.fieldName]; changed = true }
      })
      return changed ? next : prev
    })
  }, [item.id, cartItems, selectedCartId]) // eslint-disable-line react-hooks/exhaustive-deps

  const isOutOfStock = item.stock_enabled && !item.stock_unlimited &&
    (item.stock_quantity === null || item.stock_quantity === 0)

  const stockBadgeText = item.stock_enabled && !item.stock_unlimited && item.stock_quantity !== null
    ? `${item.stock_quantity} in stock`
    : null

  const buildCartItem = () => {
    // Flatten multiselect arrays to comma-separated strings for storage compatibility
    const flatSelections = {}
    selectableFields.forEach(f => {
      const val = selectedOptions[f.fieldName]
      flatSelections[f.fieldName] = Array.isArray(val) ? val.join(', ') : val
    })

    return {
      ...item,
      price: adjustedPrice,        // use computed price (accounts for number fields)
      platform: platformDisplay,
      version: versionValue,
      customSelections: flatSelections,
      category_slug: categorySlug,
      game_slug: gameSlug,
      item_slug: itemSlug,
      game_id: game.id,
      game_name: game.name,
      category_id: category.id,
      category_name: category.name,
    }
  }

  const handleAddToCart = () => {
    if (isOutOfStock) return
    if (hasMissingSelections) {
      setAttemptedSubmit(true)
      return
    }
    setShowFlyingAnimation(true)
  }

  const handleAnimationComplete = async () => {
    setShowFlyingAnimation(false)
    setAddingToCart(true)
    try {
      addToCart(buildCartItem(), platformDisplay)
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <>
      <FlyingCartAnimation
        isActive={showFlyingAnimation}
        itemIcon={item.icon || game.icon_url}
        onComplete={handleAnimationComplete}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', margin: '0.5rem 0 1rem' }}>
        <p className="service-detail-price">{formatPrice(adjustedPrice)}</p>
        {stockBadgeText && !isOutOfStock && (
          <span style={{ padding: '0.4rem 0.9rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(34,197,94,0.3)' }}>
            {stockBadgeText}
          </span>
        )}
        {isOutOfStock && (
          <span style={{ padding: '0.4rem 0.9rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)' }}>
            Out of Stock
          </span>
        )}
      </div>

      <div className="service-detail-options">
        {!game.is_coming_soon && selectableFields.map(field => {
          const fieldKey = `field-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`
          const currentValue = selectedOptions[field.fieldName] || ''

          // NUMBER field
          if (field.type === 'number') {
            return (
              <div className="option-group" key={field.fieldName}>
                <label htmlFor={fieldKey}>
                  {field.fieldName}{field.unit ? ` (${field.unit})` : ''}:
                  {field.pricePerUnit > 0 && (
                    <span style={{ color: '#fbbf24', fontSize: '0.85rem', marginLeft: '0.5rem', fontWeight: 500 }}>
                      {formatPrice(field.pricePerUnit)} per {field.unit || 'unit'}
                    </span>
                  )}
                </label>
                <input
                  id={fieldKey}
                  type="number"
                  min={field.minValue}
                  max={field.maxValue}
                  step={field.stepValue}
                  value={currentValue}
                  onChange={e => setSelectedOptions(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                  className="option-select"
                  placeholder={`Enter amount (${field.minValue.toLocaleString()} – ${field.maxValue.toLocaleString()})`}
                  style={{ maxWidth: '220px' }}
                />
                {currentValue && field.pricePerUnit > 0 && (
                  <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {parseFloat(currentValue).toLocaleString()} {field.unit} = {formatPrice(parseFloat(currentValue) * field.pricePerUnit)}
                  </p>
                )}
                {attemptedSubmit && !currentValue && (
                  <p style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}>
                    Please enter {field.fieldName.toLowerCase()} to continue.
                  </p>
                )}
              </div>
            )
          }

          // MULTISELECT field (checkboxes)
          if (field.type === 'multiselect') {
            const selectedArr = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : [])
            return (
              <div className="option-group" key={field.fieldName}>
                <label>{field.fieldName}:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {field.options.map(opt => {
                    const checked = selectedArr.includes(opt)
                    return (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.35rem 0.75rem', background: checked ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${checked ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', fontSize: '0.9rem', transition: 'all 0.15s' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked ? selectedArr.filter(s => s !== opt) : [...selectedArr, opt]
                            setSelectedOptions(prev => ({ ...prev, [field.fieldName]: next }))
                          }}
                          style={{ accentColor: '#fbbf24' }}
                        />
                        {opt}
                      </label>
                    )
                  })}
                </div>
                {attemptedSubmit && selectedArr.length === 0 && (
                  <p style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}>
                    Please select at least one {field.fieldName.toLowerCase()}.
                  </p>
                )}
              </div>
            )
          }

          // DROPDOWN field (default — existing behaviour)
          return (
            <div className="option-group" key={field.fieldName}>
              <label htmlFor={fieldKey}>Select {field.fieldName}:</label>
              <select
                id={fieldKey}
                value={currentValue}
                onChange={e => setSelectedOptions(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                className="option-select"
              >
                <option value="">Select {field.fieldName.toLowerCase()}</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {attemptedSubmit && currentValue === '' && (
                <p style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}>
                  Please select {field.fieldName.toLowerCase()} to continue.
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="service-detail-actions">
        {game.is_coming_soon ? (
          <div style={{ padding: '1.5rem', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>Coming Soon</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', color: '#cbd5e1' }}>This item is not yet available for purchase. Check back soon!</p>
          </div>
        ) : isOutOfStock ? (
          <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>Out of Stock</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', color: '#cbd5e1' }}>This item is currently unavailable. Check back later for restock!</p>
          </div>
        ) : !isInCart ? (
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <button
              className="cta-button"
              onClick={handleAddToCart}
              disabled={addingToCart || showFlyingAnimation}
            >
              {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="quantity-inline-controls button-style">
              <button
                className="quantity-button"
                onClick={() => {
                  if (cartQuantity > 1) updateQuantity(cartId, cartQuantity - 1)
                  else removeFromCart(cartId)
                }}
              >−</button>
              <input
                type="number"
                name="item_quantity"
                min="1"
                max="100"
                value={cartQuantity}
                onChange={e => updateQuantity(cartId, Math.max(1, parseInt(e.target.value) || 1))}
                className="quantity-input"
              />
              <button
                className="quantity-button"
                onClick={() => addToCart(buildCartItem(), platformDisplay)}
              >+</button>
            </div>
          </motion.div>
        )}

        <button
          className="secondary-button"
          onClick={() => router.push(`/${categorySlug}/${gameSlug}`)}
        >
          Back to {category.name}
        </button>
      </div>
    </>
  )
}
