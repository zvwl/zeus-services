import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import '../App.css'

export default function ServicesPage({ services, formatPrice }) {
  const navigate = useNavigate()
  const [filterPrice, setFilterPrice] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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

    return filtered
  }, [services, filterPrice, searchQuery])

  return (
    <section className="section services" id="services">
      <p className="eyebrow">Services</p>
      <h2 className="section-title">Choose your plan</h2>
      <p className="section-subtitle">Browse our services and click to view full details.</p>

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
      </div>

      {filteredServices.length === 0 ? (
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
  )
}
