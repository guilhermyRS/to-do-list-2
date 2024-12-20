  async function loadSubtasks(taskId) {
    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError) throw userError;

        const { data: subtasks, error } = await supabaseClient
            .from('subtasks')
            .select('*')
            .eq('task_id', taskId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById(`subtaskContainer-${taskId}`);
        if (!container) return;

        container.innerHTML = '';

        subtasks?.forEach(async (subtask) => {
            const subtaskElement = document.createElement('div');
            subtaskElement.className = 'bg-white p-2 rounded mt-2 border';
            
            // Carregar checklist items para a subtarefa
            const { data: checklistItems, error: checklistError } = await supabaseClient
                .from('checklist_items')
                .select('*')
                .eq('subtask_id', subtask.id)
                .eq('user_id', user.id);

            if (checklistError) throw checklistError;

            let percentage = 0;
            if (checklistItems && checklistItems.length > 0) {
                const completedItems = checklistItems.filter(item => item.is_completed).length;
                percentage = (completedItems / checklistItems.length) * 100;
            }

            subtaskElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <h5 class="font-medium">${subtask.title}</h5>
                    <div class="flex gap-2 items-center">
                        <span class="text-sm text-gray-600">${percentage.toFixed(0)}%</span>
                        <button onclick="showAddChecklistModal('${subtask.id}')" class="text-green-500 hover:text-green-700 text-sm">
                            + Item
                        </button>
                        <button onclick="editSubtask('${subtask.id}')" class="text-blue-500 hover:text-blue-700 text-sm">
                            Editar
                        </button>
                        <button onclick="deleteSubtask('${subtask.id}')" class="text-red-500 hover:text-red-700 text-sm">
                            Excluir
                        </button>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-1">${subtask.description || ''}</p>
                <div class="w-full bg-gray-200 rounded h-2 mt-2">
                    <div class="bg-blue-500 rounded h-2" style="width: ${percentage}%"></div>
                </div>
                <div id="checklistContainer-${subtask.id}" class="mt-2"></div>
            `;
            container.appendChild(subtaskElement);
            loadChecklist(subtask.id);
        });
    } catch (error) {
        console.error('Erro ao carregar subtarefas:', error);
    }
}


    function showAddSubtaskModal(taskId) {
      currentTaskId = taskId;
      currentSubtaskId = null;
      document.getElementById('subtaskModalTitle').textContent = 'Nova Subtarefa';
      document.getElementById('subtaskTitle').value = '';
      document.getElementById('subtaskDescription').value = '';
      document.getElementById('subtaskModal').classList.remove('hidden');
    }

    function closeSubtaskModal() {
      document.getElementById('subtaskModal').classList.add('hidden');
    }

    async function saveSubtask() {
      const title = document.getElementById('subtaskTitle').value;
      const description = document.getElementById('subtaskDescription').value;

      if (!title || !currentTaskId) {
        console.error('Título da subtarefa e ID da tarefa são obrigatórios');
        return;
      }

      try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError) throw userError;

        if (currentSubtaskId) {
          const { data, error } = await supabaseClient
            .from('subtasks')
            .update({
              title,
              description,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentSubtaskId);

          if (error) throw error;
        } else {
          const { data, error } = await supabaseClient
            .from('subtasks')
            .insert([{
              title,
              description,
              task_id: currentTaskId,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);

          if (error) throw error;
        }

        closeSubtaskModal();
        await loadLists();
      } catch (error) {
        console.error('Erro ao salvar subtarefa:', error);
        alert('Erro ao salvar subtarefa: ' + error.message);
      }
    }

    async function editSubtask(id) {
      const { data: subtask, error } = await supabaseClient
        .from('subtasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao carregar subtarefa:', error);
        return;
      }

      currentSubtaskId = id;
      currentTaskId = subtask.task_id;
      document.getElementById('subtaskModalTitle').textContent = 'Editar Subtarefa';
      document.getElementById('subtaskTitle').value = subtask.title;
      document.getElementById('subtaskDescription').value = subtask.description || '';
      document.getElementById('subtaskModal').classList.remove('hidden');
    }

    async function deleteSubtask(id) {
      if (!confirm('Tem certeza que deseja excluir esta subtarefa?')) return;

      try {
        await supabaseClient.from('subtasks').delete().eq('id', id);
        loadLists();
      } catch (error) {
        console.error('Erro ao excluir subtarefa:', error);
      }
    }