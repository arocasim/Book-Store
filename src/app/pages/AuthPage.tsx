import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { login, register, googleLogin } = useAppContext();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(formData.email, formData.password);
        if (success) onNavigate("home");
        else setError("Невірний email або пароль");
      } else {
        if (formData.name.length < 2) return setError("Ім'я повинно містити принаймні 2 символи");
        if (formData.password.length < 6) return setError("Пароль повинен містити принаймні 6 символів");

        const success = await register(formData.name, formData.email, formData.password);
        if (success) onNavigate("home");
        else setError("Не вдалося зареєструватися (можливо email вже використовується)");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const success = await googleLogin();
      if (success) onNavigate("home");
      else setError("Не вдалося увійти через Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? "active" : ""}`}
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              disabled={loading}
            >
              Увійти
            </button>
            <button
              className={`auth-tab ${!isLogin ? "active" : ""}`}
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              disabled={loading}
            >
              Реєстрація
            </button>
          </div>

          <div className="auth-card">
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="form-group">
                  <label>Ім'я</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Пароль</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="btn btn-primary btn-large btn-full" disabled={loading}>
                {loading ? "Зачекайте..." : isLogin ? "Увійти" : "Зареєструватися"}
              </button>
            </form>

            <div className="auth-divider">
              <span>або</span>
            </div>

            <button className="btn btn-google btn-large btn-full" onClick={handleGoogleLogin} disabled={loading}>
              Увійти за допомогою Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
