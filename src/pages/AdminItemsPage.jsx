import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Breadcrumb from '../components/Breadcrumb'
import LoadingSpinner from '../components/LoadingSpinner'
import { ToastContainer } from '../components/Toast'
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
    platforms: [],
    versions: [],
    detailsText: '',
    active: true,
    featured: false
  })

  // Platform and version options
  const platformOptions = ['Steam', 'Epic Games', 'Xbox App', 'Rockstar Launcher']
  const versionOptions = ['Legacy', 'Enhanced']

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
        platforms: formData.platforms,
        versions: formData.versions,
        details: formData.detailsText
          .split('\n')
          .map((detail) => detail.trim())
          .filter((detail) => detail !== ''),
        active: formData.active,
        featured: formData.featured
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
    setEditingItem(item)
    setFormData({
      game_id: item.game_id,
      category_id: item.category_id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      description: item.description || '',
      icon: item.icon || '',
      platforms: item.platforms || [],
      versions: item.versions || [],
      detailsText: (item.details || []).join('\n'),
      active: item.active,
      featured: item.featured || false
    })
  }

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return
    }

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
      platforms: [],
      versions: [],
      detailsText: '',
      active: true,
      featured: false
    })
  }

  const handlePlatformToggle = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  const handleVersionToggle = (version) => {
    setFormData(prev => ({
      ...prev,
      versions: prev.versions.includes(version)
        ? prev.versions.filter(v => v !== version)
        : [...prev.versions, version]
    }))
  }


  // Filter items
  const filteredItems = items.filter(item => {
    if (filterGame !== 'all' && item.game_id !== filterGame) return false
    if (filterCategory !== 'all' && item.category_id !== filterCategory) return false
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

            <div className="form-group">
              <label>Platforms</label>
              <div className="checkbox-group-horizontal">
                {platformOptions.map(platform => (
                  <label key={platform}>
                    <input
                      type="checkbox"
                      checked={formData.platforms.includes(platform)}
                      onChange={() => handlePlatformToggle(platform)}
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Versions</label>
              <div className="checkbox-group-horizontal">
                {versionOptions.map(version => (
                  <label key={version}>
                    <input
                      type="checkbox"
                      checked={formData.versions.includes(version)}
                      onChange={() => handleVersionToggle(version)}
                    />
                    {version}
                  </label>
                ))}
              </div>
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
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                Featured
              </label>
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
              <select value={filterGame} onChange={(e) => setFilterGame(e.target.value)}>
                <option value="all">All Games</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
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
                    <td>£{item.price}</td>
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
                        <button className="btn-delete" onClick={() => handleDelete(item)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </section>
  )
}
