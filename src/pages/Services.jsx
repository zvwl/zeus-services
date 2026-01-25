import { useNavigate } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import '../App.css'

export default function ServicesPage({ services, formatPrice }) {
  const navigate = useNavigate()

  return (
    <section className="section services" id="services">
      <p className="eyebrow">Services</p>
      <h2 className="section-title">Choose your plan</h2>
      <p className="section-subtitle">Browse our services and click to view full details.</p>

      <main className="services-grid">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            formatPrice={formatPrice}
          />
        ))}
      </main>
    </section>
  )
}
