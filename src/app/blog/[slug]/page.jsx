import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPost, getBlogPosts } from '@/data/blog-posts'
import BlogImage from '@/components/BlogImage'
import './post.css'

export async function generateStaticParams() {
  return getBlogPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return { title: 'Not Found' }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `https://zeuservices.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://zeuservices.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  }
}

const categoryColors = {
  'GTA 5': '#fbbf24',
  'Fortnite': '#60a5fa',
  'Boosting': '#a78bfa',
  'Rocket League': '#34d399',
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return notFound()

  const allPosts = getBlogPosts().filter(p => p.slug !== slug).slice(0, 3)
  const color = categoryColors[post.category] || '#fbbf24'

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    url: `https://zeuservices.com/blog/${post.slug}`,
    image: `https://zeuservices.com${post.image}`,
    author: { '@type': 'Organization', name: 'Zeuservices', url: 'https://zeuservices.com' },
    publisher: {
      '@type': 'Organization',
      name: 'Zeuservices',
      logo: { '@type': 'ImageObject', url: 'https://zeuservices.com/zeus-logo-main.webp' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://zeuservices.com/blog/${post.slug}` },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="post-page">
        <div className="post-container">
          <nav className="post-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/blog">Guides</Link>
            <span>/</span>
            <span>{post.title}</span>
          </nav>

          <header className="post-header">
            <span className="post-category" style={{ background: color, color: '#0a0e1a' }}>
              {post.category}
            </span>
            <h1 className="post-title">{post.title}</h1>
            <div className="post-meta">
              <span>{new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>·</span>
              <span>{post.readTime}</span>
              <span>·</span>
              <span>By Zeuservices</span>
            </div>
          </header>

          <div className="post-hero-img">
            <BlogImage src={post.image} fallback={post.fallbackImage} alt={post.title} loading="eager" />
          </div>

          <div
            className="post-body"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="post-cta-box">
            <p>Ready to skip the grind? Browse our gaming services and get delivered safely via Discord.</p>
            <div className="post-cta-links">
              <Link href="/topups" className="post-cta-btn post-cta-primary">Browse Top-ups</Link>
              <Link href="/boosting" className="post-cta-btn post-cta-secondary">See Boosting</Link>
            </div>
          </div>
        </div>

        {allPosts.length > 0 && (
          <div className="post-related">
            <div className="post-related-inner">
              <h2 className="post-related-title">More Guides</h2>
              <div className="post-related-grid">
                {allPosts.map(p => {
                  const c = categoryColors[p.category] || '#fbbf24'
                  return (
                    <Link key={p.slug} href={`/blog/${p.slug}`} className="post-related-card">
                      <div className="post-related-img">
                        <BlogImage src={p.image} fallback={p.fallbackImage} alt={p.title} loading="lazy" />
                        <span className="post-related-cat" style={{ background: c, color: '#0a0e1a' }}>{p.category}</span>
                      </div>
                      <div className="post-related-body">
                        <h3>{p.title}</h3>
                        <span>{p.readTime}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
