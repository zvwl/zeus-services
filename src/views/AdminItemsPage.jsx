'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Breadcrumb from '@/components/Breadcrumb'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmModal from '@/components/ConfirmModal'
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
          selectedOptions: field.selectedOptions,
          availableOptions: field.availableOptions
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
            availableOptions: field.availableOptions || [],
            selectedOptions: field.selectedOptions || []
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
    const newField = {
      id: `field-${Date.now()}`,
      fieldName: '',
      availableOptions: [],
      selectedOptions: []
    }
    setFormData(prev => ({
      ...prev,
      customFields: [...prev.customFields, newField]
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
              <label htmlFor="icon">Icon/Image URL</label>
              <input
                type="text"
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="https://example.com/image.png or /game-icons/image.webp"
              />
              <small style={{ display: 'block', color: '#94a3b8', marginTop: '0.5rem', lineHeight: '1.5' }}>
                Recommended: 1000×600px (5:3 aspect ratio). Upload images to <code>/public/service-images/</code> folder and use path like <code>/service-images/your-image.webp</code>
              </small>
              {formData.icon && (
                <div style={{ marginTop: '0.75rem' }}>
                  <img
                    src={formData.icon}
                    alt="Preview"
                    style={{ 
                      maxWidth: '200px', 
                      height: 'auto', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(251, 191, 36, 0.2)',
                      display: 'block'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextElementSibling.style.display = 'block'
                    }}
                  />
                  <small style={{ display: 'none', color: '#ef4444', marginTop: '0.5rem' }}>
                    Failed to load image preview
                  </small>
                </div>
              )}
            </div>

            {/* Custom Fields Section */}
            <div className="form-group" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ margin: 0, color: '#3b82f6', fontWeight: 600 }}>Custom Dropdown Fields</label>
                <button
                  type="button"
                  className="btn-add"
                  onClick={addCustomField}
                  style={{ fontSize: '0.9rem' }}
                >
                  + Add Field Group
                </button>
              </div>
              <small style={{ display: 'block', color: '#94a3b8', marginBottom: '1rem', lineHeight: '1.5' }}>
                Create custom dropdown fields like Platform, Version, Region, Language, etc. Each field can have multiple checkbox options.
              </small>

              {formData.customFields.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontStyle: 'italic' }}>
                  No custom fields yet. Click "Add Field Group" to create your first dropdown field.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {formData.customFields.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        padding: '1.25rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(251, 191, 36, 0.25)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                            Field Name (e.g., Platform, Version, Region)
                          </label>
                          <input
                            type="text"
                            name={`custom-field-name-${field.id}`}
                            value={field.fieldName}
                            onChange={(e) => updateFieldName(field.id, e.target.value)}
                            placeholder="Enter field name..."
                            style={{
                              width: '100%',
                              padding: '0.6rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              borderRadius: '6px',
                              color: '#f1f5f9'
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => removeCustomField(field.id)}
                          title="Remove this field group"
                          style={{ marginTop: '1.7rem' }}
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                          Add Options for this field
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            name={`custom-field-option-input-${field.id}`}
                            placeholder="Enter option name..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addFieldOption(field.id, e.target.value)
                                e.target.value = ''
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '0.6rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              borderRadius: '6px',
                              color: '#f1f5f9'
                            }}
                          />
                          <button
                            type="button"
                            className="btn-add"
                            onClick={(e) => {
                              const input = e.target.previousElementSibling
                              addFieldOption(field.id, input.value)
                              input.value = ''
                            }}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {field.availableOptions.length > 0 && (
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#fbbf24' }}>
                            Select options to include:
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {field.availableOptions.map((option) => (
                              <div
                                key={option}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.5rem 0.75rem',
                                  background: field.selectedOptions.includes(option)
                                    ? 'rgba(251, 191, 36, 0.15)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                  border: `1px solid ${
                                    field.selectedOptions.includes(option)
                                      ? 'rgba(251, 191, 36, 0.5)'
                                      : 'rgba(148, 163, 184, 0.3)'
                                  }`,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onClick={() => toggleFieldOption(field.id, option)}
                              >
                                <input
                                  type="checkbox"
                                  name={`custom-field-option-${field.id}-${option}`}
                                  checked={field.selectedOptions.includes(option)}
                                  onChange={() => toggleFieldOption(field.id, option)}
                                  style={{ cursor: 'pointer' }}
                                />
                                <span style={{ color: '#f1f5f9', fontSize: '0.9rem' }}>{option}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeFieldOption(field.id, option)
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '0 0.25rem',
                                    fontSize: '1.1rem',
                                    lineHeight: 1
                                  }}
                                  title="Remove this option"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
