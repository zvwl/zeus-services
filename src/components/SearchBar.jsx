'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import './SearchBar.css'

export default function SearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef(null)
  const getRelatedRecord = (value) => (Array.isArray(value) ? value[0] : value)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const pattern = `%${searchQuery.toLowerCase().replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim()}%`

        const [directNameResults, directSlugResults, categoryResults, gameResults] = await Promise.all([
          supabase
            .from('items')
            .select('id, name, slug, category_id, game_id, categories(slug, name), games(slug, name)')
            .ilike('name', pattern)
            .limit(8),
          supabase
            .from('items')
            .select('id, name, slug, category_id, game_id, categories(slug, name), games(slug, name)')
            .ilike('slug', pattern)
            .limit(8),
          supabase
            .from('categories')
            .select('id')
            .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
            .limit(12),
          supabase
            .from('games')
            .select('id')
            .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
            .limit(12)
        ])

        const categoryIds = (categoryResults.data || []).map((category) => category.id)
        const gameIds = (gameResults.data || []).map((game) => game.id)

        const [categoryItems, gameItems] = await Promise.all([
          categoryIds.length
            ? supabase
              .from('items')
              .select('id, name, slug, category_id, game_id, categories(slug, name), games(slug, name)')
              .in('category_id', categoryIds)
              .limit(8)
            : Promise.resolve({ data: [] }),
          gameIds.length
            ? supabase
              .from('items')
              .select('id, name, slug, category_id, game_id, categories(slug, name), games(slug, name)')
              .in('game_id', gameIds)
              .limit(8)
            : Promise.resolve({ data: [] })
        ])

        const mergedResults = [
          ...(directNameResults.data || []),
          ...(directSlugResults.data || []),
          ...(categoryItems.data || []),
          ...(gameItems.data || [])
        ]

        setResults(Array.from(new Map(mergedResults.map((item) => [item.id, item])).values()).slice(0, 8))
      } catch (err) {
        console.error('Search error:', err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (item) => {
    const category = getRelatedRecord(item.categories)
    const game = getRelatedRecord(item.games)
    const categorySlug = category?.slug || ''
    const gameSlug = game?.slug || ''

    if (categorySlug && gameSlug) {
      router.push(`/${categorySlug}/${gameSlug}/${item.slug}`)
      setSearchQuery('')
      setResults([])
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Could navigate to a search results page or just close the dropdown
      setIsOpen(false)
    }
  }

  return (
    <div className="search-bar-wrapper" ref={searchRef}>
      <div className="search-bar-input">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search Zeuservices..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
      </div>

      {isOpen && (
        <div className="search-results">
          {isLoading ? (
            <div className="search-loading">Searching...</div>
          ) : results.length === 0 && searchQuery.trim() ? (
            <div className="search-empty">No items found for "{searchQuery}"</div>
          ) : results.length > 0 ? (
            <div className="search-results-list">
              {results.map((item) => (
                <button
                  key={item.id}
                  className="search-result-item"
                  onClick={() => handleResultClick(item)}
                >
                  <div className="result-name">{item.name}</div>
                  <div className="result-meta">
                    {getRelatedRecord(item.categories)?.name && (
                      <span>{getRelatedRecord(item.categories).name}</span>
                    )}
                    {getRelatedRecord(item.games)?.name && (
                      <span> • {getRelatedRecord(item.games).name}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim().length > 0 ? null : null}
        </div>
      )}
    </div>
  )
}
