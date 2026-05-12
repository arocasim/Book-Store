import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Gift, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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

export const SpecialOffers: React.FC = () => {
  const { user, books, addBundleToCart } = useAppContext();
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);

  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [perView, setPerView] = useState(window.innerWidth > 768 ? 2 : 1);

  const dragStart = useRef(0);
  const dragCurrent = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const onResize = () => setPerView(window.innerWidth > 768 ? 2 : 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    toast.warning("Щоб додавати набори в кошик, спочатку увійдіть або зареєструйтесь.");
    navigate("/auth");
  };

  const handleAddBundle = async (offer: SpecialOffer) => {
    if (!user) return requireLogin();

    try {
      await addBundleToCart(offer.bookIds);
      toast.success(`Набір «${offer.title}» додано до кошика`, {
        action: {
          label: "Перейти до кошика",
          onClick: () => navigate("/cart"),
        },
      });
    } catch (err: any) {
      toast.error(err?.message || "Не вдалося додати набір до кошика");
    }
  };

  const maxIndex = Math.max(0, offers.length - perView);
  const slideWidth = 100 / perView;

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, maxIndex));
      setCurrent(clamped);
      setDragOffset(0);
    },
    [maxIndex]
  );

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = e.clientX;
    dragCurrent.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    dragCurrent.current = e.clientX;
    setDragOffset(dragCurrent.current - dragStart.current);
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragging(false);

    const delta = dragCurrent.current - dragStart.current;
    const threshold = 60;

    if (delta < -threshold) {
      goTo(current + 1);
    } else if (delta > threshold) {
      goTo(current - 1);
    } else {
      setDragOffset(0);
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

      <div className="offers-carousel">
        <button
          className="offers-carousel-arrow offers-carousel-arrow--left"
          onClick={prev}
          disabled={current === 0}
          aria-label="Назад"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="offers-carousel-viewport">
          <div
            ref={trackRef}
            className="offers-carousel-track"
            style={{
              transform: `translateX(calc(-${current * slideWidth}% + ${dragging ? dragOffset : 0}px))`,
              transition: dragging ? "none" : "transform 0.4s cubic-bezier(.4,0,.2,1)",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {offers.map((offer) => {
              const offerBooks: Book[] = (offer.bookIds || [])
                .map((id) => booksById.get(id))
                .filter((b): b is Book => Boolean(b));

              const savings = Math.max(0, Number(offer.originalPrice || 0) - Number(offer.discountedPrice || 0));

              return (
                <div key={offer.id} className="offers-carousel-slide">
                  <div className="offers-slide-card">
                    <div className="offers-slide-images">
                      <div className="special-offer-badge">-{offer.discount}%</div>
                      {offerBooks.map((book, index) => (
                        <div
                          key={book.id}
                          className="special-offer-book-image"
                          style={{ zIndex: offerBooks.length - index }}
                          onClick={() => navigate(`/book/${book.id}`)}
                        >
                          <img src={book.image} alt={book.title} draggable={false} />
                        </div>
                      ))}
                    </div>

                    <div className="offers-slide-body">
                      <h3 className="offers-slide-title">{offer.title}</h3>
                      <p className="offers-slide-desc">{offer.description}</p>

                      <div className="special-offer-books-list">
                        {offerBooks.map((book) => (
                          <span
                            key={book.id}
                            className="special-offer-book-tag"
                            onClick={() => navigate(`/book/${book.id}`)}
                          >
                            {book.title}
                          </span>
                        ))}
                      </div>

                      <div className="offers-slide-price">
                        <span className="original-price">{offer.originalPrice} ₴</span>
                        <span className="price large">{offer.discountedPrice} ₴</span>
                        <span className="savings">−{savings} ₴</span>
                      </div>

                      <button
                        className="btn btn-primary btn-full"
                        onClick={() => handleAddBundle(offer)}
                        disabled={offerBooks.length === 0}
                      >
                        <ShoppingCart size={18} />
                        Додати набір
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          className="offers-carousel-arrow offers-carousel-arrow--right"
          onClick={next}
          disabled={current >= maxIndex}
          aria-label="Вперед"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {offers.length > 1 && (
        <div className="offers-carousel-dots">
          {offers.map((_, i) => (
            <button
              key={i}
              className={`offers-carousel-dot${i === current ? " active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Пропозиція ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
