import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ProtectedAdminRoute from '../components/ProtectedAdminRoute'
import './AdminOrdersPage.css'

export default function AdminProductsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    icon: '',
    platforms: [],
    versions: ['Legacy', 'Enhanced'],
    details: [],
    active: true
  })
  const platformOptions = ['Steam', 'Epic Games', 'Xbox App', 'Rockstar Launcher']
  const versionOptions = ['Legacy', 'Enhanced']
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('')
  const [detailText, setDetailText] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }
    if (!isAdmin) {
      navigate('/')
      return
    }
    fetchProducts()
  }, [isAdmin, authLoading, user, navigate])

  // Realtime subscription for products
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel('admin_products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin])

  const fetchProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: queryError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) throw queryError
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      icon: '',
      platforms: [],
      versions: ['Legacy', 'Enhanced'],
      details: [],
      active: true
    })
    setSelectedPlatform('')
    setSelectedVersion('')
    setDetailText('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (product) => {
    setFormData({
      ...product,
      versions: product.versions?.length ? product.versions : ['Legacy', 'Enhanced'],
    })
    setDetailText(Array.isArray(product.details) ? product.details.join('\n') : '')
    setSelectedPlatform('')
    setSelectedVersion('')
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleAddPlatform = () => {
    if (selectedPlatform && !formData.platforms.includes(selectedPlatform)) {
      setFormData(prev => ({
        ...prev,
        platforms: [...prev.platforms, selectedPlatform]
      }))
      setSelectedPlatform('')
    }
  }

  const handleRemovePlatform = (index) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.filter((_, i) => i !== index)
    }))
  }

  const handleAddVersion = () => {
    if (selectedVersion && !formData.versions.includes(selectedVersion)) {
      setFormData(prev => ({
        ...prev,
        versions: [...prev.versions, selectedVersion]
      }))
      setSelectedVersion('')
    }
  }

  const handleRemoveVersion = (index) => {
    setFormData(prev => ({
      ...prev,
      versions: prev.versions.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      setError('Name and price are required')
      return
    }

    try {
      if (editingId) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            price: parseFloat(formData.price),
            description: formData.description,
            icon: formData.icon,
            platforms: formData.platforms,
            versions: formData.versions,
            details: detailText ? detailText.split('\n') : [],
            active: formData.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (updateError) throw updateError
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            price: parseFloat(formData.price),
            description: formData.description,
            icon: formData.icon,
            platforms: formData.platforms,
            versions: formData.versions,
            details: detailText ? detailText.split('\n') : [],
            active: formData.active
          }])

        if (insertError) throw insertError
      }

      await fetchProducts()
      resetForm()
      setError('')
    } catch (err) {
      console.error('Error saving product:', err)
      setError(err.message || 'Failed to save product')
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (deleteError) throw deleteError
      await fetchProducts()
      setError('')
    } catch (err) {
      console.error('Error deleting product:', err)
      setError(err.message || 'Failed to delete product')
    }
  }

  if (authLoading) {
    return (
      <div className="admin-orders-container">
        <div className="loading">Verifying admin access...</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="admin-orders-container">
      <h1>Manage Products</h1>

      {error && <div className="error-message">{error}</div>}

      <button 
        onClick={() => showForm ? resetForm() : setShowForm(true)}
        style={{
          padding: '0.75rem 1.5rem',
          marginBottom: '2rem',
          background: showForm ? '#ef4444' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '500'
        }}
      >
        {showForm ? 'Cancel' : '+ Add New Product'}
      </button>

      {showForm && (
        <div style={{
          background: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2>{editingId ? 'Edit Product' : 'Create New Product'}</h2>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label>Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., GTA Bundle Pack"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#fff',
                  marginTop: '0.5rem'
                }}
              />
            </div>

            <div>
              <label>Price (GBP) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="9.99"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#fff',
                  marginTop: '0.5rem'
                }}
              />
            </div>

            <div>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Product description"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#fff',
                  marginTop: '0.5rem',
                  minHeight: '80px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label>Icon (emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="📦"
                maxLength="2"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#fff',
                  marginTop: '0.5rem'
                }}
              />
            </div>

            <div>
              <label>Platforms</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <select
                  value={selectedPlatform}
                  onChange={e => setSelectedPlatform(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                >
                  <option value="">Select a platform</option>
                  {platformOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAddPlatform}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {formData.platforms.map((platform, index) => (
                  <span key={index} style={{
                    background: '#374151',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {platform}
                    <button
                      onClick={() => handleRemovePlatform(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label>Versions</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <select
                  value={selectedVersion}
                  onChange={e => setSelectedVersion(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                >
                  <option value="">Select a version</option>
                  {versionOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAddVersion}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {formData.versions?.map((version, index) => (
                  <span key={index} style={{
                    background: '#374151',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {version}
                    <button
                      onClick={() => handleRemoveVersion(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label>Details (multiline)</label>
              <textarea
                value={detailText}
                onChange={e => setDetailText(e.target.value)}
                placeholder="Enter details. Use new lines if you want bullet-style lines."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#fff',
                  minHeight: '120px',
                  fontFamily: 'inherit',
                  marginTop: '0.5rem'
                }}
              />
              <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Tip: Use separate lines for bullets. They will be stored as an array split by newlines.
              </p>
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                />
                {' '}Active
              </label>
            </div>
          </div>

          <button 
            onClick={handleSave}
            style={{
              padding: '0.75rem 2rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            {editingId ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      )}

      {loading && <div className="loading">Loading products...</div>}

      {!loading && products.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
          No products found. Create one to get started!
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {products.map(product => (
          <div key={product.id} style={{
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2rem' }}>{product.icon}</span>
                  <h3 style={{ margin: 0, color: '#fff' }}>{product.name}</h3>
                  {!product.active && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>INACTIVE</span>}
                </div>
                <p style={{ margin: '0.5rem 0', color: '#d1d5db' }}>{product.description}</p>
                <p style={{ margin: '0.5rem 0', color: '#10b981', fontWeight: 'bold' }}>£{parseFloat(product.price).toFixed(2)}</p>
                
                {product.platforms?.length > 0 && (
                  <div style={{ margin: '0.75rem 0' }}>
                    <strong style={{ color: '#9ca3af' }}>Platforms:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {product.platforms.map((platform, i) => (
                        <span key={i} style={{
                          background: '#374151',
                          color: '#d1d5db',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '3px',
                          fontSize: '0.875rem'
                        }}>
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.versions?.length > 0 && (
                  <div style={{ margin: '0.75rem 0' }}>
                    <strong style={{ color: '#9ca3af' }}>Versions:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {product.versions.map((ver, i) => (
                        <span key={i} style={{
                          background: '#374151',
                          color: '#d1d5db',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '3px',
                          fontSize: '0.875rem'
                        }}>
                          {ver}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button 
                  onClick={() => handleEdit(product)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
