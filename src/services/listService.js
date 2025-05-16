// src/services/listService.js

import { supabase } from "../supabase";

// Função para compartilhar uma lista com outro usuário
export const shareList = async (ownerId, listId, sharedUserEmail) => {
  const { data: user, error: userError } = await supabase
    .from("profiles") // Assumindo que você tem uma tabela 'profiles' com 'id' e 'email' dos usuários
    .select("id")
    .eq("email", sharedUserEmail)
    .single();

  if (userError || !user) {
    console.error("Erro ao buscar usuário para compartilhar:", userError);
    throw new Error(
      "Usuário não encontrado. Verifique se o email está correto e se o usuário já confirmou o cadastro."
    );
  }

  if (user.id === ownerId) {
    throw new Error("Você não pode compartilhar uma lista com você mesmo.");
  }

  // Verificar se a lista já está compartilhada com este usuário
  const { data: existingShare, error: existingShareError } = await supabase
    .from("shared_lists")
    .select("list_id")
    .eq("list_id", listId)
    .eq("shared_with", user.id)
    .single();

  if (existingShareError && existingShareError.code !== "PGRST116") {
    // PGRST116: 'single row not found' é esperado se não houver compartilhamento
    console.error(
      "Erro ao verificar compartilhamento existente:",
      existingShareError
    );
    throw existingShareError;
  }

  if (existingShare) {
    throw new Error("Esta lista já está compartilhada com este usuário.");
  }

  const { error: shareError } = await supabase.from("shared_lists").insert({
    list_id: listId,
    shared_with: user.id,
    owner_id: ownerId, // ID do proprietário da lista que está compartilhando
    shared_at: new Date(),
  });

  if (shareError) {
    console.error("Erro ao inserir compartilhamento:", shareError);
    throw shareError;
  }
  return { message: "Lista compartilhada com sucesso!" };
};

// Função para deletar uma lista inteira (itens, compartilhamentos e a lista em si)
export const deleteList = async (ownerId, listId) => {
  const { error: itemsError } = await supabase
    .from("items")
    .delete()
    .eq("list_id", listId);

  if (itemsError) {
    console.error("Erro ao deletar itens da lista:", itemsError);
    throw itemsError;
  }

  const { error: sharedError } = await supabase
    .from("shared_lists")
    .delete()
    .eq("list_id", listId);

  if (sharedError) {
    console.error("Erro ao deletar compartilhamentos da lista:", sharedError);
    throw sharedError;
  }

  const { error: listError } = await supabase
    .from("lists")
    .delete()
    .eq("id", listId)
    .eq("owner_id", ownerId);

  if (listError) {
    console.error("Erro ao deletar a lista:", listError);
    throw listError;
  }
};

// Função para o usuário remover um compartilhamento recebido (deixar de seguir uma lista)
export const unshareListReceived = async (listId, userIdReceiving) => {
  const { error } = await supabase
    .from("shared_lists")
    .delete()
    .eq("list_id", listId)
    .eq("shared_with", userIdReceiving);

  if (error) {
    console.error("Erro ao remover compartilhamento recebido:", error);
    throw error;
  }
};

// Função para o proprietário remover um usuário específico do compartilhamento de sua lista
export const removeSharedUserByOwner = async (
  listOwnerId,
  listId,
  userIdToRemove
) => {
  const { error } = await supabase
    .from("shared_lists")
    .delete()
    .eq("list_id", listId)
    .eq("shared_with", userIdToRemove)
    .eq("owner_id", listOwnerId); // Garante que apenas o proprietário da lista pode remover

  if (error) {
    console.error(
      "Erro ao remover usuário do compartilhamento pelo proprietário:",
      error
    );
    throw error;
  }
};
