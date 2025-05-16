// src/ListManager.js

import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import {
  FaRegTimesCircle,
  FaShare,
  FaTimes,
  FaTimesCircle,
  FaUserTimes,
} from "react-icons/fa";
import ShareModal from "./components/ShareModal";
import "./styles.css";
import { unshareListReceived } from "./services/listService";
import { removeSharedUserByOwner } from "./services/listService";
import { FaChevronDown } from "react-icons/fa";

const ListManager = ({ user }) => {
  const [lists, setLists] = useState([]);
  const [sharedLists, setSharedLists] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentListId, setCurrentListId] = useState(null);
  const [showListCreator, setShowListCreator] = useState(false);
  const [listName, setListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [activeInputs, setActiveInputs] = useState({});
  const [openSharedUsers, setOpenSharedUsers] = useState({});
  const [openSharedWithMe, setOpenSharedWithMe] = useState({});

  useEffect(() => {
    fetchLists();
    fetchSharedLists();
  }, [user]);

  // Função correta para buscar listas próprias e compartilhadas diretamente da tabela lists
  const fetchLists = async () => {
    const { data, error } = await supabase
      .from("lists")
      .select(
        `
      id,
      name,
      created_at,
      items(*),
      owner_id,
      shared_lists!left(shared_with, shared_with_email:profiles(email))
    `
      )
      .eq("owner_id", user.id);

    if (error) {
      console.error("Erro ao buscar listas próprias:", error);
    } else {
      setLists(data);
    }
  };

  const fetchSharedLists = async () => {
    const { data, error } = await supabase
      .from("shared_lists")
      .select(
        `
        list_id,
        lists (
          id,
          name,
          items(*),
          owner:profiles!lists_owner_id_fkey(email)

        )
      `
      )
      .eq("shared_with", user.id);

    if (error) {
      console.error("Erro ao buscar listas compartilhadas:", error);
    } else {
      const sharedListsData = data.map((item) => ({
        id: item.lists.id,
        name: item.lists.name,
        items: item.lists.items,
        ownerEmail: item.lists.owner.email,
      }));
      setSharedLists(sharedListsData);
    }
  };

  const handleUnshare = async (listId) => {
    if (!window.confirm("Deseja realmente remover este compartilhamento?"))
      return;

    try {
      await unshareListReceived(listId, user.id);
      alert("Compartilhamento removido com sucesso!");
      fetchLists();
      fetchSharedLists();
    } catch (error) {
      console.error("Erro ao remover compartilhamento:", error);
      alert("Erro ao remover compartilhamento.");
    }
  };

  const createList = async () => {
    if (!listName.trim()) return;

    await supabase
      .from("lists")
      .insert({ name: listName.trim(), owner_id: user.id });
    setListName("");
    setShowListCreator(false);
    fetchLists();
  };

  // Função para o proprietário remover compartilhamento feito por ele
  const handleRemoveSharedUser = async (listId, userIdToRemove) => {
    if (
      !window.confirm(
        "Deseja realmente remover este usuário do compartilhamento?"
      )
    )
      return;

    try {
      await removeSharedUserByOwner(user.id, listId, userIdToRemove);
      alert("Usuário removido do compartilhamento com sucesso!");
      fetchLists();
      fetchSharedLists();
    } catch (error) {
      console.error("Erro ao remover usuário do compartilhamento:", error);
      alert("Erro ao remover usuário do compartilhamento.");
    }
  };

  const addItem = async (listId) => {
    if (!newItemName.trim()) return;

    await supabase.from("items").insert({
      name: newItemName.trim(),
      list_id: listId,
      added_by: user.id,
    });

    setNewItemName("");
    setActiveInputs({ ...activeInputs, [listId]: false });
    fetchLists();
    fetchSharedLists();
  };

  const toggleItem = async (itemId, checked) => {
    await supabase.from("items").update({ checked: !checked }).eq("id", itemId);
    fetchLists();
    fetchSharedLists();
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Tem certeza que deseja remover este item?")) return;

    await supabase.from("items").delete().eq("id", itemId);
    fetchLists();
    fetchSharedLists();
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm("Tem certeza que deseja deletar esta lista?")) return;

    await supabase.from("items").delete().eq("list_id", listId);
    await supabase.from("shared_lists").delete().eq("list_id", listId);
    await supabase
      .from("lists")
      .delete()
      .eq("id", listId)
      .eq("owner_id", user.id);

    fetchLists();
    fetchSharedLists();
  };

  const handleShareList = (listId) => {
    setCurrentListId(listId);
    setShowShareModal(true);
  };

  const toggleSharedUsers = (listId) => {
    setOpenSharedUsers((prevState) => ({
      ...prevState,
      [listId]: !prevState[listId],
    }));
  };

  const toggleSharedWithMe = (listId) => {
    setOpenSharedWithMe((prevState) => ({
      ...prevState,
      [listId]: !prevState[listId],
    }));
  };

  // Função para descompartilhar (remover compartilhamento recebido)
  const handleUnshareList = async (listId) => {
    if (
      !window.confirm(
        "Deseja realmente remover esta lista compartilhada com você?"
      )
    )
      return;

    try {
      await unshareList(listId, user.id);
      alert("Lista descompartilhada com sucesso!");
      fetchLists();
      fetchSharedLists();
    } catch (error) {
      console.error("Erro ao descompartilhar:", error);
      alert("Erro ao descompartilhar a lista.");
    }
  };

  return (
    <div className="app">
      <div className="list-creator">
        {showListCreator ? (
          <div className="custom-input-row">
            <input
              className="input-field"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Nome da lista"
            />
            <button className="add-btn" onClick={createList}>
              Criar
            </button>
            <button
              className="cancel-btn"
              onClick={() => {
                setShowListCreator(false);
                setListName("");
              }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            className="new-list-btn"
            onClick={() => setShowListCreator(true)}
          >
            + Nova Lista
          </button>
        )}
      </div>

      <h2>Minhas Listas</h2>
      {lists.map((list) => (
        <div key={list.id} className="list-card">
          <div className="list-header">
            <h3 className="list-title">{list.name}</h3>
            <button
              className={`toggle-shared-users-btn ${
                openSharedUsers[list.id] ? "rotated" : ""
              }`}
              onClick={() => toggleSharedUsers(list.id)}
              title="Mostrar usuários compartilhados"
            >
              <FaChevronDown />
            </button>
            <div className="list-actions">
              <button
                onClick={() => handleShareList(list.id)}
                className="share-btn"
              >
                <FaShare />
              </button>
              <button
                onClick={() => handleDeleteList(list.id)}
                className="delete-btn"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Exibir usuários compartilhados e botão para remover */}

          <div
            className={`shared-users ${
              openSharedUsers[list.id] ? "open" : "closed"
            }`}
          >
            <h4>Compartilhado com:</h4>
            <ul className="shared-users-list">
              {list.shared_lists.map((sharedUser) => (
                <li key={sharedUser.shared_with} className="shared-user-item">
                  <button
                    className="unshare-btn"
                    onClick={() =>
                      handleRemoveSharedUser(list.id, sharedUser.shared_with)
                    }
                    title="Remover Compartilhamento"
                  >
                    <FaUserTimes style={{ color: "#FFF" }} />
                  </button>
                  <span className="shared-user-email">
                    {sharedUser.shared_with_email?.email ||
                      sharedUser.shared_with}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="item-list">
            {list.items.map((item) => (
              <li key={item.id} className="item">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id, item.checked)}
                />
                <span className={item.checked ? "checked" : ""}>
                  {item.name}
                </span>
                <span
                  onClick={() => deleteItem(item.id)}
                  className="delete-item-btn"
                >
                  <FaTimes />
                </span>
              </li>
            ))}
          </ul>

          <div className="input-row">
            <input
              className="input-field"
              value={activeInputs[list.id] ? newItemName : ""}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Adicionar item"
              onFocus={() => setActiveInputs({ [list.id]: true })}
              onBlur={() => {
                setTimeout(() => {
                  if (!newItemName.trim()) {
                    setActiveInputs({ [list.id]: false });
                  }
                }, 100);
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && activeInputs[list.id]) {
                  addItem(list.id);
                }
              }}
            />
            {activeInputs[list.id] && (
              <button className="add-btn" onClick={() => addItem(list.id)}>
                +
              </button>
            )}
          </div>
        </div>
      ))}

      <h2>Listas Compartilhadas Comigo</h2>
      {sharedLists.length > 0 ? (
        sharedLists.map((list) => (
          <div key={list.id} className="list-card shared-list">
            <div className="list-header">
              <h3 className="list-title">{list.name}</h3>

              <button
                className={`toggle-shared-users-btn ${
                  openSharedWithMe[list.id] ? "rotated" : ""
                }`}
                onClick={() => toggleSharedWithMe(list.id)}
                title="Mostrar detalhes do compartilhamento"
              >
                <FaChevronDown />
              </button>
            </div>

            <div
              className={`shared-users ${
                openSharedWithMe[list.id] ? "open" : "closed"
              }`}
            >
              <h4>Compartilhado por:</h4>
              <ul className="shared-users-list">
                <li className="shared-user-item">
                  <button
                    className="unshare-btn"
                    onClick={() => handleUnshare(list.id)}
                    title="Remover Compartilhamento"
                  >
                    <FaUserTimes style={{ color: "#FFF" }} />
                  </button>
                  <span className="shared-user-email">{list.ownerEmail}</span>
                </li>
              </ul>
            </div>

            <ul className="item-list">
              {list.items.map((item) => (
                <li key={item.id} className="item">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id, item.checked)}
                  />
                  <span className={item.checked ? "checked" : ""}>
                    {item.name}
                  </span>
                  <span
                    onClick={() => deleteItem(item.id)}
                    className="delete-item-btn"
                  >
                    <FaTimes />
                  </span>
                </li>
              ))}
            </ul>

            <div className="input-row">
              <input
                className="input-field"
                value={activeInputs[list.id] ? newItemName : ""}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Adicionar item"
                onFocus={() => setActiveInputs({ [list.id]: true })}
                onBlur={() => {
                  setTimeout(() => {
                    if (!newItemName.trim()) {
                      setActiveInputs({ [list.id]: false });
                    }
                  }, 100);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && activeInputs[list.id]) {
                    addItem(list.id);
                  }
                }}
              />
              {activeInputs[list.id] && (
                <button className="add-btn" onClick={() => addItem(list.id)}>
                  +
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>Nenhuma lista compartilhada com você.</p>
      )}

      <ShareModal
        isOpen={showShareModal}
        onRequestClose={() => setShowShareModal(false)}
        ownerId={user.id}
        listId={currentListId}
      />
    </div>
  );
};

export default ListManager;
