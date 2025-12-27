import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { BookCard } from '../components/BookCard';
import { seedBooksOnce } from "../scripts/seedBooks";

interface CatalogPageProps {
  onNavigate: (page: string, bookId?: number) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onNavigate }) => {
  const { books, booksLoading } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  const categories = ['all', ...Array.from(new Set(books.map(book => book.category)))];

  if (booksLoading) {
  return (
    <div className="page">
      <div className="container">
        <h1>Каталог книг</h1>
        <p>Завантаження...</p>
      </div>
    </div>
  );
}

  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  return (
    <div className="page">
      <div className="container">
        <h1>Каталог книг</h1>


        <div className="catalog-filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Пошук за назвою або автором..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <Filter size={18} />
              <label>Категорія:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Всі категорії' : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Сортувати:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="title">За назвою</option>
                <option value="price-asc">За ціною (зростання)</option>
                <option value="price-desc">За ціною (спадання)</option>
                <option value="rating">За рейтингом</option>
              </select>
            </div>
          </div>
        </div>

        <div className="catalog-results">
          <p>{sortedBooks.length} {sortedBooks.length === 1 ? 'книга' : 'книг'} знайдено</p>
        </div>

        {sortedBooks.length > 0 ? (
          <div className="books-grid">
            {sortedBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onViewDetails={(id) => onNavigate('book', id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Книги не знайдені. Спробуйте змінити фільтри.</p>
          </div>
        )}
      </div>
    </div>
  );
};
