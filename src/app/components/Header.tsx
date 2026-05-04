import React from "react";
import { ShoppingCart, User, BookOpen, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export const Header: React.FC = () => {
  const { user, cart } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const go = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const requireLogin = () => {
    toast.warning("Спочатку увійдіть або зареєструйтесь.");
    go("/auth");
  };

  const handleCartClick = () => {
    if (!user) return requireLogin();
    go("/cart");
  };

  const handleProfileClick = () => {
    if (!user) return requireLogin();
    go("/profile");
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo" onClick={() => go("/")}>
            <BookOpen size={32} />
            <span>Книжковий Світ</span>
          </div>

          <nav className={`nav ${mobileMenuOpen ? "nav-open" : ""}`}>
            <button
              className={`nav-link ${pathname === "/" ? "active" : ""}`}
              onClick={() => go("/")}
            >
              Головна
            </button>

            <button
              className={`nav-link ${pathname === "/catalog" ? "active" : ""}`}
              onClick={() => go("/catalog")}
            >
              Каталог
            </button>

            <button
              className={`nav-link ${pathname === "/about" ? "active" : ""}`}
              onClick={() => go("/about")}
            >
              Про нас
            </button>

            {user && (
              <>
                <button
                  className={`nav-link ${pathname === "/reading-list" ? "active" : ""}`}
                  onClick={() => go("/reading-list")}
                >
                  Список читання
                </button>

                <button
                  className={`nav-link ${pathname === "/orders" ? "active" : ""}`}
                  onClick={() => go("/orders")}
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
              <button className="btn btn-primary" onClick={() => go("/auth")}>
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
