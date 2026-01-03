import React, { useEffect, useMemo, useState } from "react";
import { Gift, ShoppingCart } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import type { Book } from "../types";

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  bookIds: number[];
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  active?: boolean;
}

interface SpecialOffersProps {
  onNavigate: (page: string, bookId?: number) => void;
}

export const SpecialOffers: React.FC<SpecialOffersProps> = ({ onNavigate }) => {
  const { user, books, addBundleToCart } = useAppContext();

  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const res = await fetch("https://book-store1-h2ux.onrender.com/api/offers");
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.error || "Не вдалося завантажити набори");

        const loaded: SpecialOffer[] = Array.isArray(data?.offers) ? data.offers : [];
        if (!cancelled) setOffers(loaded);
      } catch (err) {
        console.error("offers fetch error:", err);
        if (!cancelled) setOffers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const booksById = useMemo(() => {
    const map = new Map<number, Book>();
    for (const b of books) map.set(Number((b as any).id), b);
    return map;
  }, [books]);

  const requireLogin = () => {
    alert("Щоб додавати набори в кошик, спочатку увійдіть або зареєструйтесь.");
    onNavigate("auth");
  };

  const handleAddBundle = async (offer: SpecialOffer) => {
    if (!user) return requireLogin();

    try {
      await addBundleToCart(offer.bookIds);
      onNavigate("cart");
    } catch (err: any) {
      alert(err?.message || "Не вдалося додати набір до кошика");
    }
  };

  if (loading) {
    return (
      <section className="section">
        <div className="section-header">
          <Gift size={24} />
          <h2>Спеціальні пропозиції - Набори книг</h2>
        </div>
        <p style={{ opacity: 0.8 }}>Завантаження пропозицій…</p>
      </section>
    );
  }

  if (offers.length === 0) {
    return (
      <section className="section">
        <div className="section-header">
          <Gift size={24} />
          <h2>Спеціальні пропозиції - Набори книг</h2>
        </div>
        <p style={{ opacity: 0.8 }}>Наразі немає активних наборів.</p>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-header">
        <Gift size={24} />
        <h2>Спеціальні пропозиції - Набори книг</h2>
      </div>

      <div className="special-offers-grid">
        {offers.map((offer) => {
          const offerBooks: Book[] = (offer.bookIds || [])
            .map((id) => booksById.get(id))
            .filter((b): b is Book => Boolean(b));

          const savings = Math.max(0, Number(offer.originalPrice || 0) - Number(offer.discountedPrice || 0));

          return (
            <div key={offer.id} className="special-offer-card">
              <div className="special-offer-badge">-{offer.discount}%</div>

              <div className="special-offer-images">
                {offerBooks.map((book, index) => (
                  <div
                    key={book.id}
                    className="special-offer-book-image"
                    style={{ zIndex: offerBooks.length - index }}
                  >
                    <img src={book.image} alt={book.title} className="w-full h-auto" />
                  </div>
                ))}
              </div>

              <div className="special-offer-content">
                <h3>{offer.title}</h3>
                <p className="special-offer-description">{offer.description}</p>

                <div className="special-offer-books-list">
                  {offerBooks.map((book, index) => (
                    <div
                      key={book.id}
                      className="special-offer-book-item"
                      onClick={() => onNavigate("book", book.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="book-number">{index + 1}.</span>
                      <span className="book-info">
                        <strong>{book.title}</strong>
                        <span className="book-author-small">{book.author}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="special-offer-price">
                  <div className="price-group">
                    <span className="original-price">{offer.originalPrice} ₴</span>
                    <span className="price large">{offer.discountedPrice} ₴</span>
                  </div>
                  <div className="savings">Економія: {savings} ₴</div>
                </div>

                <button
                  className="btn btn-primary btn-large btn-full"
                  onClick={() => handleAddBundle(offer)}
                  disabled={offerBooks.length === 0}
                  title={offerBooks.length === 0 ? "Книги набору не знайдені" : user ? "" : "Увійдіть, щоб додати набір"}
                >
                  <ShoppingCart size={20} />
                  Додати набір до кошика
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
