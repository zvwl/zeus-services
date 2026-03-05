import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SEO, { SEO_CONFIGS } from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import LoadingSpinner from '../components/LoadingSpinner'
import ServiceCard from '../components/ServiceCard'
import Pagination from '../components/Pagination'
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  // Responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth < 768 ? 6 : 12)
    }
    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [])
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedPlatform, sortBy])

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

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, itemsPerPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
            <>
              <main className="services-grid">
                {paginatedProducts.map(product => (
                  <ServiceCard
                    key={product.id}
                    item={product}
                    onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
                    formatPrice={formatPrice}
                  />
                ))}
              </main>
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </>
      )}
    </section>
    </>
  )
}