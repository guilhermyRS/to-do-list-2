async function loadChecklist(subtaskId) {
  try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw userError;

      const { data: items, error } = await supabaseClient
          .from('checklist_items')
          .select('*')
          .eq('subtask_id', subtaskId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

      if (error) throw error;

      const container = document.getElementById(`checklistContainer-${subtaskId}`);
      if (!container) return;

      container.innerHTML = '';

      items?.forEach(item => {
          const itemElement = document.createElement('div');
          itemElement.className = 'flex items-center gap-2 mt-2';
          itemElement.innerHTML = `
              <input 
                  type="checkbox" 
                  ${item.is_completed ? 'checked' : ''} 
                  onchange="toggleChecklistItem('${item.id}', this.checked)"
                  class="rounded"
              >
              <span class="text-sm ${item.is_completed ? 'line-through text-gray-500' : ''}">${item.title}</span>
              <button onclick="editChecklistItem('${item.id}')" class="ml-auto text-blue-500 hover:text-blue-700 text-sm">
                  Editar
              </button>
              <button onclick="deleteChecklistItem('${item.id}')" class="text-red-500 hover:text-red-700 text-sm">
                  Excluir
              </button>
          `;
          container.appendChild(itemElement);
      });
  } catch (error) {
      console.error('Erro ao carregar checklist:', error);
  }
}

  function showAddChecklistModal(subtaskId) {
    currentSubtaskId = subtaskId;
    currentChecklistItemId = null;
    document.getElementById('checklistModalTitle').textContent = 'Novo Item';
    document.getElementById('checklistTitle').value = '';
    document.getElementById('checklistModal').classList.remove('hidden');
  }

  function closeChecklistModal() {
    document.getElementById('checklistModal').classList.add('hidden');
  }

  async function saveChecklistItem() {
    const title = document.getElementById('checklistTitle').value;
    if (!title || !currentSubtaskId) {
      console.error('Título do item e ID da subtarefa são obrigatórios');
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw userError;

      if (currentChecklistItemId) {
        const { data, error } = await supabaseClient
          .from('checklist_items')
          .update({
            title,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentChecklistItemId);

        if (error) throw error;
      } else {
        const { data, error } = await supabaseClient
          .from('checklist_items')
          .insert([{
            title,
            subtask_id: currentSubtaskId,
            user_id: user.id,
            is_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      closeChecklistModal();
      await loadLists();
    } catch (error) {
      console.error('Erro ao salvar item do checklist:', error);
      alert('Erro ao salvar item do checklist: ' + error.message);
    }
  }

  async function editChecklistItem(id) {
    const { data: item, error } = await supabaseClient
      .from('checklist_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao carregar item do checklist:', error);
      return;
    }

    currentChecklistItemId = id;
    currentSubtaskId = item.subtask_id;
    document.getElementById('checklistModalTitle').textContent = 'Editar Item';
    document.getElementById('checklistTitle').value = item.title;
    document.getElementById('checklistModal').classList.remove('hidden');
  }

  async function deleteChecklistItem(id) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      await supabaseClient.from('checklist_items').delete().eq('id', id);
      loadLists();
    } catch (error) {
      console.error('Erro ao excluir item do checklist:', error);
    }
  }

  async function toggleChecklistItem(id, isCompleted) {
    try {
      await supabaseClient
        .from('checklist_items')
        .update({
          is_completed: isCompleted,
          updated_at: new Date()
        })
        .eq('id', id);
      loadLists();
    } catch (error) {
      console.error('Erro ao atualizar item do checklist:', error);
    }
  }