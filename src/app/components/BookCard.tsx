import React from 'react';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Book } from '../types';
import { useAppContext } from '../context/AppContext';

interface BookCardProps {
  book: Book;
  onViewDetails: (bookId: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onViewDetails }) => {
  const { addToCart, addToReadingList, readingList } = useAppContext();

  const isInReadingList = readingList.includes(book.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(book.id);
  };

  const handleToggleReadingList = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToReadingList(book.id);
  };

  return (
    <div className="book-card" onClick={() => onViewDetails(book.id)}>
      {book.discount && (
        <div className="book-badge">-{book.discount}%</div>
      )}
      {book.special && !book.discount && (
        <div className="book-badge special">Акція</div>
      )}

      <div className="book-image">
        <img src={book.image} alt={book.title} className="w-full h-auto" />
      </div>

      <div className="book-content">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>

        <div className="book-rating">
          <Star size={16} fill="currentColor" />
          <span>{book.rating.toFixed(1)}</span>
          <span className="book-reviews">({book.reviews.length})</span>
        </div>

        <div className="book-footer">
          <div className="book-price">
            <span className="price">{book.price} ₴</span>
            {book.originalPrice && (
              <span className="original-price">{book.originalPrice} ₴</span>
            )}
          </div>

          <div className="book-actions">
            <button
              className={`icon-button ${isInReadingList ? 'active' : ''}`}
              onClick={handleToggleReadingList}
              title="Додати до списку читання"
            >
              <Heart size={18} fill={isInReadingList ? 'currentColor' : 'none'} />
            </button>
            <button
              className="icon-button"
              onClick={handleAddToCart}
              title="Додати до кошика"
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
