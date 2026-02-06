import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import SEO, { SEO_CONFIGS } from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import '../App.css'

export default function ServicesPage({ services, formatPrice, servicesLoading }) {
  const navigate = useNavigate()
  const [filterPrice, setFilterPrice] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('none')

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

  const showSkeletons = servicesLoading && (!services || services.length === 0)

  return (
    <>
      <SEO {...SEO_CONFIGS.services} />
      <section className="section services" id="services">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Services', path: '/services' }]} />
        <p className="eyebrow">Services</p>
      <h1 className="section-title">GTA Online Services - Choose Your Plan</h1>
      

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
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="service-card skeleton" key={`skeleton-${index}`}>
              <div className="skeleton-image" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
              <div className="skeleton-footer">
                <div className="skeleton-pill" />
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
        <main className="services-grid">
          {filteredServices.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              formatPrice={formatPrice}
            />
          ))}
        </main>
      )}
    </section>
    </>
  )
}
