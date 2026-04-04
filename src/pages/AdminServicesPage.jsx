import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ProtectedAdminRoute from '../components/ProtectedAdminRoute'
import LoadingSpinner from '../components/LoadingSpinner'
import './AdminOrdersPage.css'

export default function AdminServicesPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [services, setServices] = useState([])
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
    fetchServices()
  }, [isAdmin, authLoading, user, navigate])

  // Realtime subscription for services
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel('admin_services')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          fetchServices()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin])

  const fetchServices = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: queryError } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) throw queryError
      setServices(data || [])
    } catch (err) {
      console.error('Error fetching services:', err)
      setError(err.message || 'Failed to load services')
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

  const handleEdit = (service) => {
    setFormData({
      ...service,
      versions: service.versions?.length ? service.versions : ['Legacy', 'Enhanced'],
    })
    setDetailText(Array.isArray(service.details) ? service.details.join('\n') : '')
    setSelectedPlatform('')
    setSelectedVersion('')
    setEditingId(service.id)
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
        // Update existing service
        const { error: updateError } = await supabase
          .from('services')
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
        // Create new service
        const { error: insertError } = await supabase
          .from('services')
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

      await fetchServices()
      resetForm()
      setError('')
    } catch (err) {
      console.error('Error saving service:', err)
      setError(err.message || 'Failed to save service')
    }
  }

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return

    try {
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (deleteError) throw deleteError
      await fetchServices()
      setError('')
    } catch (err) {
      console.error('Error deleting service:', err)
      setError(err.message || 'Failed to delete service')
    }
  }

  if (authLoading) {
    return (
      <div className="admin-orders-container">
        <LoadingSpinner message="Verifying admin access..." />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="admin-orders-container">
      <h1>Manage Services</h1>

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
        {showForm ? 'Cancel' : '+ Add New Service'}
      </button>

      {showForm && (
        <div style={{
          background: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2>{editingId ? 'Edit Service' : 'Create New Service'}</h2>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label>Service Name *</label>
              <input
                type="text"
                name="service_name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., 50 Modded Cars"
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
                name="service_price"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="3.00"
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
                name="service_description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Service description"
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
                name="service_icon"
                value={formData.icon}
                onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🚗"
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
                  name="selected_platform"
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
                  name="selected_version"
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
                name="service_details"
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
                  name="service_active"
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
            {editingId ? 'Update Service' : 'Create Service'}
          </button>
        </div>
      )}

      {loading && <LoadingSpinner message="Loading services..." />}

      {!loading && services.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
          No services found. Create one to get started!
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {services.map(service => (
          <div key={service.id} style={{
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2rem' }}>{service.icon}</span>
                  <h3 style={{ margin: 0, color: '#fff' }}>{service.name}</h3>
                  {!service.active && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>INACTIVE</span>}
                </div>
                <p style={{ margin: '0.5rem 0', color: '#d1d5db' }}>{service.description}</p>
                <p style={{ margin: '0.5rem 0', color: '#10b981', fontWeight: 'bold' }}>£{parseFloat(service.price).toFixed(2)}</p>
                
                {service.platforms?.length > 0 && (
                  <div style={{ margin: '0.75rem 0' }}>
                    <strong style={{ color: '#9ca3af' }}>Platforms:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {service.platforms.map((platform, i) => (
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

                {service.versions?.length > 0 && (
                  <div style={{ margin: '0.75rem 0' }}>
                    <strong style={{ color: '#9ca3af' }}>Versions:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {service.versions.map((ver, i) => (
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
                  onClick={() => handleEdit(service)}
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
                  onClick={() => handleDelete(service.id)}
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
