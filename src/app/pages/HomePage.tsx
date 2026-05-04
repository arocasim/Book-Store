import React from 'react';
import { Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BookCard } from '../components/BookCard';
import { SpecialOffers } from '../components/SpecialOffers';

export const HomePage: React.FC = () => {
  const { books } = useAppContext();
  const navigate = useNavigate();

  const featuredBooks = books.filter(book => book.featured);
  const discountedBooks = books.filter(book => book.discount && book.discount > 0);

  return (
    <div className="page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Відкрийте світ українських книг</h1>
            <p>
              Найбільший вибір української літератури. Знижки до 30% на обрані книги!
            </p>
            <button className="btn btn-primary btn-large" onClick={() => navigate('/catalog')}>
              Переглянути каталог
            </button>
          </div>
        </div>
      </section>

      <div className="container">
        <SpecialOffers />

        {featuredBooks.length > 0 && (
          <section className="section">
            <div className="section-header">
              <Star size={24} />
              <h2>Рекомендовані книги</h2>
            </div>
            <div className="books-grid">
              {featuredBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}

        {discountedBooks.length > 0 && (
          <section className="section">
            <div className="section-header">
              <Sparkles size={24} />
              <h2>Акції та знижки</h2>
            </div>
            <div className="books-grid">
              {discountedBooks.slice(0, 4).map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
