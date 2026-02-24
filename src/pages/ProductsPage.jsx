import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SEO, { SEO_CONFIGS } from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import LoadingSpinner from '../components/LoadingSpinner'
import { isPrerender } from '../utils/isPrerender'
import '../App.css'
import '../components/ServiceCard.css'

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
      if (isPrerender()) {
        setProducts([])
        setLoading(false)
        return
      }
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
    <>
      <SEO {...SEO_CONFIGS.products} />
      <section className="section services" id="products">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Products', path: '/products' }]} />
        <p className="eyebrow">Products</p>
      <h1 className="section-title">GTA Online Products - Premium Modded Accounts</h1>
      <p className="section-subtitle">Premium GTA Online modded accounts and bundles for Steam, Epic Games, Xbox App, and Rockstar Launcher.</p>
      

      {loading ? (
        <LoadingSpinner message="Loading products..." />
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
                  <img 
                    src={product.icon || '/zeusservicesPackage.png'} 
                    alt={product.name} 
                    className="card-image" 
                    width="600"
                    height="300"
                    onError={(e) => {
                      e.target.src = '/zeusservicesPackage.png'
                    }}
                  />
                  <h3 className="card-title">{product.name}</h3>
                  <p className="card-description">{product.description}</p>

                  <div className="card-footer">
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
    </>
  )
}
