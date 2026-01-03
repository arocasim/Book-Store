import React from "react";
import { ShoppingCart, User, BookOpen, Menu, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const { user, cart } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const go = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const requireLogin = () => {
    alert("Спочатку увійдіть або зареєструйтесь.");
    go("auth");
  };

  const handleCartClick = () => {
    if (!user) return requireLogin();
    go("cart");
  };

  const handleProfileClick = () => {
    if (!user) return requireLogin();
    go("profile");
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo" onClick={() => go("home")}>
            <BookOpen size={32} />
            <span>Книжковий Світ</span>
          </div>

          <nav className={`nav ${mobileMenuOpen ? "nav-open" : ""}`}>
            <button
              className={`nav-link ${currentPage === "home" ? "active" : ""}`}
              onClick={() => go("home")}
            >
              Головна
            </button>

            <button
              className={`nav-link ${currentPage === "catalog" ? "active" : ""}`}
              onClick={() => go("catalog")}
            >
              Каталог
            </button>

            <button
              className={`nav-link ${currentPage === "about" ? "active" : ""}`}
              onClick={() => go("about")}
            >
              Про нас
            </button>

            {user && (
              <>
                <button
                  className={`nav-link ${currentPage === "reading-list" ? "active" : ""}`}
                  onClick={() => go("reading-list")}
                >
                  Список читання
                </button>

                <button
                  className={`nav-link ${currentPage === "orders" ? "active" : ""}`}
                  onClick={() => go("orders")}
                >
                  Історія покупок
                </button>
              </>
            )}
          </nav>

          <div className="header-actions">
            <button
              className="icon-button cart-button"
              onClick={handleCartClick}
              title={user ? "Кошик" : "Увійдіть, щоб відкрити кошик"}
            >
              <ShoppingCart size={20} />
              {user && cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
            </button>

            {user ? (
              <button
                className="icon-button"
                onClick={handleProfileClick}
                title="Профіль"
              >
                <User size={20} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => go("auth")}>
                Увійти
              </button>
            )}

            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
