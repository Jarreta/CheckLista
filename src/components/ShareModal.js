import React, { useState } from "react";
import { shareList } from "../services/listService";
import Modal from "react-modal";
import "../styles.css";

Modal.setAppElement("#root");

const ShareModal = ({ isOpen, onRequestClose, ownerId, listId }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const resetForm = () => {
    setEmail("");
    setLoading(false);
    setError(null);
    setSuccess(null);
  };

  const handleShare = async (e) => {
    e.preventDefault();

    // Validação simples
    if (!email.includes("@")) {
      setError("Por favor, insira um email válido");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Tentando compartilhar a lista...");
      await shareList(ownerId, listId, email);
      console.log("Lista compartilhada com sucesso!");
      setSuccess(`Lista compartilhada com ${email}!`);
      setTimeout(() => {
        resetForm();
        onRequestClose();
      }, 2000);
    } catch (error) {
      console.error("Erro detalhado:", error);
      setError(error.message || "Erro ao compartilhar a lista");
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        resetForm();
        onRequestClose();
      }}
      className="share-modal"
      overlayClassName="share-overlay"
    >
      <div className="modal-content">
        <h2>Compartilhar Lista</h2>

        {error && (
          <div className="alert error">
            <span>⚠️</span> {error}
          </div>
        )}

        {success ? (
          <div className="alert success">
            <span>✓</span> {success}
          </div>
        ) : (
          <form onSubmit={handleShare}>
            <div className="input-group">
              <label>Email do destinatário:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="modal-buttons">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onRequestClose();
                }}
                className="secondary-btn"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={loading || !email.includes("@")}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Compartilhando...
                  </>
                ) : (
                  "Compartilhar"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
