// Tasks CRUD
async function loadTasks(listId) {
  const { data: tasks, error } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar tarefas:', error);
    return;
  }

  const container = document.getElementById(`taskContainer-${listId}`);
  container.innerHTML = '';

  tasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = 'bg-gray-50 p-3 rounded mt-2';
    taskElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <h4 class="font-medium">${task.title}</h4>
                    <div class="flex gap-2">
                        <button onclick="showAddSubtaskModal('${task.id}')" class="text-green-500 hover:text-green-700 text-sm">
                            + Subtarefa
                        </button>
                        <button onclick="editTask('${task.id}')" class="text-blue-500 hover:text-blue-700 text-sm">
                            Editar
                        </button>
                        <button onclick="deleteTask('${task.id}')" class="text-red-500 hover:text-red-700 text-sm">
                            Excluir
                        </button>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-1">${task.description || ''}</p>
                <div id="subtaskContainer-${task.id}" class="mt-2"></div>
            `;
    container.appendChild(taskElement);
    loadSubtasks(task.id);
  });
}

function showAddTaskModal(listId) {
  currentListId = listId;
  currentTaskId = null;
  document.getElementById('taskModalTitle').textContent = 'Nova Tarefa';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDescription').value = '';
  document.getElementById('taskModal').classList.remove('hidden');
}

function closeTaskModal() {
  document.getElementById('taskModal').classList.add('hidden');
}

// Função para salvar tarefa corrigida
// Função para salvar tarefa corrigida com user_id
async function saveTask() {
  const title = document.getElementById('taskTitle').value;
  const description = document.getElementById('taskDescription').value;

  if (!title || !currentListId) {
    console.error('Título da tarefa e ID da lista são obrigatórios');
    return;
  }

  try {
    // Primeiro, obtém o usuário atual
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;

    if (currentTaskId) {
      // Atualizar tarefa existente
      const { data, error } = await supabaseClient
        .from('tasks')
        .update({
          title,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentTaskId);

      if (error) throw error;
    } else {
      // Criar nova tarefa
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert([{
          title,
          description,
          list_id: currentListId,
          user_id: user.id, // Adiciona o user_id
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
    }

    closeTaskModal();
    await loadLists(); // Recarrega todas as listas e tarefas
  } catch (error) {
    console.error('Erro ao salvar tarefa:', error);
    alert('Erro ao salvar tarefa: ' + error.message);
  }
}

// Função para carregar tarefas atualizada para considerar o user_id
async function loadTasks(listId) {
  try {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;

    const { data: tasks, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('list_id', listId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const container = document.getElementById(`taskContainer-${listId}`);
    if (!container) return;

    container.innerHTML = '';

    tasks?.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = 'bg-gray-50 p-3 rounded mt-2';
      taskElement.innerHTML = `
            <div class="flex justify-between items-center">
                <h4 class="font-medium">${task.title}</h4>
                <div class="flex gap-2">
                    <button onclick="showAddSubtaskModal('${task.id}')" class="text-green-500 hover:text-green-700 text-sm">
                        + Subtarefa
                    </button>
                    <button onclick="editTask('${task.id}')" class="text-blue-500 hover:text-blue-700 text-sm">
                        Editar
                    </button>
                    <button onclick="deleteTask('${task.id}')" class="text-red-500 hover:text-red-700 text-sm">
                        Excluir
                    </button>
                </div>
            </div>
            <p class="text-sm text-gray-600 mt-1">${task.description || ''}</p>
            <div id="subtaskContainer-${task.id}" class="mt-2"></div>
        `;
      container.appendChild(taskElement);
      loadSubtasks(task.id);
    });
  } catch (error) {
    console.error('Erro ao carregar tarefas:', error);
  }
}

// Função para carregar tarefas corrigida
async function loadTasks(listId) {
  try {
    const { data: tasks, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const container = document.getElementById(`taskContainer-${listId}`);
    if (!container) {
      console.error('Container não encontrado para a lista:', listId);
      return;
    }

    container.innerHTML = '';

    tasks?.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = 'bg-gray-50 p-3 rounded mt-2';
      taskElement.innerHTML = `
            <div class="flex justify-between items-center">
                <h4 class="font-medium">${task.title}</h4>
                <div class="flex gap-2">
                    <button onclick="showAddSubtaskModal('${task.id}')" class="text-green-500 hover:text-green-700 text-sm">
                        + Subtarefa
                    </button>
                    <button onclick="editTask('${task.id}')" class="text-blue-500 hover:text-blue-700 text-sm">
                        Editar
                    </button>
                    <button onclick="deleteTask('${task.id}')" class="text-red-500 hover:text-red-700 text-sm">
                        Excluir
                    </button>
                </div>
            </div>
            <p class="text-sm text-gray-600 mt-1">${task.description || ''}</p>
            <div id="subtaskContainer-${task.id}" class="mt-2"></div>
        `;
      container.appendChild(taskElement);
      loadSubtasks(task.id);
    });
  } catch (error) {
    console.error('Erro ao carregar tarefas:', error);
    alert('Erro ao carregar tarefas: ' + error.message);
  }
}

// Função para mostrar modal de tarefa corrigida
function showAddTaskModal(listId) {
  if (!listId) {
    console.error('ID da lista não fornecido');
    return;
  }

  currentListId = listId;
  currentTaskId = null;
  document.getElementById('taskModalTitle').textContent = 'Nova Tarefa';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDescription').value = '';
  document.getElementById('taskModal').classList.remove('hidden');
}

async function editTask(id) {
  const { data: task, error } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao carregar tarefa:', error);
    return;
  }

  currentTaskId = id;
  currentListId = task.list_id;
  document.getElementById('taskModalTitle').textContent = 'Editar Tarefa';
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskModal').classList.remove('hidden');
}

async function deleteTask(id) {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

  try {
    await supabaseClient.from('tasks').delete().eq('id', id);
    loadLists();
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
  }
}
