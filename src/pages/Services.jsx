import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import Pagination from '../components/Pagination'
import SEO, { SEO_CONFIGS } from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import '../App.css'

export default function ServicesPage({ services, formatPrice, servicesLoading }) {
  const navigate = useNavigate()
  const [filterPrice, setFilterPrice] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
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
  }, []}

  const filteredServices = useMemo(() => {
    let filtered = services

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
      )
    }

    // Price filter
    if (filterPrice !== 'all') {
      if (filterPrice === 'under50') {
        filtered = filtered.filter(s => s.price < 50)
      } else if (filterPrice === '50to100') {
        filtered = filtered.filter(s => s.price >= 50 && s.price < 100)
      } else if (filterPrice === '100to500') {
        filtered = filtered.filter(s => s.price >= 100 && s.price < 500)
      } else if (filterPrice === 'over500') {
        filtered = filtered.filter(s => s.price >= 500)
      }
    }

    // Sort by price
    if (sortBy === 'low-to-high') {
      filtered = filtered.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'high-to-low') {
      filtered = filtered.sort((a, b) => b.price - a.price)
    }

    return filtered
  }, [services, filterPrice, searchQuery, sortBy])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterPrice, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredServices.slice(startIndex, endIndex)
  }, [filteredServices, currentPage, itemsPerPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showSkeletons = servicesLoading && (!services || services.length === 0)
  const skeletonCount = 9

  return (
    <>
      <SEO {...SEO_CONFIGS.services} />
      <section className="section services" id="services">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Services', path: '/services' }]} />
        <p className="eyebrow">Services</p>
      <h1 className="section-title">GTA Online Services - Choose Your Plan</h1>
      <p className="section-subtitle">GTA Online boosting services for fast, professional progression across all platforms.</p>

      

      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <label htmlFor="price-filter">Filter by Price:</label>
          <select
            id="price-filter"
            value={filterPrice}
            onChange={(e) => setFilterPrice(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Prices</option>
            <option value="under50">Under £50</option>
            <option value="50to100">£50 - £100</option>
            <option value="100to500">£100 - £500</option>
            <option value="over500">Over £500</option>
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

      {showSkeletons ? (
        <main className="services-grid services-grid--loading" aria-busy="true" aria-live="polite">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div className="service-card skeleton" key={`skeleton-${index}`}>
              <div className="skeleton-image" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
              <div className="skeleton-footer">
                <div className="skeleton-button" />
              </div>
            </div>
          ))}
        </main>
      ) : filteredServices.length === 0 ? (
        <div className="no-results">
          <p>No services match your filters. Try adjusting your search.</p>
        </div>
      ) : (
        <>
          <main className="services-grid">
            {paginatedServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                item={service}
                onClick={(s) => navigate(`/service/${s.id}`, { state: { service: s } })}
                eagerImage={index === 0}
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
    </section>
    </>
  )
}
