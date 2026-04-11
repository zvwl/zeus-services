import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './CategoryNavBar.css'

export default function CategoryNavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, display_order')
          .order('display_order', { ascending: true })

        if (error) throw error

        // Filter to show only the main categories (Topups, Accounts, Boosting)
        const mainCategories = data?.filter(cat =>
          ['topups', 'accounts', 'boosting'].includes(cat.slug)
        ) || []

        setCategories(mainCategories)
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }

    fetchCategories()
  }, [])

  const isActive = (slug) => location.pathname.startsWith(`/${slug}`)

  const handleCategoryClick = (slug) => {
    navigate(`/${slug}`)
  }

  return (
    <nav className="category-nav-bar">
      <div className="category-nav-container">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-tab ${isActive(category.slug) ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </nav>
  )
}
