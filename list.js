// Função principal para carregar as listas
async function loadLists() {
  try {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;

    const { data: lists, error } = await supabaseClient
      .from('lists')
      .select(`
        *,
        tasks:tasks(
          *,
          subtasks:subtasks(
            *,
            checklist_items:checklist_items(*)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const container = document.getElementById('listContainer');
    container.innerHTML = '';

    lists?.forEach(list => {
      renderList(list);
    });
  } catch (error) {
    console.error('Erro ao carregar listas:', error);
  }
}

// Função para renderizar uma lista
function renderList(list) {
  const container = document.getElementById('listContainer');
  const listElement = document.createElement('div');
  listElement.className = 'bg-[#1E1E1E] text-white p-4 rounded-lg shadow';
  listElement.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">${list.title}</h3>
      <div class="flex gap-2">
        <button onclick="showAddTaskModal('${list.id}')" class="text-success hover:text-success-dark">
          <i class="bi bi-plus-circle fs-4"></i>
        </button>
        <button onclick="editList('${list.id}')" class="text-primary hover:text-primary-dark">
          <i class="bi bi-pencil fs-4"></i>
        </button>
        <button onclick="deleteList('${list.id}')" class="text-danger hover:text-danger-dark">
          <i class="bi bi-trash fs-4"></i>
        </button>
      </div>
    </div>
    <div id="taskContainer-${list.id}"></div>
  `;
  container.appendChild(listElement);

  renderTasks(list);
}



// Função para renderizar as tarefas de uma lista
function renderTasks(list) {
  const taskContainer = document.getElementById(`taskContainer-${list.id}`);
  list.tasks?.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = 'bg-[#121212] text-white p-3 rounded mt-2';  // Preto mais suave
    taskElement.innerHTML = `
      <div class="flex justify-between items-center">
        <h4 class="font-medium">${task.title}</h4>
        <div class="flex gap-2">
          <button onclick="showAddSubtaskModal('${task.id}')" class="text-success hover:text-success-dark">
            <i class="bi bi-plus-circle fs-4"></i>
          </button>
          <button onclick="editTask('${task.id}')" class="text-primary hover:text-primary-dark">
            <i class="bi bi-pencil fs-4"></i>
          </button>
          <button onclick="deleteTask('${task.id}')" class="text-danger hover:text-danger-dark">
            <i class="bi bi-trash fs-4"></i>
          </button>
        </div>
      </div>
      <p class="text-sm text-gray-300 mt-1">${task.description || ''}</p>  <!-- Texto mais suave -->
      <div id="subtaskContainer-${task.id}" class="mt-2"></div>
    `;
    taskContainer.appendChild(taskElement);

    renderSubtasks(task);
  });
}




// Função para renderizar as subtarefas de uma tarefa
function renderSubtasks(task) {
  const subtaskContainer = document.getElementById(`subtaskContainer-${task.id}`);
  task.subtasks?.forEach(subtask => {
    const subtaskElement = document.createElement('div');
    subtaskElement.className = 'bg-[#1E1E1E] text-white p-2 rounded mt-2 border';

    const checklistItems = subtask.checklist_items || [];
    const completedItems = checklistItems.filter(item => item.is_completed).length;
    const percentage = checklistItems.length > 0 ? (completedItems / checklistItems.length) * 100 : 0;

    // Determina as cores baseadas na porcentagem
    let progressBarColor = 'bg-red-500';
    let percentageClass = 'percentage-text-red';
    let checkboxClass = 'checkbox-red';
    
    if (percentage >= 75) {
      progressBarColor = 'bg-[#10b981]';
      percentageClass = 'percentage-text-green';
      checkboxClass = 'checkbox-green';
    } else if (percentage >= 40) {
      progressBarColor = 'bg-yellow-500';
      percentageClass = 'percentage-text-yellow';
      checkboxClass = 'checkbox-yellow';
    }

    const titleClass = percentage === 100 ? 'completed-title' : '';
    const containerClass = percentage === 100 ? 'completed-task' : '';

    subtaskElement.className += ` ${containerClass}`;

    subtaskElement.innerHTML = `
      <div class="flex justify-between items-center">
        <h5 class="font-medium ${titleClass}">${subtask.title}</h5>
        <div class="flex gap-2 items-center">
          <span class="text-sm ${percentageClass}">${percentage.toFixed(0)}%</span>
          <button onclick="showAddChecklistModal('${subtask.id}')" class="text-success hover:text-success-dark">
            <i class="bi bi-plus-circle fs-4"></i>
          </button>
          <button onclick="editSubtask('${subtask.id}')" class="text-primary hover:text-primary-dark">
            <i class="bi bi-pencil fs-4"></i>
          </button>
          <button onclick="deleteSubtask('${subtask.id}')" class="text-danger hover:text-danger-dark">
            <i class="bi bi-trash fs-4"></i>
          </button>
        </div>
      </div>
      <p class="text-sm text-gray-300 mt-1">${subtask.description || ''}</p>
      <div class="w-full bg-gray-600 rounded h-2 mt-2">
        <div class="${progressBarColor} rounded h-2 transition-all duration-300" style="width: ${percentage}%"></div>
      </div>
      <div id="checklistContainer-${subtask.id}" class="mt-2" data-checkbox-class="${checkboxClass}"></div>
    `;
    subtaskContainer.appendChild(subtaskElement);

    renderChecklistItems(subtask, checkboxClass);
  });
}

function renderChecklistItems(subtask, checkboxClass) {
  const checklistContainer = document.getElementById(`checklistContainer-${subtask.id}`);
  const sortedItems = [...subtask.checklist_items].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  sortedItems.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'flex items-center gap-2 mt-2 bg-[#3a3a3a] p-2 rounded';
    itemElement.dataset.itemId = item.id;
    itemElement.dataset.createdAt = item.created_at;
    itemElement.innerHTML = `
      <input 
        type="checkbox" 
        ${item.is_completed ? 'checked' : ''} 
        onchange="toggleChecklistItem('${item.id}', this.checked)"
        class="rounded ${checkboxClass}"
      >
      <span class="text-sm ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-300'}">${item.title}</span>
      <button onclick="editChecklistItem('${item.id}')" class="ml-auto text-primary hover:text-primary-dark text-sm">
        <i class="bi bi-pencil fs-4"></i>
      </button>
      <button onclick="deleteChecklistItem('${item.id}')" class="text-danger hover:text-danger-dark text-sm">
        <i class="bi bi-trash fs-4"></i>
      </button>
    `;
    checklistContainer.appendChild(itemElement);
  });
}

async function toggleChecklistItem(id, isCompleted) {
  try {
    const { error } = await supabaseClient
      .from('checklist_items')
      .update({
        is_completed: isCompleted,
        updated_at: new Date()
      })
      .eq('id', id);

    if (error) throw error;

    const itemElement = document.querySelector(`[data-item-id="${id}"]`);
    const checklistContainer = itemElement.closest('[id^="checklistContainer-"]');
    const subtaskElement = checklistContainer.closest('.bg-[#1E1E1E]');
    
    // Calcular nova porcentagem
    const totalItems = checklistContainer.querySelectorAll('input[type="checkbox"]').length;
    const completedItems = checklistContainer.querySelectorAll('input[type="checkbox"]:checked').length;
    const percentage = (completedItems / totalItems) * 100;
    
    // Atualizar cores baseadas na nova porcentagem
    let progressBarColor = 'bg-red-500';
    let percentageClass = 'percentage-text-red';
    let checkboxClass = 'checkbox-red';
    
    if (percentage >= 75) {
      progressBarColor = 'bg-[#10b981]';
      percentageClass = 'percentage-text-green';
      checkboxClass = 'checkbox-green';
    } else if (percentage >= 40) {
      progressBarColor = 'bg-yellow-500';
      percentageClass = 'percentage-text-yellow';
      checkboxClass = 'checkbox-yellow';
    }

    // Atualizar elementos visuais
    const progressBar = subtaskElement.querySelector('.bg-red-500, .bg-yellow-500, .bg-[#10b981]');
    const percentageSpan = subtaskElement.querySelector('[class*="percentage-text-"]');
    const titleElement = subtaskElement.querySelector('h5');
    const checkboxes = checklistContainer.querySelectorAll('input[type="checkbox"]');
    
    // Remover classes antigas e adicionar novas
    progressBar.className = `${progressBarColor} rounded h-2 transition-all duration-300`;
    percentageSpan.className = `text-sm ${percentageClass}`;
    checkboxes.forEach(checkbox => {
      checkbox.className = `rounded ${checkboxClass}`;
    });
    
    // Atualizar porcentagem
    progressBar.style.width = `${percentage}%`;
    percentageSpan.textContent = `${percentage.toFixed(0)}%`;
    
    // Adicionar/remover classe de conclusão
    if (percentage === 100) {
      subtaskElement.classList.add('completed-task');
      titleElement.classList.add('completed-title');
    } else {
      subtaskElement.classList.remove('completed-task');
      titleElement.classList.remove('completed-title');
    }

    // Atualizar estado visual do item
    const textSpan = itemElement.querySelector('span');
    if (isCompleted) {
      textSpan.classList.add('line-through', 'text-gray-500');
    } else {
      textSpan.classList.remove('line-through', 'text-gray-500');
    }
    
  } catch (error) {
    console.error('Erro ao atualizar item do checklist:', error);
  }
}


// Funções para gerenciamento de listas
function showAddListModal() {
  currentListId = null;
  document.getElementById('listModalTitle').textContent = 'Nova Lista';
  document.getElementById('listTitle').value = '';
  document.getElementById('listModal').classList.remove('hidden');
}

function closeListModal() {
  document.getElementById('listModal').classList.add('hidden');
}

async function saveList() {
  const title = document.getElementById('listTitle').value;
  
  if (!title) {
      console.error('Título da lista é obrigatório');
      return;
  }

  try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw userError;

      if (currentListId) {
          // Atualizar lista existente
          const { data, error } = await supabaseClient
              .from('lists')
              .update({
                  title,
                  updated_at: new Date().toISOString()
              })
              .eq('id', currentListId);

          if (error) throw error;
      } else {
          // Criar nova lista
          const { data, error } = await supabaseClient
              .from('lists')
              .insert([{
                  title,
                  user_id: user.id,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
              }]);


          if (error) throw error;
      }

      closeListModal();
      await loadLists();
  } catch (error) {
      console.error('Erro ao salvar lista:', error);
      alert('Erro ao salvar lista: ' + error.message);
  }
}

async function editList(id) {
  try {
      const { data: list, error } = await supabaseClient
          .from('lists')
          .select('*')
          .eq('id', id)
          .single();

      if (error) throw error;

      currentListId = id;
      document.getElementById('listModalTitle').textContent = 'Editar Lista';
      document.getElementById('listTitle').value = list.title;
      document.getElementById('listModal').classList.remove('hidden');
  } catch (error) {
      console.error('Erro ao carregar lista:', error);
      alert('Erro ao carregar lista: ' + error.message);
  }
}

async function deleteList(id) {
  if (!confirm('Tem certeza que deseja excluir esta lista?')) return;

  try {
      const { error } = await supabaseClient
          .from('lists')
          .delete()
          .eq('id', id);

      if (error) throw error;

      await loadLists();
  } catch (error) {
      console.error('Erro ao excluir lista:', error);
      alert('Erro ao excluir lista: ' + error.message);
  }
}
