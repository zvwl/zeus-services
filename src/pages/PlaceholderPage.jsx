import '../App.css'

export default function PlaceholderPage({ title, description }) {
  return (
    <section className="section services" aria-label={title}>
      <p className="eyebrow">Coming soon</p>
      <h2 className="section-title">{title}</h2>
      <p className="section-subtitle">{description}</p>
    </section>
  )
}
