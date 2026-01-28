import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import '../App.css'

export default function ProductsPage({ formatPrice }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [sortBy, setSortBy] = useState('none')
  const platformOptions = ['Steam', 'Epic Games', 'Xbox App', 'Rockstar Launcher']

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: true })

        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        console.error('Error fetching products:', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    let filtered = products

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      )
    }

    // Platform filter
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(product =>
        product.platforms && product.platforms.includes(selectedPlatform)
      )
    }

    // Sort by price
    if (sortBy === 'low-to-high') {
      filtered = filtered.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'high-to-low') {
      filtered = filtered.sort((a, b) => b.price - a.price)
    }

    return filtered
  }, [products, searchQuery, selectedPlatform, sortBy])

  return (
    <section className="section services" id="products">
      <p className="eyebrow">Products</p>
      <h2 className="section-title">Browse packaged offerings</h2>
      <p className="section-subtitle">Discover bundles, add-ons, and complete packages tailored for Zeus clients.</p>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          Loading products...
        </div>
      ) : (
        <>
          <div className="filters-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-controls">
              <label htmlFor="platform-filter">Platform:</label>
              <select
                id="platform-filter"
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Platforms</option>
                {platformOptions.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>

            <div className="filter-controls">
              <label htmlFor="sort-filter">Sort by Price:</label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="none">None</option>
                <option value="low-to-high">Low to High</option>
                <option value="high-to-low">High to Low</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="no-results">
              <p>No products match your filters. Try adjusting your search.</p>
            </div>
          ) : (
            <main className="services-grid">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="service-card"
                  onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
                >
                  {product.icon && (
                    <img src={product.icon} alt={product.name} className="card-image" />
                  )}
                  <h3 className="card-title">{product.name}</h3>
                  <p className="card-description">{product.description}</p>

                  {product.platforms && product.platforms.length > 0 && (
                    <div className="product-platforms">
                      {product.platforms.map(platform => (
                        <span key={platform} className="platform-badge">{platform}</span>
                      ))}
                    </div>
                  )}

                  <div className="card-footer">
                    <span className="card-price">
                      {formatPrice ? formatPrice(product.price) : `£${product.price}`}
                    </span>
                    <button 
                      className="view-details-btn"
                      onClick={(e) => { 
                        e.stopPropagation()
                        navigate(`/product/${product.id}`, { state: { product } })
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </main>
          )}
        </>
      )}
    </section>
  )
}
