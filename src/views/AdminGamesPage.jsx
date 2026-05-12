'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Breadcrumb from '@/components/Breadcrumb'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmModal from '@/components/ConfirmModal'
import { ToastContainer } from '@/components/Toast'
import '../App.css'
import './AdminForms.css'

export default function AdminGamesPage() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingGame, setEditingGame] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon_url: '',
    description: '',
    is_active: true,
    is_coming_soon: false,
    display_order: 0
  })
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

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setGames(data || [])
    } catch (err) {
      console.error('Error fetching games:', err)
      addToast('Failed to fetch games', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const title = editingGame ? 'Update Game' : 'Create Game'
    const message = editingGame 
      ? `Are you sure you want to update "${editingGame.name}"?`
      : `Are you sure you want to create "${formData.name}"?`

    setConfirmConfig({
      title,
      message,
      onConfirm: async () => {
        setShowConfirm(false)
        await performSave()
      }
    })
    setShowConfirm(true)
  }

  const performSave = async () => {
    try {
      if (editingGame) {
        // Update existing game
        const { error } = await supabase
          .from('games')
          .update({
            name: formData.name,
            slug: formData.slug,
            icon_url: formData.icon_url,
            description: formData.description,
            is_active: formData.is_active,
            is_coming_soon: formData.is_coming_soon,
            display_order: parseInt(formData.display_order),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingGame.id)

        if (error) throw error
        addToast('Game updated successfully', 'success')
      } else {
        // Create new game
        const { error } = await supabase
          .from('games')
          .insert([{
            name: formData.name,
            slug: formData.slug,
            icon_url: formData.icon_url,
            description: formData.description,
            is_active: formData.is_active,
            is_coming_soon: formData.is_coming_soon,
            display_order: parseInt(formData.display_order)
          }])

        if (error) throw error
        addToast('Game created successfully', 'success')
      }

      resetForm()
      fetchGames()
    } catch (err) {
      console.error('Error saving game:', err)
      addToast(`Failed to save game: ${err.message}`, 'error')
    }
  }

  const handleEdit = (game) => {
    setEditingGame(game)
    setFormData({
      name: game.name,
      slug: game.slug,
      icon_url: game.icon_url || '',
      description: game.description || '',
      is_active: game.is_active,
      is_coming_soon: game.is_coming_soon,
      display_order: game.display_order
    })
  }

  const handleDelete = async (game) => {
    setConfirmConfig({
      title: 'Delete Game',
      message: `Are you sure you want to delete ${game.name}? This will also delete all items for this game.`,
      onConfirm: async () => {
        setShowConfirm(false)
        await performDelete(game)
      }
    })
    setShowConfirm(true)
  }

  const performDelete = async (game) => {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', game.id)

      if (error) throw error
      addToast('Game deleted successfully', 'success')
      fetchGames()
    } catch (err) {
      console.error('Error deleting game:', err)
      addToast(`Failed to delete game: ${err.message}`, 'error')
    }
  }

  const moveGame = async (gameId, direction) => {
    const sorted = [...games].sort((a, b) => a.display_order - b.display_order)
    const idx = sorted.findIndex(g => g.id === gameId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const current = sorted[idx]
    const swap = sorted[swapIdx]
    const tempOrder = current.display_order
    const newOrder = swap.display_order

    try {
      await Promise.all([
        supabase.from('games').update({ display_order: newOrder }).eq('id', current.id),
        supabase.from('games').update({ display_order: tempOrder }).eq('id', swap.id),
      ])
      fetchGames()
    } catch (err) {
      addToast('Failed to reorder: ' + err.message, 'error')
    }
  }

  const resetForm = () => {
    setEditingGame(null)
    setFormData({
      name: '',
      slug: '',
      icon_url: '',
      description: '',
      is_active: true,
      is_coming_soon: false,
      display_order: 0
    })
  }

  if (loading) {
    return <LoadingSpinner message="Loading games..." />
  }

  return (
    <section className="section admin-section">
      <Breadcrumb
        customItems={[
          { label: 'Home', path: '/' },
          { label: 'Admin', path: '/admin/dashboard' },
          { label: 'Games', path: '/admin/games' }
        ]}
      />
      
      <h1 className="section-title">Manage Games</h1>
      <p className="section-subtitle">Add, edit, and manage games for your multi-game platform</p>

      <div className="admin-content">
        <div className="admin-form-section">
          <h2>{editingGame ? 'Edit Game' : 'Add New Game'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="name">Game Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="slug">Slug * (URL-friendly, e.g., "gta5")</label>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="icon_url">Icon URL</label>
              <input
                type="text"
                id="icon_url"
                value={formData.icon_url}
                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                placeholder="/game-icons/game-name.webp"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="display_order">Display Order</label>
              <input
                type="number"
                id="display_order"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_coming_soon"
                  checked={formData.is_coming_soon}
                  onChange={(e) => setFormData({ ...formData, is_coming_soon: e.target.checked })}
                />
                Coming Soon
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="cta-button">
                {editingGame ? 'Update Game' : 'Create Game'}
              </button>
              {editingGame && (
                <button type="button" className="secondary-button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-list-section">
          <h2>Existing Games ({games.length})</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...games].sort((a, b) => a.display_order - b.display_order).map((game, idx, arr) => (
                  <tr key={game.id}>
                    <td>
                      {game.icon_url ? (
                        <img
                          src={game.icon_url}
                          alt={game.name}
                          style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td>{game.name}</td>
                    <td><code>{game.slug}</code></td>
                    <td>
                      {game.is_active && game.is_coming_soon ? (
                        <span className="badge badge-warning">Coming Soon</span>
                      ) : game.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-error">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ minWidth: '1.5rem', textAlign: 'center' }}>{game.display_order}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button
                            className="btn-reorder"
                            onClick={() => moveGame(game.id, 'up')}
                            disabled={idx === 0}
                            title="Move up"
                          >▲</button>
                          <button
                            className="btn-reorder"
                            onClick={() => moveGame(game.id, 'down')}
                            disabled={idx === arr.length - 1}
                            title="Move down"
                          >▼</button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-edit" onClick={() => handleEdit(game)}>
                          Edit
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(game)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        confirmText="Confirm"
        cancelText="Cancel"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </section>
  )
}
