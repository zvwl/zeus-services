import Link from 'next/link'
import { getBlogPosts } from '@/data/blog-posts'
import BlogImage from '@/components/BlogImage'
import './blog.css'

export const metadata = {
  title: 'Gaming Guides & Tips | Zeuservices Blog',
  description: 'Expert guides on GTA 5 money, Fortnite V-Bucks, Rocket League Credits, game boosting, and more. Learn how to get the most out of your favourite games.',
  alternates: { canonical: 'https://zeuservices.com/blog' },
  openGraph: {
    title: 'Gaming Guides & Tips | Zeuservices Blog',
    description: 'Expert gaming guides covering GTA 5, Fortnite, Rocket League and more.',
    url: 'https://zeuservices.com/blog',
  },
}

const categoryColors = {
  'GTA 5': '#fbbf24',
  'Fortnite': '#60a5fa',
  'Boosting': '#a78bfa',
  'Rocket League': '#34d399',
}

export default function BlogPage() {
  const posts = getBlogPosts()

  const blogListSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Zeuservices Gaming Guides',
    url: 'https://zeuservices.com/blog',
    description: 'Expert gaming guides and tips for GTA 5, Fortnite, Rocket League, and more.',
    blogPost: posts.map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `https://zeuservices.com/blog/${p.slug}`,
      datePublished: p.publishedAt,
      description: p.excerpt,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }} />
      <div className="blog-page">
        <div className="blog-hero">
          <div className="blog-hero-inner">
            <p className="blog-eyebrow">Gaming Guides</p>
            <h1 className="blog-hero-title">Tips, Guides & Strategies</h1>
            <p className="blog-hero-sub">Expert advice on getting the most out of GTA 5, Fortnite, Rocket League, and more — from the team that's been in the game for 9+ years.</p>
          </div>
        </div>

        <div className="blog-container">
          <div className="blog-grid">
            {posts.map(post => {
              const color = categoryColors[post.category] || '#fbbf24'
              return (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
                  <div className="blog-card-img">
                    <BlogImage src={post.image} fallback={post.fallbackImage} alt={post.title} loading="lazy" />
                    <span className="blog-card-category" style={{ background: color, color: '#0a0e1a' }}>
                      {post.category}
                    </span>
                  </div>
                  <div className="blog-card-body">
                    <h2 className="blog-card-title">{post.title}</h2>
                    <p className="blog-card-excerpt">{post.excerpt}</p>
                    <div className="blog-card-meta">
                      <span>{new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
