import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, X, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { useAppContext } from '../context/AppContext';
import { BookCard } from '../components/BookCard';

interface AiRecommendation {
  bookId: number;
  reason: string;
}

export const CatalogPage: React.FC = () => {
  const { books, booksLoading } = useAppContext();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AiRecommendation[] | null>(null);
  const [aiMessage, setAiMessage] = useState('');

  const priceExtents = useMemo(() => {
    if (books.length === 0) return { min: 0, max: 1000 };
    const prices = books.map(b => b.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [books]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [priceInitialized, setPriceInitialized] = useState(false);

  useEffect(() => {
    if (books.length > 0 && !priceInitialized) {
      setPriceRange([priceExtents.min, priceExtents.max]);
      setPriceInitialized(true);
    }
  }, [books, priceExtents, priceInitialized]);

  const suggestions = useMemo(() => {
    if (searchQuery.length < 2 || aiResults) return [];
    const q = searchQuery.toLowerCase();
    return books
      .filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery, books, aiResults]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = ['all', ...Array.from(new Set(books.map(book => book.category)))];

  const handleAiSearch = async () => {
    const query = searchQuery.trim();
    if (!query || aiLoading) return;

    setAiLoading(true);
    setAiResults(null);
    setAiMessage('');
    setShowSuggestions(false);

    try {
      const res = await fetch('https://book-store1-h2ux.onrender.com/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Помилка сервера');
      }

      const validRecs = (Array.isArray(data.recommendations) ? data.recommendations : [])
        .filter((r: any) => {
          const id = Number(r?.bookId);
          return Number.isFinite(id) && books.some(b => b.id === id);
        })
        .map((r: any) => ({
          bookId: Number(r.bookId),
          reason: String(r.reason || ''),
        }));

      setAiResults(validRecs);
      setAiMessage(String(data.message || ''));

      if (validRecs.length === 0) {
        toast.info('AI не знайшов точних збігів. Спробуйте інший опис.');
      }
    } catch (err: any) {
      console.error('AI search error:', err);
      const msg = err?.message || String(err);
      toast.error(msg.length > 120 ? msg.substring(0, 120) + '...' : msg);
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiResults = () => {
    setAiResults(null);
    setAiMessage('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAiSearch();
    }
  };

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
    const matchesPrice = book.price >= priceRange[0] && book.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
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

  const aiReasonMap = new Map<number, string>();
  if (aiResults) {
    for (const r of aiResults) aiReasonMap.set(r.bookId, r.reason);
  }

  const displayBooks = aiResults
    ? aiResults
        .map(r => books.find(b => b.id === r.bookId))
        .filter((b): b is NonNullable<typeof b> => Boolean(b))
    : sortedBooks;

  return (
    <div className="page">
      <div className="container">
        <h1>Каталог книг</h1>

        <div className="catalog-filters">
          <div className="search-wrapper" ref={searchRef}>
            <div className={`search-box ${aiResults ? 'search-box-ai-active' : ''}`}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Опишіть яку книгу шукаєте або введіть назву..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  if (aiResults) clearAiResults();
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => { setSearchQuery(''); setShowSuggestions(false); clearAiResults(); }}
                  type="button"
                >
                  <X size={16} />
                </button>
              )}
              <button
                className="ai-search-btn"
                onClick={handleAiSearch}
                disabled={aiLoading || !searchQuery.trim()}
                title="AI Пошук (Ctrl+Enter)"
              >
                {aiLoading ? <Loader2 size={16} className="ai-spin" /> : <Sparkles size={16} />}
                <span>AI Пошук</span>
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map(book => (
                  <div
                    key={book.id}
                    className="search-suggestion-item"
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/book/${book.id}`);
                    }}
                  >
                    <img src={book.image} alt={book.title} className="suggestion-image" />
                    <div className="suggestion-info">
                      <span className="suggestion-title">{book.title}</span>
                      <span className="suggestion-author">{book.author}</span>
                    </div>
                    <span className="suggestion-price">{book.price} ₴</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!aiResults && (
            <>
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

              <div className="price-filter">
                <label className="price-filter-label">
                  Ціна: {priceRange[0]} ₴ — {priceRange[1]} ₴
                </label>
                <SliderPrimitive.Root
                  className="price-slider-root"
                  min={priceExtents.min}
                  max={priceExtents.max}
                  step={10}
                  value={priceRange}
                  onValueChange={(val) => setPriceRange(val as [number, number])}
                >
                  <SliderPrimitive.Track className="price-slider-track">
                    <SliderPrimitive.Range className="price-slider-range" />
                  </SliderPrimitive.Track>
                  <SliderPrimitive.Thumb className="price-slider-thumb" />
                  <SliderPrimitive.Thumb className="price-slider-thumb" />
                </SliderPrimitive.Root>
              </div>
            </>
          )}
        </div>

        {aiResults && (
          <div className="ai-results-header">
            <div className="ai-results-info">
              <Sparkles size={20} />
              <div>
                <h3>AI рекомендує</h3>
                {aiMessage && <p className="ai-results-message">{aiMessage}</p>}
              </div>
            </div>
            <button className="btn btn-outline" onClick={clearAiResults}>
              Показати весь каталог
            </button>
          </div>
        )}

        {!aiResults && (
          <div className="catalog-results">
            <p>{sortedBooks.length} {sortedBooks.length === 1 ? 'книга' : 'книг'} знайдено</p>
          </div>
        )}

        {aiLoading && (
          <div className="ai-loading-state">
            <Loader2 size={32} className="ai-spin" />
            <p>AI аналізує каталог та шукає найкращі варіанти...</p>
          </div>
        )}

        {!aiLoading && displayBooks.length > 0 ? (
          <div className="books-grid">
            {displayBooks.map(book => (
              <div key={book.id} className="book-card-wrapper">
                <BookCard book={book} />
                {aiReasonMap.has(book.id) && (
                  <div className="ai-reason-badge">
                    <Sparkles size={14} />
                    <span>{aiReasonMap.get(book.id)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          !aiLoading && (
            <div className="empty-state">
              <p>
                {aiResults
                  ? 'AI не знайшов підходящих книг. Спробуйте інший опис.'
                  : 'Книги не знайдені. Спробуйте змінити фільтри.'}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
