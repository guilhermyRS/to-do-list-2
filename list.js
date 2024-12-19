    // Lists CRUD
    async function loadLists() {
      const { data: lists, error } = await supabaseClient
        .from('lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar listas:', error);
        return;
      }

      const container = document.getElementById('listContainer');
      container.innerHTML = '';

      lists.forEach(list => {
        const listElement = document.createElement('div');
        listElement.className = 'bg-white p-4 rounded-lg shadow';
        listElement.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">${list.title}</h3>
                        <div class="flex gap-2">
                            <button onclick="editList('${list.id}')" class="text-blue-500 hover:text-blue-700">
                                Editar
                            </button>
                            <button onclick="deleteList('${list.id}')" class="text-red-500 hover:text-red-700">
                                Excluir
                            </button>
                        </div>
                    </div>
                    <button onclick="showAddTaskModal('${list.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                        + Tarefa
                    </button>
                    <div id="taskContainer-${list.id}" class="mt-4"></div>
                `;
        container.appendChild(listElement);
        loadTasks(list.id);
      });
    }

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
      if (!title) return;

      try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (currentListId) {
          await supabaseClient
            .from('lists')
            .update({ title, updated_at: new Date() })
            .eq('id', currentListId)
            .eq('user_id', user.id);
        } else {
          await supabaseClient
            .from('lists')
            .insert([{
              title,
              user_id: user.id
            }]);
        }
        closeListModal();
        loadLists();
      } catch (error) {
        console.error('Erro ao salvar lista:', error);
      }
    }

    async function editList(id) {
      const { data: list, error } = await supabaseClient
        .from('lists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao carregar lista:', error);
        return;
      }

      currentListId = id;
      document.getElementById('listModalTitle').textContent = 'Editar Lista';
      document.getElementById('listTitle').value = list.title;
      document.getElementById('listModal').classList.remove('hidden');
    }

    async function deleteList(id) {
      if (!confirm('Tem certeza que deseja excluir esta lista?')) return;

      try {
        await supabaseClient.from('lists').delete().eq('id', id);
        loadLists();
      } catch (error) {
        console.error('Erro ao excluir lista:', error);
      }
    }