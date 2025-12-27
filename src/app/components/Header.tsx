import React from 'react';
import { ShoppingCart, User, BookOpen, Menu, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const { user, cart } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo" onClick={() => onNavigate('home')}>
            <BookOpen size={32} />
            <span>Книжковий Світ</span>
          </div>

          <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <button
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
            >
              Головна
            </button>
            <button
              className={`nav-link ${currentPage === 'catalog' ? 'active' : ''}`}
              onClick={() => {
                onNavigate('catalog');
                setMobileMenuOpen(false);
              }}
            >
              Каталог
            </button>
            <button
              className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
              onClick={() => {
                onNavigate('about');
                setMobileMenuOpen(false);
              }}
            >
              Про нас
            </button>

            {user && (
              <>
                <button
                  className={`nav-link ${currentPage === 'reading-list' ? 'active' : ''}`}
                  onClick={() => {
                    onNavigate('reading-list');
                    setMobileMenuOpen(false);
                  }}
                >
                  Список читання
                </button>
                <button
                  className={`nav-link ${currentPage === 'orders' ? 'active' : ''}`}
                  onClick={() => {
                    onNavigate('orders');
                    setMobileMenuOpen(false);
                  }}
                >
                  Історія покупок
                </button>
              </>
            )}
          </nav>

          <div className="header-actions">
            <button
              className="icon-button cart-button"
              onClick={() => onNavigate('cart')}
              title="Кошик"
            >
              <ShoppingCart size={20} />
              {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
            </button>

            {user ? (
              <button
                className="icon-button"
                onClick={() => onNavigate('profile')}
                title="Профіль"
              >
                <User size={20} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => onNavigate('auth')}>
                Увійти
              </button>
            )}

            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
