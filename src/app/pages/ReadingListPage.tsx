import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { BookCard } from '../components/BookCard';

export const ReadingListPage: React.FC = () => {
  const navigate = useNavigate();
  const { readingList, books, user } = useAppContext();

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <h1>Список для читання</h1>
          <div className="empty-state">
            <p>Для використання списку читання необхідно увійти в систему</p>
            <button className="btn btn-primary" onClick={() => navigate('/auth')}>
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
            <button className="btn btn-primary" onClick={() => navigate('/catalog')}>
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
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </div>
  );
};
