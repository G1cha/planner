// ============================================================
// APP LOGIC & LOCAL PERSISTENCE (MINIMAL TASK & HUSTLE PLANNER)
// ============================================================

const STORAGE_KEYS = {
  TASKS: "pwa_tasks_v8",
  ARCHIVE: "pwa_archive_v8",
  SMART_NOTES: "pwa_smart_notes_v8",
  CAR_OIL: "pwa_car_oil_v8",
  CAR_LOGS: "pwa_car_logs_v8",
  SCHEMES: "pwa_schemes_v8",
  LAST_DATE: "pwa_last_login_date_v8",
};

// Initial Data
const DEFAULT_SMART_NOTES = [];
const DEFAULT_CAR_LOGS = [];
const DEFAULT_SCHEMES = [];

// State
let currentNotesTab = "pinned"; // 'pinned' | 'car'
let currentSchemeFilter = "all";

let editingSmartNoteId = null;
let editingSchemeId = null;

document.addEventListener("DOMContentLoaded", () => {
  initDefaults();
  initDate();
  checkMidnightArchiving();
  initNavigation();
  initTasks();
  initSmartNotes();
  initCarHub();
  initSchemes();
  renderAll();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("sw.js")
      .catch((err) => console.log("SW reg error:", err));
  }
});

function initDefaults() {
  if (!localStorage.getItem(STORAGE_KEYS.SMART_NOTES))
    saveStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
  if (!localStorage.getItem(STORAGE_KEYS.CAR_OIL))
    saveStored(STORAGE_KEYS.CAR_OIL, "212 000 км");
  if (!localStorage.getItem(STORAGE_KEYS.CAR_LOGS))
    saveStored(STORAGE_KEYS.CAR_LOGS, DEFAULT_CAR_LOGS);
  if (!localStorage.getItem(STORAGE_KEYS.SCHEMES))
    saveStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
}

function getIsoDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initDate() {
  const options = { weekday: "long", day: "numeric", month: "long" };
  const str = new Date().toLocaleDateString("ru-RU", options);
  const curDateEl = document.getElementById("current-date-text");
  if (curDateEl)
    curDateEl.textContent = str.charAt(0).toUpperCase() + str.slice(1);

  const carDateEl = document.getElementById("car-log-date");
  if (carDateEl) carDateEl.value = getIsoDateString(new Date());
}

function getStored(key, def) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : def;
  } catch (e) {
    return def;
  }
}
function saveStored(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function checkMidnightArchiving() {
  const todayStr = getIsoDateString(new Date());
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  let archive = getStored(STORAGE_KEYS.ARCHIVE, []);

  const activeTasks = [];
  let movedCount = 0;

  tasks.forEach((t) => {
    if (t.done && t.doneDate && t.doneDate < todayStr) {
      archive.push(t);
      movedCount++;
    } else {
      activeTasks.push(t);
    }
  });

  if (movedCount > 0) {
    saveStored(STORAGE_KEYS.TASKS, activeTasks);
    saveStored(STORAGE_KEYS.ARCHIVE, archive);
  }

  localStorage.setItem(STORAGE_KEYS.LAST_DATE, todayStr);
}

// ================= NAVIGATION =================
function initNavigation() {
  // Main 3-tabbar
  const tabBtns = document.querySelectorAll(".bottom-tabbar .tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add("active");

      if (targetId === "tab-schemes") renderSchemes();
      else if (targetId === "tab-archive") renderArchive();
    });
  });

  // Notes Subtabs
  const notesCategoryBtns = document.querySelectorAll(
    "#notes-category-control .seg-btn",
  );
  notesCategoryBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      notesCategoryBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentNotesTab = btn.getAttribute("data-notes-tab");

      const pinnedC = document.getElementById("notes-pinned-container");
      const carC = document.getElementById("notes-car-container");

      pinnedC.style.display = currentNotesTab === "pinned" ? "block" : "none";
      carC.style.display = currentNotesTab === "car" ? "block" : "none";

      if (currentNotesTab === "car") renderCarHub();
      else if (currentNotesTab === "pinned") renderSmartNotes();
    });
  });

  // Export JSON Backup
  const exportBtn = document.getElementById("btn-export-data");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dump = {
        tasks: getStored(STORAGE_KEYS.TASKS, []),
        archive: getStored(STORAGE_KEYS.ARCHIVE, []),
        smartNotes: getStored(STORAGE_KEYS.SMART_NOTES, []),
        carOil: getStored(STORAGE_KEYS.CAR_OIL, "212 000 км"),
        carLogs: getStored(STORAGE_KEYS.CAR_LOGS, []),
        schemes: getStored(STORAGE_KEYS.SCHEMES, []),
        exportDate: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planner_backup_${getIsoDateString(new Date())}.json`;
      a.click();
    });
  }
}

// ================= TASKS (PRIORITY SYSTEM) =================
function initTasks() {
  const input = document.getElementById("task-input");
  const addBtn = document.getElementById("btn-add-task");
  if (!input || !addBtn) return;

  const addTask = () => {
    const text = input.value.trim();
    if (!text) return;

    const tasks = getStored(STORAGE_KEYS.TASKS, []);
    // Push new tasks to top
    tasks.unshift({
      id: "task_" + Date.now(),
      text: text,
      done: false,
      createdAt: getIsoDateString(new Date()),
      doneDate: null,
    });
    saveStored(STORAGE_KEYS.TASKS, tasks);
    input.value = "";
    renderTasks();
  };

  addBtn.addEventListener("click", addTask);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });
}

function toggleTask(id) {
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  const todayStr = getIsoDateString(new Date());
  const item = tasks.find((t) => t.id === id);
  if (item) {
    item.done = !item.done;
    item.doneDate = item.done ? todayStr : null;
    saveStored(STORAGE_KEYS.TASKS, tasks);
    renderTasks();
  }
}

function deleteTask(id) {
  let tasks = getStored(STORAGE_KEYS.TASKS, []);
  tasks = tasks.filter((t) => t.id !== id);
  saveStored(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
}

function moveTask(index, direction) {
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  if (direction === -1 && index > 0) {
    [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
  } else if (direction === 1 && index < tasks.length - 1) {
    [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
  }
  saveStored(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
}

function renderTasks() {
  const container = document.getElementById("tasks-list");
  if (!container) return;
  const tasks = getStored(STORAGE_KEYS.TASKS, []);

  if (tasks.length === 0) {
    container.innerHTML = `<div class="empty-state">Нет задач. Запишите первую! ✨</div>`;
    return;
  }

  container.innerHTML = tasks
    .map(
      (t, index) => `
    <div class="task-item ${t.done ? "done" : ""}">
      <div class="custom-checkbox" onclick="toggleTask('${t.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="task-text">${escapeHtml(t.text)}</div>
      
      <div class="task-reorder-controls">
        <button class="task-move-btn" onclick="moveTask(${index}, -1)" ${index === 0 ? "disabled" : ""}>▲</button>
        <button class="task-move-btn" onclick="moveTask(${index}, 1)" ${index === tasks.length - 1 ? "disabled" : ""}>▼</button>
      </div>

      <button class="task-del-btn" onclick="deleteTask('${t.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `,
    )
    .join("");
}

// ================= SMART NOTES =================
function initSmartNotes() {
  const modal = document.getElementById("smart-note-modal");
  const addBtn = document.getElementById("btn-add-smart-note");
  const closeBtn = document.getElementById("btn-close-sn-modal");
  const saveBtn = document.getElementById("btn-save-smart-note");
  const deleteBtn = document.getElementById("btn-delete-smart-note");
  const modalEditor = document.getElementById("sn-modal-rich-content");
  if (!modal) return;

  const modalToolbarBtns = document.querySelectorAll(
    ".modal-toolbar .toolbar-btn",
  );
  modalToolbarBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute("data-cmd-modal");
      execRichCommand(cmd, modalEditor);
    });
  });

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      editingSmartNoteId = null;
      document.getElementById("smart-note-modal-title").textContent =
        "Новая карточка базы";
      document.getElementById("sn-modal-icon").value = "📌";
      document.getElementById("sn-modal-color").value = "badge-blue";
      document.getElementById("sn-modal-title").value = "";
      document.getElementById("sn-modal-badge").value = "";
      if (modalEditor) modalEditor.innerHTML = "";
      deleteBtn.style.display = "none";
      modal.classList.add("active");
    });
  }

  if (closeBtn)
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const icon =
        document.getElementById("sn-modal-icon").value.trim() || "📌";
      const color = document.getElementById("sn-modal-color").value;
      const title = document.getElementById("sn-modal-title").value.trim();
      const badge = document.getElementById("sn-modal-badge").value.trim();
      const content = modalEditor ? modalEditor.innerHTML : "";

      if (!title) {
        alert("Укажите заголовок карточки");
        return;
      }

      const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
      if (editingSmartNoteId) {
        const item = notes.find((n) => n.id === editingSmartNoteId);
        if (item) {
          item.icon = icon;
          item.badgeClass = color;
          item.title = title;
          item.badge = badge;
          item.content = content;
        }
      } else {
        notes.push({
          id: "sn_" + Date.now(),
          icon: icon,
          badgeClass: color,
          title: title,
          badge: badge,
          content: content,
        });
      }

      saveStored(STORAGE_KEYS.SMART_NOTES, notes);
      modal.classList.remove("active");
      renderSmartNotes();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (!editingSmartNoteId) return;
      if (confirm("Точно удалить эту карточку из базы?")) {
        let notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
        notes = notes.filter((n) => n.id !== editingSmartNoteId);
        saveStored(STORAGE_KEYS.SMART_NOTES, notes);
        modal.classList.remove("active");
        renderSmartNotes();
      }
    });
  }
}

function execRichCommand(cmd, targetElement) {
  targetElement.focus();
  if (cmd === "hilite") {
    document.execCommand("hiliteColor", false, "rgba(245, 158, 11, 0.35)");
  } else if (cmd === "insertHorizontalRule") {
    document.execCommand("insertHorizontalRule", false, null);
  } else {
    document.execCommand(cmd, false, null);
  }
}

function openEditSmartNote(id) {
  editingSmartNoteId = id;
  const modal = document.getElementById("smart-note-modal");
  const deleteBtn = document.getElementById("btn-delete-smart-note");
  const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
  const item = notes.find((n) => n.id === id);
  const modalEditor = document.getElementById("sn-modal-rich-content");
  if (!item || !modal) return;

  document.getElementById("smart-note-modal-title").textContent =
    "Редактировать карточку";
  document.getElementById("sn-modal-icon").value = item.icon || "📌";
  document.getElementById("sn-modal-color").value =
    item.badgeClass || "badge-blue";
  document.getElementById("sn-modal-title").value = item.title;
  document.getElementById("sn-modal-badge").value = item.badge || "";
  if (modalEditor) modalEditor.innerHTML = item.content || "";
  deleteBtn.style.display = "block";
  modal.classList.add("active");
}

function renderSmartNotes() {
  const container = document.getElementById("pinned-notes-list");
  if (!container) return;
  const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);

  container.innerHTML = notes
    .map(
      (n) => `
    <div class="glass-card smart-card">
      <div class="smart-card-header">
        <div class="smart-card-title-wrap">
          <span class="smart-card-icon">${n.icon}</span>
          <span class="smart-card-title">${escapeHtml(n.title)}</span>
        </div>
        ${n.badge ? `<span class="smart-card-badge ${n.badgeClass || "badge-blue"}">${escapeHtml(n.badge)}</span>` : ""}
      </div>
      <div class="smart-card-body">
        ${n.content || ""}
      </div>
      <div class="smart-card-actions">
        <button class="btn-card-edit" onclick="openEditSmartNote('${n.id}')">✏️ Настроить / Изменить</button>
      </div>
    </div>
  `,
    )
    .join("");
}

// ================= CAR HUB =================
function initCarHub() {
  const oilModal = document.getElementById("car-oil-modal");
  const editOilBtn = document.getElementById("btn-edit-oil-status");
  const closeOilBtn = document.getElementById("btn-close-oil-modal");
  const saveOilBtn = document.getElementById("btn-save-oil-modal");
  const oilInput = document.getElementById("modal-car-oil-input");

  if (editOilBtn && oilModal) {
    editOilBtn.addEventListener("click", () => {
      oilInput.value = getStored(STORAGE_KEYS.CAR_OIL, "212 000 км");
      oilModal.classList.add("active");
    });
  }
  if (closeOilBtn)
    closeOilBtn.addEventListener("click", () =>
      oilModal.classList.remove("active"),
    );
  if (saveOilBtn) {
    saveOilBtn.addEventListener("click", () => {
      const val = oilInput.value.trim() || "212 000 км";
      saveStored(STORAGE_KEYS.CAR_OIL, val);
      oilModal.classList.remove("active");
      renderCarHub();
    });
  }

  const addLogBtn = document.getElementById("btn-add-car-log");
  const mileageInput = document.getElementById("car-log-mileage");
  const dateInput = document.getElementById("car-log-date");
  const worksInput = document.getElementById("car-log-works");

  if (addLogBtn) {
    addLogBtn.addEventListener("click", () => {
      const mileage = mileageInput.value.trim();
      const dateVal = dateInput.value || getIsoDateString(new Date());
      const works = worksInput.value.trim();

      if (!mileage || !works) {
        alert("Укажите пробег и выполненные работы");
        return;
      }

      const logs = getStored(STORAGE_KEYS.CAR_LOGS, DEFAULT_CAR_LOGS);
      logs.unshift({
        id: "car_" + Date.now(),
        mileage: mileage,
        date: dateVal,
        works: works,
      });
      saveStored(STORAGE_KEYS.CAR_LOGS, logs);

      mileageInput.value = "";
      worksInput.value = "";
      renderCarHub();
    });
  }
}

function deleteCarLog(id) {
  let logs = getStored(STORAGE_KEYS.CAR_LOGS, DEFAULT_CAR_LOGS);
  logs = logs.filter((l) => l.id !== id);
  saveStored(STORAGE_KEYS.CAR_LOGS, logs);
  renderCarHub();
}

function renderCarHub() {
  const oilTarget = getStored(STORAGE_KEYS.CAR_OIL, "212 000 км");
  const oilEl = document.getElementById("car-oil-target-km");
  if (oilEl) oilEl.textContent = oilTarget;

  const container = document.getElementById("car-maintenance-list");
  if (!container) return;
  const logs = getStored(STORAGE_KEYS.CAR_LOGS, DEFAULT_CAR_LOGS);

  if (logs.length === 0) {
    container.innerHTML = `<div class="empty-state">Журнал обслуживания пуст. Добавьте первую запись! 🚗</div>`;
    return;
  }

  container.innerHTML = logs
    .map(
      (l) => `
    <div class="car-log-card">
      <div class="car-log-header">
        <span class="car-log-mileage-badge">🔧 Пробег: ${escapeHtml(l.mileage)}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: var(--text-muted);">${l.date}</span>
          <button class="task-del-btn" onclick="deleteCarLog('${l.id}')">✕</button>
        </div>
      </div>
      <div class="car-log-works">${escapeHtml(l.works)}</div>
    </div>
  `,
    )
    .join("");
}

// ================= SCHEMES (ТЕМКИ) =================
function initSchemes() {
  const titleInput = document.getElementById("scheme-title");
  const potentialInput = document.getElementById("scheme-potential");
  const notesInput = document.getElementById("scheme-notes");
  const addBtn = document.getElementById("btn-add-scheme");
  if (!addBtn) return;

  addBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const potential = potentialInput.value.trim();
    const notes = notesInput.value.trim();

    if (!title) {
      alert("Укажите название темки");
      return;
    }

    const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
    list.unshift({
      id: "sch_" + Date.now(),
      title: title,
      potential: potential || "Не указан",
      status: "idea",
      notes: notes,
    });
    saveStored(STORAGE_KEYS.SCHEMES, list);

    titleInput.value = "";
    potentialInput.value = "";
    notesInput.value = "";
    renderSchemes();
  });

  const filterBtns = document.querySelectorAll(
    "#scheme-filter-pills .week-pill",
  );
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentSchemeFilter = btn.getAttribute("data-scheme-filter");
      renderSchemes();
    });
  });

  const modal = document.getElementById("scheme-modal");
  const closeBtn = document.getElementById("btn-close-scheme-modal");
  const saveBtn = document.getElementById("btn-save-scheme-modal");
  const delBtn = document.getElementById("btn-delete-scheme-modal");

  if (closeBtn)
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!editingSchemeId) return;
      const title = document.getElementById("modal-scheme-title").value.trim();
      const potential = document
        .getElementById("modal-scheme-potential")
        .value.trim();
      const status = document.getElementById("modal-scheme-status").value;
      const notes = document.getElementById("modal-scheme-notes").value.trim();

      if (!title) {
        alert("Укажите название темки");
        return;
      }

      const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
      const item = list.find((s) => s.id === editingSchemeId);
      if (item) {
        item.title = title;
        item.potential = potential;
        item.status = status;
        item.notes = notes;
        saveStored(STORAGE_KEYS.SCHEMES, list);
        renderSchemes();
      }
      modal.classList.remove("active");
    });
  }

  if (delBtn) {
    delBtn.addEventListener("click", () => {
      if (!editingSchemeId) return;
      if (confirm("Удалить эту темку?")) {
        let list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
        list = list.filter((s) => s.id !== editingSchemeId);
        saveStored(STORAGE_KEYS.SCHEMES, list);
        modal.classList.remove("active");
        renderSchemes();
      }
    });
  }
}

function openEditSchemeModal(id) {
  editingSchemeId = id;
  const modal = document.getElementById("scheme-modal");
  const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
  const item = list.find((s) => s.id === id);
  if (!item || !modal) return;

  document.getElementById("modal-scheme-title").value = item.title;
  document.getElementById("modal-scheme-potential").value =
    item.potential || "";
  document.getElementById("modal-scheme-status").value = item.status || "idea";
  document.getElementById("modal-scheme-notes").value = item.notes || "";
  modal.classList.add("active");
}

function cycleSchemeStatus(id) {
  const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
  const item = list.find((s) => s.id === id);
  if (item) {
    if (item.status === "idea") item.status = "in_progress";
    else if (item.status === "in_progress") item.status = "launched";
    else item.status = "idea";

    saveStored(STORAGE_KEYS.SCHEMES, list);
    renderSchemes();
  }
}

function renderSchemes() {
  const container = document.getElementById("schemes-items-list");
  if (!container) return;
  const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);

  const totalBadge = document.getElementById("schemes-total-count");
  if (totalBadge) totalBadge.textContent = `${list.length} тем`;

  let filtered = list;
  if (currentSchemeFilter !== "all") {
    filtered = list.filter((s) => s.status === currentSchemeFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">Темки не найдены. Запишите новую идею! 💡</div>`;
    return;
  }

  const statusMap = {
    idea: { label: "💡 В идеях", class: "status-idea" },
    in_progress: { label: "⚙️ В работе", class: "status-in_progress" },
    launched: { label: "🚀 Запущено", class: "status-launched" },
  };

  container.innerHTML = filtered
    .map((s) => {
      const st = statusMap[s.status] || statusMap.idea;
      return `
      <div class="scheme-card">
        <div class="scheme-header-row">
          <span class="scheme-title-text">${escapeHtml(s.title)}</span>
          <span class="scheme-status-pill ${st.class}" onclick="cycleSchemeStatus('${s.id}')" title="Нажмите для смены статуса">${st.label}</span>
        </div>
        ${s.notes ? `<div class="scheme-details">${escapeHtml(s.notes)}</div>` : ""}
        <div class="scheme-footer-row">
          <span class="scheme-potential-tag">Цель: ${escapeHtml(s.potential)}</span>
          <button class="btn-card-edit" onclick="openEditSchemeModal('${s.id}')">✏️ Настроить</button>
        </div>
      </div>
    `;
    })
    .join("");
}

// ================= ARCHIVE =================
function renderArchive() {
  const archiveContainer = document.getElementById("archive-tasks-list");
  if (!archiveContainer) return;
  const archive = getStored(STORAGE_KEYS.ARCHIVE, []);
  const activeDone = getStored(STORAGE_KEYS.TASKS, []).filter((t) => t.done);
  const combined = [...activeDone, ...archive];

  if (combined.length === 0) {
    archiveContainer.innerHTML = `<div class="empty-state">Нет выполненных дел в архиве</div>`;
    return;
  }

  const grouped = {};
  combined.forEach((t) => {
    const d = t.doneDate || t.createdAt || "Ранее";
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(t);
  });

  const dates = Object.keys(grouped).sort().reverse();

  archiveContainer.innerHTML = dates
    .map(
      (d) => `
    <div class="archive-date-group">
      <div class="archive-date-title">${d}</div>
      <div class="items-list">
        ${grouped[d]
          .map(
            (t) => `
          <div class="task-item done">
            <div class="custom-checkbox">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="task-text">${escapeHtml(t.text)}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `,
    )
    .join("");
}

// ================= RENDER ALL =================
function renderAll() {
  renderTasks();
  renderSmartNotes();
  renderCarHub();
  renderSchemes();
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
