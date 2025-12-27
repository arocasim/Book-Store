import React from 'react';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <BookOpen size={28} />
              <span>Книжковий Світ</span>
            </div>
            <p>Ваш надійний книжковий магазин з найкращою літературою українською мовою.</p>
          </div>

          <div className="footer-section">
            <h4>Контакти</h4>
            <div className="footer-contact">
              <Phone size={16} />
              <span>+380 63 141 31 11</span>
            </div>
            <div className="footer-contact">
              <Mail size={16} />
              <span>info@bookworld.ua</span>
            </div>
            <div className="footer-contact">
              <MapPin size={16} />
              <span>Львів, вул. Городоцька, 45</span>
            </div>
          </div>

          <div className="footer-section">
            <h4>Інформація</h4>
            <ul className="footer-links">
              <li>Умови доставки</li>
              <li>Оплата</li>
              <li>Повернення товару</li>
              <li>Політика конфіденційності</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Книжковий Світ. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  );
};
