'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Breadcrumb from '@/components/Breadcrumb'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmModal from '@/components/ConfirmModal'
import StorageImageUpload from '@/components/StorageImageUpload'
import { ToastContainer } from '@/components/Toast'
import '../App.css'
import './AdminForms.css'

export default function AdminItemsPage() {
  const [items, setItems] = useState([])
  const [games, setGames] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [filterGame, setFilterGame] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterName, setFilterName] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  })
  const [toasts, setToasts] = useState([])
  
  const addToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, duration: 3500 }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }
  
  const [formData, setFormData] = useState({
    game_id: '',
    category_id: '',
    name: '',
    slug: '',
    price: '',
    description: '',
    icon: '',
    customFields: [], // Array of { id, fieldName, availableOptions: [], selectedOptions: [] }
    detailsText: '',
    active: true,
    featured: false,
    stock_enabled: false,
    stock_quantity: '',
    stock_unlimited: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .order('display_order', { ascending: true })

      if (gamesError) throw gamesError
      setGames(gamesData || [])

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch items with game and category info
      const { data: itemsData, error: itemsError } = await supabase
        .from('items_with_details')
        .select('*')
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      addToast('Failed to fetch data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const itemData = {
        game_id: formData.game_id,
        category_id: formData.category_id,
        name: formData.name,
        slug: formData.slug,
        price: parseFloat(formData.price),
        description: formData.description,
        icon: formData.icon,
        custom_fields: formData.customFields.map(field => ({
          fieldName: field.fieldName,
          type: field.type || 'dropdown',
          selectedOptions: field.selectedOptions,
          availableOptions: field.availableOptions,
          required: field.required || false,
          ...(field.type === 'number' ? {
            unit: field.unit || '',
            pricePerUnit: parseFloat(field.pricePerUnit) || 0,
            minValue: field.minValue !== '' ? parseInt(field.minValue) : null,
            maxValue: field.maxValue !== '' ? parseInt(field.maxValue) : null,
            stepValue: parseInt(field.stepValue) || 1,
            defaultValue: field.defaultValue !== '' ? field.defaultValue : null,
          } : {})
        })),
        details: formData.detailsText
          .split('\n')
          .map((detail) => detail.trim())
          .filter((detail) => detail !== ''),
        active: formData.active,
        featured: formData.featured,
        stock_enabled: formData.stock_enabled,
        stock_quantity: formData.stock_enabled && !formData.stock_unlimited && formData.stock_quantity !== '' 
          ? parseInt(formData.stock_quantity) 
          : null,
        stock_unlimited: formData.stock_unlimited
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update({
            ...itemData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id)

        if (error) throw error
        addToast('Item updated successfully', 'success')
      } else {
        // Create new item
        const { error } = await supabase
          .from('items')
          .insert([itemData])

        if (error) throw error
        addToast('Item created successfully', 'success')
      }

      resetForm()
      fetchData()
    } catch (err) {
      console.error('Error saving item:', err)
      addToast(`Failed to save item: ${err.message}`, 'error')
    }
  }

  const handleEdit = (item) => {
      // Load custom fields from database only (legacy columns removed)
      const customFieldsData = Array.isArray(item.custom_fields)
        ? item.custom_fields.map((field, index) => ({
            id: `field-${Date.now()}-${index}`,
            fieldName: field.fieldName || '',
            type: field.type || 'dropdown',
            availableOptions: field.availableOptions || [],
            selectedOptions: field.selectedOptions || [],
            required: field.required || false,
            unit: field.unit || '',
            pricePerUnit: field.pricePerUnit || '',
            minValue: field.minValue || '',
            maxValue: field.maxValue || '',
            stepValue: field.stepValue || '',
            defaultValue: field.defaultValue || '',
          }))
        : []
    
    setEditingItem(item)
    setFormData({
      game_id: item.game_id,
      category_id: item.category_id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      description: item.description || '',
      icon: item.icon || '',
        customFields: customFieldsData,
      detailsText: (item.details || []).join('\n'),
      active: item.active,
      featured: item.featured || false,
      stock_enabled: item.stock_enabled || false,
      stock_quantity: item.stock_quantity !== null ? item.stock_quantity : '',
      stock_unlimited: item.stock_unlimited || false
    })
  }

  const handleDelete = async (item) => {
    setConfirmConfig({
      title: 'Delete Item',
      message: `Are you sure you want to delete "${item.name}"?`,
      onConfirm: async () => {
        setShowConfirm(false)
        await performDelete(item)
      }
    })
    setShowConfirm(true)
  }

  const performDelete = async (item) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id)

      if (error) throw error
      addToast('Item deleted successfully', 'success')
      fetchData()
    } catch (err) {
      console.error('Error deleting item:', err)
      addToast(`Failed to delete item: ${err.message}`, 'error')
    }
  }

  const handleDuplicate = async (item) => {
    try {
      const duplicateData = {
        game_id: item.game_id,
        category_id: item.category_id,
        name: `${item.name} (Copy)`,
        slug: `${item.slug}-copy-${Date.now()}`,
        price: item.price,
        description: item.description || '',
        icon: item.icon || '',
        custom_fields: item.custom_fields || [],
        details: item.details || [],
        active: false,
        featured: false,
        stock_enabled: item.stock_enabled || false,
        stock_quantity: item.stock_quantity ?? null,
        stock_unlimited: item.stock_unlimited || false,
      }
      const { error } = await supabase.from('items').insert([duplicateData])
      if (error) throw error
      addToast(`Duplicated "${item.name}" – edit to rename and activate`, 'success')
      fetchData()
    } catch (err) {
      addToast(`Failed to duplicate: ${err.message}`, 'error')
    }
  }

  const handleToggleActive = async (item) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ active: !item.active })
        .eq('id', item.id)

      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Error toggling active status:', err)
      addToast(`Failed to update status: ${err.message}`, 'error')
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      game_id: '',
      category_id: '',
      name: '',
      slug: '',
      price: '',
      description: '',
      icon: '',
      customFields: [],
      detailsText: '',
      active: true,
      featured: false,
      stock_enabled: false,
      stock_quantity: '',
      stock_unlimited: false
    })
  }

  // Custom Fields Management
  const addCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFields: [...prev.customFields, {
        id: `field-${Date.now()}`,
        fieldName: '',
        type: 'dropdown',
        availableOptions: [],
        selectedOptions: [],
        required: false,
        unit: '',
        pricePerUnit: '',
        minValue: '',
        maxValue: '',
        stepValue: '',
        defaultValue: '',
      }]
    }))
  }

  const updateFieldProp = (fieldId, prop, value) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(f =>
        f.id === fieldId ? { ...f, [prop]: value } : f
      )
    }))
  }

  const removeCustomField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f.id !== fieldId)
    }))
  }

  const  updateFieldName = (fieldId, newName) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(f =>
        f.id === fieldId ? { ...f, fieldName: newName } : f
      )
    }))
  }

  const addFieldOption = (fieldId, option) => {
    if (!option.trim()) return
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(f =>
        f.id === fieldId && !f.availableOptions.includes(option)
          ? { ...f, availableOptions: [...f.availableOptions, option] }
          : f
      )
    }))
  }

  const removeFieldOption = (fieldId, option) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(f =>
        f.id === fieldId
          ? {
              ...f,
              availableOptions: f.availableOptions.filter(o => o !== option),
              selectedOptions: f.selectedOptions.filter(o => o !== option)
            }
          : f
      )
    }))
  }

  const toggleFieldOption = (fieldId, option) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(f =>
        f.id === fieldId
          ? {
              ...f,
              selectedOptions: f.selectedOptions.includes(option)
                ? f.selectedOptions.filter(o => o !== option)
                : [...f.selectedOptions, option]
            }
          : f
      )
    }))
  }


  // Filter items
  const filteredItems = items.filter(item => {
    if (filterGame !== 'all' && item.game_id !== filterGame) return false
    if (filterCategory !== 'all' && item.category_id !== filterCategory) return false
    if (filterName.trim() && !item.name.toLowerCase().includes(filterName.toLowerCase())) return false
    return true
  })

  if (loading) {
    return <LoadingSpinner message="Loading items..." />
  }

  return (
    <section className="section admin-section">
      <Breadcrumb
        customItems={[
          { label: 'Home', path: '/' },
          { label: 'Admin', path: '/admin/dashboard' },
          { label: 'Items', path: '/admin/items' }
        ]}
      />
      
      <h1 className="section-title">Manage Items</h1>
      <p className="section-subtitle">Add, edit, and manage items across all games and categories</p>

      <div className="admin-content">
        <div className="admin-form-section">
          <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="game_id">Game *</label>
                <select
                  id="game_id"
                  value={formData.game_id}
                  onChange={(e) => setFormData({ ...formData, game_id: e.target.value })}
                  required
                >
                  <option value="">Select a game</option>
                  {games.map(game => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category_id">Category *</label>
                <select
                  id="category_id"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">Item Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="slug">Slug *</label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (GBP) *</label>
                <input
                  type="number"
                  id="price"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Item Image</label>
              <StorageImageUpload
                bucket="item-images"
                value={formData.icon}
                onChange={(url) => setFormData({ ...formData, icon: url })}
              />
              <small style={{ display: 'block', color: '#64748b', marginTop: '0.4rem' }}>
                Recommended: 1000×600px (5:3). Upload directly or paste a URL.
              </small>
            </div>

            {/* Custom Fields Section */}
            <div className="cf-section">
              <div className="cf-section-header">
                <label className="cf-section-label">Custom Fields</label>
                <button type="button" className="btn-add" onClick={addCustomField}>+ Add Field</button>
              </div>
              <p className="cf-section-hint">Add dropdowns, checkboxes, or number inputs shown to buyers. E.g. "Currency Amount", "Server Region", "Rank".</p>

              {formData.customFields.length === 0 ? (
                <div className="cf-empty">No custom fields yet. Click "+ Add Field" to start.</div>
              ) : (
                <div className="cf-list">
                  {formData.customFields.map((field) => (
                    <div key={field.id} className="cf-card">
                      {/* Row: name + type + required + delete */}
                      <div className="cf-top-row">
                        <div className="form-group cf-name-group">
                          <label>Field Label</label>
                          <input
                            type="text"
                            value={field.fieldName}
                            onChange={(e) => updateFieldName(field.id, e.target.value)}
                            placeholder="e.g. Currency Amount, Server, Rank…"
                          />
                        </div>
                        <div className="form-group cf-type-group">
                          <label>Type</label>
                          <select value={field.type || 'dropdown'} onChange={(e) => updateFieldProp(field.id, 'type', e.target.value)}>
                            <option value="dropdown">Dropdown</option>
                            <option value="multiselect">Multiselect</option>
                            <option value="number">Number</option>
                          </select>
                        </div>
                        <label className="cf-required-check">
                          <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={(e) => updateFieldProp(field.id, 'required', e.target.checked)}
                          />
                          Required
                        </label>
                        <button type="button" className="btn-remove cf-delete" onClick={() => removeCustomField(field.id)} title="Remove field">✕</button>
                      </div>

                      {/* Dropdown / Multiselect options */}
                      {(field.type === 'dropdown' || field.type === 'multiselect' || !field.type) && (
                        <div className="cf-options-section">
                          <label className="cf-sub-label">Add Options</label>
                          <div className="cf-add-option-row">
                            <input
                              type="text"
                              placeholder="Type an option and press Enter or click Add"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addFieldOption(field.id, e.target.value)
                                  e.target.value = ''
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn-add"
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling
                                addFieldOption(field.id, input.value)
                                input.value = ''
                              }}
                            >+ Add</button>
                          </div>
                          {field.availableOptions.length > 0 && (
                            <>
                              <p className="cf-sub-label" style={{ color: '#fbbf24', marginTop: '0.75rem' }}>Check options to include by default:</p>
                              <div className="cf-options-pills">
                                {field.availableOptions.map((option) => (
                                  <div
                                    key={option}
                                    className={`cf-option-pill${field.selectedOptions.includes(option) ? ' selected' : ''}`}
                                    onClick={() => toggleFieldOption(field.id, option)}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={field.selectedOptions.includes(option)}
                                      onChange={() => toggleFieldOption(field.id, option)}
                                    />
                                    <span>{option}</span>
                                    <button
                                      type="button"
                                      className="cf-pill-remove"
                                      onClick={(e) => { e.stopPropagation(); removeFieldOption(field.id, option) }}
                                      title="Remove option"
                                    >✕</button>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Number type inputs */}
                      {field.type === 'number' && (
                        <div className="cf-number-grid">
                          <div className="form-group">
                            <label>Unit label</label>
                            <input type="text" value={field.unit} onChange={e => updateFieldProp(field.id, 'unit', e.target.value)} placeholder="e.g. Credits, Coins" />
                          </div>
                          <div className="form-group">
                            <label>Price per unit (£)</label>
                            <input type="number" step="0.0001" min="0" value={field.pricePerUnit} onChange={e => updateFieldProp(field.id, 'pricePerUnit', e.target.value)} placeholder="0.00" />
                          </div>
                          <div className="form-group">
                            <label>Default value</label>
                            <input type="number" value={field.defaultValue} onChange={e => updateFieldProp(field.id, 'defaultValue', e.target.value)} placeholder="e.g. 1000" />
                          </div>
                          <div className="form-group">
                            <label>Min value</label>
                            <input type="number" value={field.minValue} onChange={e => updateFieldProp(field.id, 'minValue', e.target.value)} placeholder="e.g. 100" />
                          </div>
                          <div className="form-group">
                            <label>Max value</label>
                            <input type="number" value={field.maxValue} onChange={e => updateFieldProp(field.id, 'maxValue', e.target.value)} placeholder="e.g. 99999" />
                          </div>
                          <div className="form-group">
                            <label>Step</label>
                            <input type="number" value={field.stepValue} onChange={e => updateFieldProp(field.id, 'stepValue', e.target.value)} placeholder="e.g. 100" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <small style={{ display: 'block', color: '#94a3b8', marginTop: '1rem', lineHeight: '1.6' }}>
                <strong style={{ color: '#cbd5e1' }}>Dropdown</strong> — user picks one option from a list.{' '}
                <strong style={{ color: '#cbd5e1' }}>Multiselect</strong> — user can tick multiple options (checkboxes).{' '}
                <strong style={{ color: '#cbd5e1' }}>Number</strong> — user types a quantity; price is calculated as base_price + (amount &times; price_per_unit).
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="detailsText">Details (one per line)</label>
              <textarea
                id="detailsText"
                value={formData.detailsText}
                onChange={(e) => setFormData({ ...formData, detailsText: e.target.value })}
                rows="5"
                placeholder="Enter one detail per line"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="item_active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="item_featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                Featured
              </label>
            </div>

            {/* Stock Management */}
            <div style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: 'rgba(251, 191, 36, 0.05)', 
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '8px'
            }}>
              <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.1rem' }}>Stock Management</h3>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="item_stock_enabled"
                    checked={formData.stock_enabled}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      stock_enabled: e.target.checked,
                      stock_quantity: e.target.checked ? formData.stock_quantity : '',
                      stock_unlimited: e.target.checked ? formData.stock_unlimited : false
                    })}
                  />
                  Enable Stock Tracking
                </label>
                <small style={{ display: 'block', color: '#94a3b8', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                  Track inventory for this item
                </small>
              </div>

              {formData.stock_enabled && (
                <>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="item_stock_unlimited"
                        checked={formData.stock_unlimited}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          stock_unlimited: e.target.checked,
                          stock_quantity: e.target.checked ? '' : formData.stock_quantity
                        })}
                      />
                      Unlimited Stock
                    </label>
                    <small style={{ display: 'block', color: '#94a3b8', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                      Item never runs out (for digital services)
                    </small>
                  </div>

                  {!formData.stock_unlimited && (
                    <div className="form-group">
                      <label htmlFor="stock_quantity">Stock Quantity</label>
                      <input
                        type="number"
                        id="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        placeholder="Enter quantity (e.g., 10)"
                        min="0"
                      />
                      <small style={{ display: 'block', color: '#94a3b8', marginTop: '0.5rem' }}>
                        Current stock available for purchase. Set to 0 to mark as out of stock.
                      </small>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="cta-button">
                {editingItem ? 'Update Item' : 'Create Item'}
              </button>
              {editingItem && (
                <button type="button" className="secondary-button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-list-section">
          <div className="list-header">
            <h2>Existing Items ({filteredItems.length})</h2>
            <div className="filter-controls">
              <input
                type="text"
                placeholder="Search by name…"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(10,14,26,0.6)', color: '#f8fafc', fontSize: '0.9rem', minWidth: '160px' }}
              />
              <select name="filter_game" value={filterGame} onChange={(e) => setFilterGame(e.target.value)}>
                <option value="all">All Games</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
              <select name="filter_category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Game</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isOutOfStock = item.stock_enabled && !item.stock_unlimited &&
                    (item.stock_quantity === null || item.stock_quantity === 0)
                  return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.icon && (
                          <img
                            src={item.icon}
                            alt=""
                            style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )}
                        <div>
                          {item.name}
                          {item.featured && <span className="badge badge-featured" style={{ marginLeft: '0.5rem' }}>Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td>{item.game_name}</td>
                    <td>{item.category_name}</td>
                    <td>£{parseFloat(item.price).toFixed(2)}</td>
                    <td>
                      {!item.stock_enabled ? (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>—</span>
                      ) : item.stock_unlimited ? (
                        <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>∞ Unlimited</span>
                      ) : isOutOfStock ? (
                        <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>Out of Stock</span>
                      ) : (
                        <span style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700 }}>{item.stock_quantity} left</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`status-toggle ${item.active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleActive(item)}
                      >
                        {item.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-edit" onClick={() => handleEdit(item)}>
                          Edit
                        </button>
                        <button className="btn-duplicate" onClick={() => handleDuplicate(item)} title="Duplicate this item">
                          Copy
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(item)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setShowConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </section>
  )
}
