import React, { useState } from 'react';
import { Star, ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface BookDetailsPageProps {
  bookId: number;
  onNavigate: (page: string) => void;
}

export const BookDetailsPage: React.FC<BookDetailsPageProps> = ({ bookId, onNavigate }) => {
  const { books, addToCart, addToReadingList, removeFromReadingList, readingList, user, addReview } = useAppContext();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  const book = books.find(b => b.id === bookId);

  if (!book) {
    return (
      <div className="page">
        <div className="container">
          <h1>Книгу не знайдено</h1>
          <button className="btn btn-primary" onClick={() => onNavigate('catalog')}>
            Повернутися до каталогу
          </button>
        </div>
      </div>
    );
  }

  const isInReadingList = readingList.includes(book.id);

  const handleSubmitReview = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) {
    alert("Для залишення відгуку необхідно увійти в систему");
    return;
  }

  try {
    await addReview(book.id, newRating, newComment);
    setNewComment("");
    setNewRating(5);
  } catch (err: any) {
    alert(err?.message || "Помилка додавання відгуку");
  }
};


  return (
    <div className="page">
      <div className="container">
        <button className="back-button" onClick={() => onNavigate('catalog')}>
          <ArrowLeft size={20} />
          <span>Назад до каталогу</span>
        </button>

        <div className="book-details">
          <div className="book-details-image">
            <img src={book.image} alt={book.title} className="w-full h-auto" />
            {book.discount && (
              <div className="book-badge">-{book.discount}%</div>
            )}
          </div>

          <div className="book-details-content">
            <h1>{book.title}</h1>
            <p className="book-details-author">Автор: {book.author}</p>

            <div className="book-rating">
              <Star size={20} fill="currentColor" />
              <span>{book.rating.toFixed(1)}</span>
              <span className="book-reviews">({book.reviews.length} відгуків)</span>
            </div>

            <div className="book-price-section">
              <span className="price large">{book.price} ₴</span>
              {book.originalPrice && (
                <span className="original-price large">{book.originalPrice} ₴</span>
              )}
            </div>

            <p className="book-description">{book.description}</p>

            <div className="book-info-grid">
              <div className="book-info-item">
                <span className="label">ISBN:</span>
                <span>{book.isbn}</span>
              </div>
              <div className="book-info-item">
                <span className="label">Сторінок:</span>
                <span>{book.pages}</span>
              </div>
              <div className="book-info-item">
                <span className="label">Мова:</span>
                <span>{book.language}</span>
              </div>
              <div className="book-info-item">
                <span className="label">Видавництво:</span>
                <span>{book.publisher}</span>
              </div>
              <div className="book-info-item">
                <span className="label">Рік видання:</span>
                <span>{book.year}</span>
              </div>
              <div className="book-info-item">
                <span className="label">Категорія:</span>
                <span>{book.category}</span>
              </div>
            </div>

            <div className="book-details-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={() => addToCart(book.id)}
              >
                <ShoppingCart size={20} />
                Додати до кошика
              </button>
              <button
                className={`btn ${isInReadingList ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() =>
                  isInReadingList
                    ? removeFromReadingList(book.id)
                    : addToReadingList(book.id)
                }
              >
                <Heart size={20} fill={isInReadingList ? 'currentColor' : 'none'} />
                {isInReadingList ? 'У списку читання' : 'Додати до списку'}
              </button>
            </div>
          </div>
        </div>

        <section className="reviews-section">
          <h2>Відгуки</h2>

          {user && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <h3>Залишити відгук</h3>
              <div className="rating-input">
                <label>Оцінка:</label>
                <div className="stars-input">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewRating(rating)}
                      className={`star-button ${rating <= newRating ? 'active' : ''}`}
                    >
                      <Star size={24} fill={rating <= newRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Ваш коментар (необов'язково)..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Відправити відгук
              </button>
            </form>
          )}

          <div className="reviews-list">
            {book.reviews.length > 0 ? (
              book.reviews.map(review => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <span className="review-author">{review.userName}</span>
                    <span className="review-date">{review.date}</span>
                  </div>
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="empty-state">Ще немає відгуків. Будьте першим!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};