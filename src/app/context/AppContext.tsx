import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

import { User, CartItem, Order, Book } from "../types";
import { auth, db } from "../firebase";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  bookIds: number[];
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  active?: boolean;
  createdAt?: any;
}

interface AppContextType {
  user: User | null;
  authLoading: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  googleLogin: () => Promise<boolean>;
  logout: () => Promise<void>;

  cart: CartItem[];
  addToCart: (bookId: number) => Promise<void>;
  addBundleToCart: (bookIds: number[]) => Promise<void>;
  removeFromCart: (bookId: number) => Promise<void>;
  updateCartQuantity: (bookId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;

  readingList: number[];
  addToReadingList: (bookId: number) => Promise<void>;
  removeFromReadingList: (bookId: number) => Promise<void>;

  orders: Order[];
  placeOrder: (items: CartItem[], total: number, customer: any) => Promise<void>;

  theme: "light" | "dark";
  toggleTheme: () => void;

  books: Book[];
  booksLoading: boolean;

  offers: SpecialOffer[];
  offersLoading: boolean;

  addReview: (bookId: number, rating: number, comment: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};

interface AppProviderProps {
  children: ReactNode;
}

const firebaseUserToLocalUser = (fbUser: any): User => ({
  id: fbUser.uid,
  name: fbUser.displayName || "Користувач",
  email: fbUser.email || "",
});

const readLocalCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem("cart");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalCart = (cart: CartItem[]) => {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch {}
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);

  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [readingList, setReadingList] = useState<number[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const getIdToken = async () => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not authenticated");
    return await u.getIdToken();
  };

  const refreshOrders = async () => {
    if (!user) return;

    const token = await getIdToken();
    const res = await fetch("https://book-store1-h2ux.onrender.com/api/orders", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося завантажити замовлення");

    const loaded: Order[] = Array.isArray(data?.orders)
      ? data.orders.map((o: any) => ({
          id: String(o.id),
          userId: user.id,
          items: Array.isArray(o.items) ? o.items : [],
          total: Number(o.total ?? 0),
          date: String(o.dateIso ?? o.date ?? new Date().toISOString()),
          status: String(o.status ?? "Підтверджено"),
          customer: o.customer,
        }))
      : [];

    setOrders(loaded);
  };

  const refreshCart = async () => {
    if (!user) return;

    const token = await getIdToken();
    const res = await fetch("https://book-store1-h2ux.onrender.com/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося завантажити кошик");

    setCart(Array.isArray(data?.cart) ? data.cart : []);
  };

  const refreshReadingList = async () => {
    if (!user) return;

    const token = await getIdToken();
    const res = await fetch("https://book-store1-h2ux.onrender.com/api/reading-list", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося завантажити список читання");

    const list = Array.isArray(data?.readingList) ? data.readingList : [];
    const normalized = list
      .map((x: any) => Number(x))
      .filter((n: number) => Number.isFinite(n));

    setReadingList(normalized);
  };

  useEffect(() => {
    setCart(readLocalCart());
  }, []);

  useEffect(() => {
    if (!user) saveLocalCart(cart);
  }, [cart, user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setBooksLoading(true);
        const res = await fetch("https://book-store1-h2ux.onrender.com/api/books");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Не вдалося завантажити книги");
        if (!cancelled) setBooks(Array.isArray(data?.books) ? data.books : []);
      } catch (e) {
        console.error("books fetch error:", e);
        if (!cancelled) setBooks([]);
      } finally {
        if (!cancelled) setBooksLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setOffersLoading(true);
        const res = await fetch("https://book-store1-h2ux.onrender.com/api/offers");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Не вдалося завантажити набори");
        if (!cancelled) setOffers(Array.isArray(data?.offers) ? data.offers : []);
      } catch (e) {
        console.error("offers fetch error:", e);
        if (!cancelled) setOffers([]);
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setReadingList([]);
        setOrders([]);
        setTheme("light");
        setCart(readLocalCart());
        setAuthLoading(false);
        return;
      }

      const localUser = firebaseUserToLocalUser(fbUser);
      setUser(localUser);

      const uref = doc(db, "users", fbUser.uid);
      const snap = await getDoc(uref);

      const guestCart = readLocalCart();

      if (!snap.exists()) {
        await setDoc(uref, {
          name: localUser.name,
          email: localUser.email,
          readingList: [],
          theme: "light",
          createdAt: serverTimestamp(),
        });

        setTheme("light");
      } else {
        const data = snap.data() as any;
        if (data.theme === "dark" || data.theme === "light") setTheme(data.theme);
      }

      if (guestCart.length > 0) {
        try {
          const token = await fbUser.getIdToken();
          await fetch("https://book-store1-h2ux.onrender.com/api/cart", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ cart: guestCart }),
          });
          saveLocalCart([]);
        } catch (e) {
          console.error("merge guest cart to server error:", e);
        }
      }

      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        await Promise.all([refreshCart(), refreshReadingList(), refreshOrders()]);
      } catch (e) {
        console.error("post-login refresh error:", e);
        if (!cancelled) {
          setCart([]);
          setReadingList([]);
          setOrders([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      return true;
    } catch {
      return false;
    }
  };

  const googleLogin = async (): Promise<boolean> => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addToCart = async (bookId: number) => {
      if (!user) throw new Error("Спочатку увійдіть або зареєструйтесь, щоб додавати в кошик.");
    if (!user) {
      const existing = cart.find((i) => i.bookId === bookId);
      const next = existing
        ? cart.map((i) => (i.bookId === bookId ? { ...i, quantity: i.quantity + 1 } : i))
        : [...cart, { bookId, quantity: 1 }];
      setCart(next);
      return;
    }

    const token = await getIdToken();
    const res = await fetch("https://book-store1-h2ux.onrender.com/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося додати в кошик");

    setCart(Array.isArray(data?.cart) ? data.cart : []);
  };

  const addBundleToCart = async (bookIds: number[]) => {
      if (!user) throw new Error("Спочатку увійдіть або зареєструйтесь, щоб додавати в кошик.");
    const next = cart.map((x) => ({ ...x }));
    for (const bookId of bookIds) {
      const existing = next.find((i) => i.bookId === bookId);
      if (existing) existing.quantity += 1;
      else next.push({ bookId, quantity: 1 });
    }

    if (!user) {
      setCart(next);
      return;
    }

    const token = await getIdToken();
    const res = await fetch("https://book-store1-h2ux.onrender.com/api/cart", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cart: next }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося додати набір");

    setCart(Array.isArray(data?.cart) ? data.cart : next);
  };

  const removeFromCart = async (bookId: number) => {
      if (!user) throw new Error("Спочатку увійдіть або зареєструйтесь, щоб додавати в кошик.");
    const next = cart.filter((i) => i.bookId !== bookId);

    if (!user) {
      setCart(next);
      return;
    }

    const token = await getIdToken();
    const res = await fetch(`https://book-store1-h2ux.onrender.com/api/cart/item/${bookId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося прибрати з кошика");

    setCart(Array.isArray(data?.cart) ? data.cart : []);
  };

  const updateCartQuantity = async (bookId: number, quantity: number) => {
    const next =
      quantity <= 0
        ? cart.filter((i) => i.bookId !== bookId)
        : cart.map((i) => (i.bookId === bookId ? { ...i, quantity } : i));

    if (!user) {
      setCart(next);
      return;
    }

    const token = await getIdToken();
    const res = await fetch("https://book-store1-h2ux.onrender.com/api/cart/item", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId, quantity }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося оновити кількість");

    setCart(Array.isArray(data?.cart) ? data.cart : next);
  };

  const clearCart = async () => {
    if (!user) {
      setCart([]);
      return;
    }

    const token = await getIdToken();
    const res = await fetch("https://book-store1-h2ux.onrender.com/api/cart", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося очистити кошик");

    setCart([]);
  };

  const addToReadingList = async (bookId: number) => {
    if (!user) return;
    if (readingList.includes(bookId)) return;

    const token = await getIdToken();
    const res = await fetch("https://book-store1-h2ux.onrender.com/api/reading-list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося додати у список читання");

    setReadingList((prev) => (prev.includes(bookId) ? prev : [...prev, bookId]));
  };

  const removeFromReadingList = async (bookId: number) => {
    if (!user) return;

    const token = await getIdToken();
    const res = await fetch(`https://book-store1-h2ux.onrender.com/api/reading-list/${bookId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося видалити зі списку читання");

    setReadingList((prev) => prev.filter((id) => id !== bookId));
  };

  const placeOrder = async (items: CartItem[], total: number, customer: any) => {
    if (!user) return;

    const token = await getIdToken();
    const res = await fetch("https://book-store1-h2ux.onrender.com/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items, total, customer }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Не вдалося оформити замовлення");
    }

    await clearCart();
    await refreshOrders();
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (user) updateDoc(doc(db, "users", user.id), { theme: next }).catch(() => {});
  };

  const addReview = async (bookId: number, rating: number, comment: string) => {
    if (!user) throw new Error("Not authenticated");

    const token = await getIdToken();
    const res = await fetch(`https://book-store1-h2ux.onrender.com/api/books/${bookId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating,
        comment,
        userName: user.name,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Не вдалося додати відгук");

    setBooks((prev) =>
      prev.map((b: any) => {
        if (Number(b.id) !== Number(bookId)) return b;

        const nextReviews = Array.isArray(b.reviews)
          ? [...b.reviews, data.review]
          : [data.review];

        return {
          ...b,
          reviews: nextReviews,
          rating: Number(data.rating ?? b.rating ?? 0),
        };
      })
    );
  };

  const value = useMemo(
    () => ({
      user,
      authLoading,

      login,
      register,
      googleLogin,
      logout,

      cart,
      addToCart,
      addBundleToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,

      readingList,
      addToReadingList,
      removeFromReadingList,

      orders,
      placeOrder,

      theme,
      toggleTheme,

      books,
      booksLoading,

      offers,
      offersLoading,

      addReview,
    }),
    [user, authLoading, cart, readingList, orders, theme, books, booksLoading, offers, offersLoading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
