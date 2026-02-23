import { Link, useLocation } from 'react-router-dom'
import './Breadcrumb.css'

/**
 * Breadcrumb component with structured data for SEO
 * Automatically generates breadcrumbs based on current route
 */
export default function Breadcrumb({ customItems }) {
  const location = useLocation()
  
  // If custom items provided, use those
  if (customItems) {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": customItems.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        "item": `https://zeuservices.com${item.path}`
      }))
    }

    return (
      <>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            {customItems.map((item, index) => (
              <li key={`breadcrumb-item-${index}`} className="breadcrumb-item">
                {index < customItems.length - 1 ? (
                  <>
                    {item.path ? (
                      <>
                        <Link to={item.path}>{item.label}</Link>
                        <span className="breadcrumb-separator">/</span>
                      </>
                    ) : (
                      <>
                        <span className="breadcrumb-label">{item.label}</span>
                        <span className="breadcrumb-separator">/</span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="breadcrumb-current" aria-current="page">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </>
    )
  }

  // Auto-generate from path
  const pathnames = location.pathname.split('/').filter(x => x)
  
  if (pathnames.length === 0) return null

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    ...pathnames.map((name, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`
      const label = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')
      return { label, path }
    })
  ]

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `https://zeuservices.com${item.path}`
    }))
  }

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          {breadcrumbItems.map((item, index) => (
            <li key={item.path} className="breadcrumb-item">
              {index < breadcrumbItems.length - 1 ? (
                <>
                  <Link to={item.path}>{item.label}</Link>
                  <span className="breadcrumb-separator">/</span>
                </>
              ) : (
                <span className="breadcrumb-current" aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
