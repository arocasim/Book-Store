import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, user, books } = useAppContext();

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <h1>Історія покупок</h1>
          <div className="empty-state">
            <p>Для перегляду історії покупок необхідно увійти в систему</p>
            <button className="btn btn-primary" onClick={() => navigate('/auth')}>
              Увійти
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userOrders = orders.filter(order => order.userId === user.id);

  if (userOrders.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <h1>Історія покупок</h1>
          <div className="empty-state">
            <p>У вас ще немає покупок</p>
            <button className="btn btn-primary" onClick={() => navigate('/catalog')}>
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
        <h1>Історія покупок</h1>

        <div className="orders-list">
          {[...userOrders].reverse().map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Замовлення #{order.id}</h3>
                  <p className="order-date">
                    {new Date(order.date).toLocaleDateString('uk-UA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="order-status">{order.status}</div>
              </div>

              <div className="order-items">
                {order.items.map(item => {
                  const book = books.find(b => b.id === item.bookId);
                  return book ? (
                    <div key={item.bookId} className="order-item">
                      <span>{book.title}</span>
                      <span>x {item.quantity}</span>
                      <span>{book.price * item.quantity} ₴</span>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="order-total">
                <span>Всього:</span>
                <span>{order.total} ₴</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
