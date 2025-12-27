import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BookCard } from '../components/BookCard';

interface ReadingListPageProps {
  onNavigate: (page: string, bookId?: number) => void;
}

export const ReadingListPage: React.FC<ReadingListPageProps> = ({ onNavigate }) => {
  const { readingList, books, user } = useAppContext();

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <h1>Список для читання</h1>
          <div className="empty-state">
            <p>Для використання списку читання необхідно увійти в систему</p>
            <button className="btn btn-primary" onClick={() => onNavigate('auth')}>
              Увійти
            </button>
          </div>
        </div>
      </div>
    );
  }

  const readingListBooks = books.filter(book => readingList.includes(book.id));

  if (readingListBooks.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <h1>Список для читання</h1>
          <div className="empty-state">
            <p>Ваш список для читання порожній</p>
            <button className="btn btn-primary" onClick={() => onNavigate('catalog')}>
              Додати книги
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Список для читання</h1>
        <p className="page-subtitle">
          У вашому списку {readingListBooks.length} {readingListBooks.length === 1 ? 'книга' : 'книг'}
        </p>

        <div className="books-grid">
          {readingListBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onViewDetails={(id) => onNavigate('book', id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
