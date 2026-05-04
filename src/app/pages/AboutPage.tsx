import React from 'react';
import { BookOpen, Users, Heart, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="container">
        <h1>Про нас</h1>

        <section className="about-section">
          <div className="about-hero">
            <h2>Книжковий Світ - Ваш надійний партнер у світі літератури</h2>
            <p>
              Ми - онлайн книжковий магазин, який спеціалізується на українських книгах.
              Наша місія - зробити українську літературу доступною для кожного читача.
            </p>
          </div>
        </section>

        <section className="about-features">
          <div className="feature-card">
            <div className="feature-icon">
              <BookOpen size={40} />
            </div>
            <h3>Великий вибір</h3>
            <p>Тисячі книг різних жанрів та напрямків. Класична та сучасна література українською мовою.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Award size={40} />
            </div>
            <h3>Якість гарантована</h3>
            <p>Ми працюємо лише з перевіреними видавництвами та пропонуємо тільки оригінальні видання.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Heart size={40} />
            </div>
            <h3>З любов'ю до книг</h3>
            <p>Кожна книга відбирається з особливою увагою та любов'ю до літератури.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Users size={40} />
            </div>
            <h3>Турбота про клієнтів</h3>
            <p>Швидка доставка, зручна оплата та професійна підтримка клієнтів.</p>
          </div>
        </section>

        <section className="about-values">
          <h2>Наші цінності</h2>
          <div className="values-grid">
            <div className="value-item">
              <h3>Підтримка української культури</h3>
              <p>Ми віримо в силу української літератури та її важливість для розвитку нашого суспільства.</p>
            </div>
            <div className="value-item">
              <h3>Доступність</h3>
              <p>Книги повинні бути доступними для всіх. Ми пропонуємо конкурентні ціни та регулярні акції.</p>
            </div>
            <div className="value-item">
              <h3>Якість сервісу</h3>
              <p>Ми прагнемо забезпечити найкращий сервіс для наших клієнтів на кожному етапі покупки.</p>
            </div>
          </div>
        </section>

        <section className="about-cta">
          <h2>Почніть свою подорож у світ книг</h2>
          <p>Приєднуйтесь до тисяч задоволених читачів, які обрали наш магазин</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/catalog')}>
            Переглянути каталог
          </button>
        </section>
      </div>
    </div>
  );
};
