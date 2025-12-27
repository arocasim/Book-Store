import React, { useMemo } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import type { Book } from "../types";

interface CartPageProps {
  onNavigate: (page: string) => void;
}

type Offer = {
  id: string;
  title: string;
  description: string;
  bookIds: number[];
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  active?: boolean;
};

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    cart,
    books,
    offers,
    offersLoading,
    removeFromCart,
    updateCartQuantity,
  } = useAppContext();

  const booksById = useMemo(() => {
    const map = new Map<number, Book>();
    for (const b of books) map.set(Number(b.id), b);
    return map;
  }, [books]);

  const cartItems = useMemo(() => {
    return cart
      .map((item) => {
        const book = booksById.get(item.bookId);
        return { ...item, book };
      })
      .filter((x) => Boolean(x.book));
  }, [cart, booksById]);

  const rawTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0);
  }, [cartItems]);

  const bundleCalc = useMemo(() => {
    if (offersLoading || !offers || offers.length === 0) {
      return {
        totalWithBundles: rawTotal,
        bundlesApplied: [] as Array<{ offerId: string; title: string; times: number; saved: number }>,
        savedTotal: 0,
      };
    }

    const qty = new Map<number, number>();
    for (const item of cart) qty.set(item.bookId, (qty.get(item.bookId) || 0) + item.quantity);

    const activeOffers: Offer[] = offers
      .filter((o: any) => o && (o.active === undefined || o.active === true))
      .map((o: any) => ({
        id: String(o.id),
        title: String(o.title ?? ""),
        description: String(o.description ?? ""),
        bookIds: Array.isArray(o.bookIds) ? o.bookIds.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n)) : [],
        originalPrice: Number(o.originalPrice ?? 0),
        discountedPrice: Number(o.discountedPrice ?? 0),
        discount: Number(o.discount ?? 0),
        active: Boolean(o.active),
      }))
      .sort((a, b) => (b.discount || 0) - (a.discount || 0));

    const bundlesApplied: Array<{ offerId: string; title: string; times: number; saved: number }> = [];
    let sum = 0;
    let savedTotal = 0;

    for (const offer of activeOffers) {
      if (!offer.bookIds || offer.bookIds.length === 0) continue;

      let times = Infinity;
      for (const id of offer.bookIds) {
        const q = qty.get(id) || 0;
        times = Math.min(times, q);
      }

      if (!Number.isFinite(times) || times <= 0) continue;

      const oneBundleRaw = offer.bookIds.reduce((acc, id) => {
        const book = booksById.get(id);
        return acc + (book?.price || 0);
      }, 0);

      const savedPerBundle = Math.max(0, oneBundleRaw - offer.discountedPrice);

      sum += offer.discountedPrice * times;
      savedTotal += savedPerBundle * times;

      bundlesApplied.push({
        offerId: offer.id,
        title: offer.title,
        times,
        saved: savedPerBundle * times,
      });

      for (const id of offer.bookIds) {
        qty.set(id, (qty.get(id) || 0) - times);
      }
    }

    for (const [bookId, q] of qty.entries()) {
      if (q <= 0) continue;
      const book = booksById.get(bookId);
      sum += (book?.price || 0) * q;
    }

    return {
      totalWithBundles: sum,
      bundlesApplied,
      savedTotal,
    };
  }, [offersLoading, offers, cart, booksById, rawTotal]);

  const total = bundleCalc.totalWithBundles;

  if (cart.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <h1>Кошик</h1>
          <div className="empty-state">
            <p>Ваш кошик порожній</p>
            <button className="btn btn-primary" onClick={() => onNavigate("catalog")}>
              Перейти до каталогу
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Кошик</h1>

        <div className="cart-content-vertical">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.bookId} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.book!.image} alt={item.book!.title} className="w-full h-auto" />
                </div>

                <div className="cart-item-details">
                  <h3>{item.book!.title}</h3>
                  <p>{item.book!.author}</p>
                </div>

                <div className="cart-item-quantity">
                  <button
                    className="icon-button"
                    onClick={() => updateCartQuantity(item.bookId, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="icon-button"
                    onClick={() => updateCartQuantity(item.bookId, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="cart-item-price">{item.book!.price * item.quantity} ₴</div>

                <button className="icon-button delete-button" onClick={() => removeFromCart(item.bookId)}>
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary-bottom">
            <div className="cart-summary-content">
              <h2>Разом</h2>

              <div className="cart-summary-row">
                <span>Товари ({cart.reduce((sum, item) => sum + item.quantity, 0)}):</span>
                <span>{rawTotal} ₴</span>
              </div>

              {/* ✅ якщо застосувалися набори — покажемо економію */}
              {bundleCalc.savedTotal > 0 && (
                <div className="cart-summary-row" style={{ color: "var(--success-color)" }}>
                  <span>Знижка (набори):</span>
                  <span>-{bundleCalc.savedTotal} ₴</span>
                </div>
              )}

              <div className="cart-summary-row">
                <span>Доставка:</span>
                <span>Безкоштовно</span>
              </div>

              <div className="cart-summary-total">
                <span>Всього:</span>
                <span>{total} ₴</span>
              </div>

              <button className="btn btn-primary btn-large btn-full" onClick={() => onNavigate("checkout")}>
                Оформити замовлення
              </button>

              {}
              {bundleCalc.bundlesApplied.length > 0 && (
                <div style={{ marginTop: 12, opacity: 0.85, fontSize: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Застосовано набори:</div>
                  {bundleCalc.bundlesApplied.map((b) => (
                    <div key={b.offerId}>
                      • {b.title} × {b.times} (економія {b.saved} ₴)
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
