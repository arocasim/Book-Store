import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface CheckoutPageProps {
  onNavigate: (page: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { cart, books, user, placeOrder } = useAppContext();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  });

  const cartItems = cart.map(item => {
    const book = books.find(b => b.id === item.bookId);
    return { ...item, book };
  }).filter(item => item.book);

  const total = cartItems.reduce((sum, item) => {
    return sum + (item.book?.price || 0) * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user) {
    alert("Для оформлення замовлення необхідно увійти в систему");
    onNavigate("auth");
    return;
  }

  try {
    await placeOrder(cart, total, formData);
    onNavigate("orders");
  } catch (err: any) {
    alert(err?.message || "Помилка оформлення замовлення");
  }
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (cart.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <h1>Оформлення замовлення</h1>
          <div className="empty-state">
            <p>Ваш кошик порожній</p>
            <button className="btn btn-primary" onClick={() => onNavigate('catalog')}>
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
        <h1>Оформлення замовлення</h1>

        <div className="checkout-content">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <section className="form-section">
              <h2>Контактна інформація</h2>
              <div className="form-group">
                <label>Ім'я *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Телефон *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </section>

            <section className="form-section">
              <h2>Адреса доставки</h2>
              <div className="form-group">
                <label>Місто *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Адреса *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Поштовий індекс *</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </section>

            <section className="form-section">
              <h2>Коментар до замовлення</h2>
              <div className="form-group">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Додаткові побажання..."
                  rows={4}
                />
              </div>
            </section>

            <button type="submit" className="btn btn-primary btn-large">
              Підтвердити замовлення
            </button>
          </form>

          <div className="checkout-summary">
            <h2>Ваше замовлення</h2>
            <div className="order-items">
              {cartItems.map(item => (
                <div key={item.bookId} className="order-item">
                  <span>{item.book!.title} x {item.quantity}</span>
                  <span>{item.book!.price * item.quantity} ₴</span>
                </div>
              ))}
            </div>
            <div className="order-summary">
              <div className="order-summary-row">
                <span>Товари:</span>
                <span>{total} ₴</span>
              </div>
              <div className="order-summary-row">
                <span>Доставка:</span>
                <span>Безкоштовно</span>
              </div>
              <div className="order-summary-total">
                <span>Всього:</span>
                <span>{total} ₴</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
