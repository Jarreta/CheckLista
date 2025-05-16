import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Cookies from "js-cookie";
import minhaImagem from "../img/Checklista.png"; // Suba um nível para acessar a pasta img

export default function Auth({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedEmail = Cookies.get("userEmail");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        Cookies.set("userEmail", email, { expires: 7 });
        setUser(data.user);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        alert("Conta criada! Verifique seu email para confirmar.");
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      alert("Insira seu email para redefinir a senha.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      alert(error.message);
    } else {
      alert("Email de redefinição enviado!");
    }
  };

  return (
    <div className="auth-card">
      <img
        src={minhaImagem} // Usando a importação
        alt="CheckLista" // Texto alternativo para acessibilidade
        className="auth-title-image" // Classe para estilização, se necessário
      />
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleAuth}>
        <div className="input-container">
          <input
            className="input-field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div className="input-container">
          <input
            className="input-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            required
          />
        </div>
        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
        </button>
      </form>
      <button
        className="outline-btn"
        onClick={() => setIsLogin(!isLogin)}
        disabled={loading}
      >
        {isLogin ? "Criar nova conta" : "Já tenho conta"}
      </button>
      {isLogin && email && (
        <button className="outline-btn" onClick={handlePasswordReset}>
          Esqueceu a Senha?
        </button>
      )}
    </div>
  );
}
