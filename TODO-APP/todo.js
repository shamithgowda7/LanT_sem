// Data model in localStorage
const STORAGE_KEY = "todo_tasks_v1";

// state
let tasks = []; // { id, text, completed }
let currentFilter = "all"; // all | active | completed

// helpers
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  tasks = raw ? JSON.parse(raw) : [];
}

function renderTasks() {
  const $list = $("#taskList").empty();
  const filtered = tasks.filter((t) => {
    if (currentFilter === "active") return !t.completed;
    if (currentFilter === "completed") return t.completed;
    return true;
  });

  if (filtered.length === 0) {
    $("#emptyMsg").show();
  } else {
    $("#emptyMsg").hide();
  }

  filtered.forEach((task) => {
    const $li = $(`
      <li class="task-item mb-2" data-id="${task.id}">
        <div class="form-check">
          <input class="form-check-input task-checkbox" type="checkbox" ${task.completed ? "checked" : ""} id="chk-${task.id}">
        </div>
        <div class="task-text ${task.completed ? "completed" : ""}" data-role="text">${escapeHtml(task.text)}</div>
        <div class="input-edit" style="display:none; flex:1;">
          <div class="input-group">
            <input type="text" class="form-control form-control-sm edit-input" value="${escapeAttr(task.text)}">
            <button class="btn btn-sm btn-success save-edit" title="Save">Save</button>
            <button class="btn btn-sm btn-outline-secondary cancel-edit" title="Cancel">Cancel</button>
          </div>
        </div>
        <div class="btn-group ms-2" role="group">
          <button class="btn btn-sm btn-outline-secondary btn-icon edit-btn" title="Edit">✏️</button>
          <button class="btn btn-sm btn-outline-danger btn-icon delete-btn" title="Delete">🗑️</button>
        </div>
      </li>
    `);
    $list.append($li);
  });

  updateFooter();
}

function updateFooter() {
  const left = tasks.filter((t) => !t.completed).length;
  $("#itemsLeft").text(`${left} item${left !== 1 ? "s" : ""} left`);
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const task = {
    id: Date.now().toString(),
    text: trimmed,
    completed: false,
  };
  tasks.unshift(task); // newest first
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function toggleComplete(id, completed) {
  const t = tasks.find((x) => x.id === id);
  if (t) t.completed = completed;
  saveTasks();
  renderTasks();
}

function startEdit($li) {
  $li.find('[data-role="text"]').hide();
  $li.find(".input-edit").show();
  $li.find(".edit-input").focus().select();
}

function cancelEdit($li) {
  $li.find(".input-edit").hide();
  $li.find('[data-role="text"]').show();
}

function saveEdit($li) {
  const id = $li.data("id").toString();
  const newText = $li.find(".edit-input").val().trim();
  if (newText === "") {
    deleteTask(id);
    return;
  }
  const t = tasks.find((x) => x.id === id);
  if (t) t.text = newText;
  saveTasks();
  renderTasks();
}

function setFilter(filter) {
  currentFilter = filter;
  $(".filter-btn").removeClass("active");
  $(`.filter-btn[data-filter="${filter}"]`).addClass("active");
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderTasks();
}

// Escape helpers
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function escapeAttr(str) {
  return String(str).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// --- Event wiring ---
$(function () {
  loadTasks();
  renderTasks();

  $("#addTaskBtn").on("click", function () {
    const text = $("#taskInput").val();
    addTask(text);
    $("#taskInput").val("").focus();
  });

  $("#taskInput").on("keypress", function (e) {
    if (e.which === 13) {
      $("#addTaskBtn").click();
    }
  });

  $("#taskList").on("change", ".task-checkbox", function () {
    const id = $(this).closest("li").data("id").toString();
    const checked = $(this).is(":checked");
    toggleComplete(id, checked);
  });

  $("#taskList").on("click", ".delete-btn", function () {
    const id = $(this).closest("li").data("id").toString();
    if (confirm("Delete this task?")) {
      deleteTask(id);
    }
  });

  $("#taskList").on("click", ".edit-btn", function () {
    const $li = $(this).closest("li");
    startEdit($li);
  });

  $("#taskList").on("click", ".cancel-edit", function () {
    const $li = $(this).closest("li");
    cancelEdit($li);
  });

  $("#taskList").on("click", ".save-edit", function () {
    const $li = $(this).closest("li");
    saveEdit($li);
  });

  $("#taskList").on("keypress", ".edit-input", function (e) {
    if (e.which === 13) {
      $(this).closest("li").find(".save-edit").click();
    } else if (e.which === 27) {
      $(this).closest("li").find(".cancel-edit").click();
    }
  });

  $(".filter-btn").on("click", function () {
    const filter = $(this).data("filter");
    setFilter(filter);
  });

  $("#clearCompleted").on("click", function () {
    if (confirm("Remove all completed tasks?")) clearCompleted();
  });

  $("#taskList").on("click", ".task-text", function () {
    const $li = $(this).closest("li");
    const id = $li.data("id").toString();
    const t = tasks.find((x) => x.id === id);
    if (t) toggleComplete(id, !t.completed);
  });
});
