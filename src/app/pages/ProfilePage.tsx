import React from 'react';
import { User, Mail, LogOut, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  theme: string;
  toggleTheme: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, theme, toggleTheme }) => {
  const { user, logout, orders } = useAppContext();

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <h1>Профіль</h1>
          <div className="empty-state">
            <p>Для перегляду профілю необхідно увійти в систему</p>
            <button className="btn btn-primary" onClick={() => onNavigate('auth')}>
              Увійти
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const userOrders = orders.filter(order => order.userId === user.id);
  const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="page">
      <div className="container">
        <h1>Профіль користувача</h1>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar">
              <User size={48} />
            </div>

            <div className="profile-info">
              <div className="profile-info-item">
                <User size={20} />
                <div>
                  <span className="label">Ім'я</span>
                  <span className="value">{user.name}</span>
                </div>
              </div>

              <div className="profile-info-item">
                <Mail size={20} />
                <div>
                  <span className="label">Email</span>
                  <span className="value">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="profile-theme-toggle">
              <span className="theme-label">Тема оформлення</span>
              <button className="btn btn-secondary btn-full" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                {theme === 'dark' ? 'Світла тема' : 'Темна тема'}
              </button>
            </div>

            <button className="btn btn-outline btn-full" onClick={handleLogout}>
              <LogOut size={20} />
              Вийти
            </button>
          </div>

          <div className="profile-stats">
            <h2>Статистика</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{userOrders.length}</span>
                <span className="stat-label">Замовлень</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{totalSpent} ₴</span>
                <span className="stat-label">Загальна сума</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('orders')}
            >
              Історія покупок
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('reading-list')}
            >
              Список для читання
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};