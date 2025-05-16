import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./components/Auth";
import ListManager from "./ListManager";
import "./styles.css";
import minhaImagem from "./img/Checklista.png"; // Suba um nível para acessar a pasta img

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingAuth) return <div className="loading-state">Carregando...</div>;

  if (!user) return <Auth setUser={setUser} />;

  return (
    <div className="app">
      <header className="main-header">
        <img
          src={minhaImagem} // Usando a importação
          alt="CheckLista" // Texto alternativo para acessibilidade
          className="auth-title-image" // Classe para estilização, se necessário
        />
        <button className="logout-btn" onClick={handleLogout}>
          Sair
        </button>
      </header>
      <div className="content">
        <ListManager user={user} />
      </div>
    </div>
  );
}
