'use client'

export default function BlogImage({ src, fallback, alt, className, loading = 'lazy' }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => { e.target.src = fallback }}
    />
  )
}
