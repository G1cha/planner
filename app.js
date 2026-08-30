// ============================================================
// APP LOGIC & LOCAL PERSISTENCE
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

const DEFAULT_SMART_NOTES = [];
const DEFAULT_CAR_LOGS = [];
const DEFAULT_SCHEMES = [];

let currentNotesTab = "pinned";
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
    return JSON.parse(localStorage.getItem(key)) || def;
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
  const tabBtns = document.querySelectorAll(".bottom-tabbar .tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");
      if (targetId === "tab-schemes") renderSchemes();
      else if (targetId === "tab-archive") renderArchive();
    });
  });

  const notesCategoryBtns = document.querySelectorAll(
    "#notes-category-control .seg-btn",
  );
  notesCategoryBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      notesCategoryBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentNotesTab = btn.getAttribute("data-notes-tab");
      document.getElementById("notes-pinned-container").style.display =
        currentNotesTab === "pinned" ? "block" : "none";
      document.getElementById("notes-car-container").style.display =
        currentNotesTab === "car" ? "block" : "none";
      if (currentNotesTab === "car") renderCarHub();
      else renderSmartNotes();
    });
  });

  document.getElementById("btn-export-data")?.addEventListener("click", () => {
    const dump = {
      tasks: getStored(STORAGE_KEYS.TASKS, []),
      archive: getStored(STORAGE_KEYS.ARCHIVE, []),
      smartNotes: getStored(STORAGE_KEYS.SMART_NOTES, []),
      carOil: getStored(STORAGE_KEYS.CAR_OIL, ""),
      carLogs: getStored(STORAGE_KEYS.CAR_LOGS, []),
      schemes: getStored(STORAGE_KEYS.SCHEMES, []),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `backup_${getIsoDateString(new Date())}.json`;
    a.click();
  });
}

// ================= TASKS =================
function initTasks() {
  const input = document.getElementById("task-input");
  const addBtn = document.getElementById("btn-add-task");
  const addTask = () => {
    const text = input.value.trim();
    if (!text) return;
    const tasks = getStored(STORAGE_KEYS.TASKS, []);
    tasks.unshift({
      id: "t_" + Date.now(),
      text,
      done: false,
      createdAt: getIsoDateString(new Date()),
      doneDate: null,
    });
    saveStored(STORAGE_KEYS.TASKS, tasks);
    input.value = "";
    renderTasks();
  };
  addBtn?.addEventListener("click", addTask);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });
}

window.toggleTask = function (id) {
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  const item = tasks.find((t) => t.id === id);
  if (item) {
    item.done = !item.done;
    item.doneDate = item.done ? getIsoDateString(new Date()) : null;
    saveStored(STORAGE_KEYS.TASKS, tasks);
    renderTasks();
  }
};

window.deleteTask = function (id) {
  let tasks = getStored(STORAGE_KEYS.TASKS, []);
  saveStored(
    STORAGE_KEYS.TASKS,
    tasks.filter((t) => t.id !== id),
  );
  renderTasks();
};

window.moveTask = function (index, direction) {
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  if (direction === -1 && index > 0)
    [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
  else if (direction === 1 && index < tasks.length - 1)
    [tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]];
  saveStored(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
};

function renderTasks() {
  const container = document.getElementById("tasks-list");
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  if (!tasks.length) {
    container.innerHTML = `<div class="empty-state">Нет активных задач</div>`;
    return;
  }

  container.innerHTML = tasks
    .map(
      (t, index) => `
    <div class="task-item ${t.done ? "done" : ""}">
      <div class="custom-checkbox" onclick="toggleTask('${t.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="task-text">${escapeHtml(t.text)}</div>
      <div class="task-reorder-controls">
        <button class="task-move-btn" onclick="moveTask(${index}, -1)" ${index === 0 ? "disabled" : ""}>▲</button>
        <button class="task-move-btn" onclick="moveTask(${index}, 1)" ${index === tasks.length - 1 ? "disabled" : ""}>▼</button>
      </div>
      <button class="task-del-btn" onclick="deleteTask('${t.id}')">✕</button>
    </div>
  `,
    )
    .join("");
}

// ================= SMART NOTES =================
function initSmartNotes() {
  const modal = document.getElementById("smart-note-modal");
  document
    .getElementById("btn-add-smart-note")
    ?.addEventListener("click", () => {
      editingSmartNoteId = null;
      document.getElementById("smart-note-modal-title").textContent =
        "Новая карточка";
      document.getElementById("sn-modal-icon").value = "📌";
      document.getElementById("sn-modal-color").value = "badge-purple";
      document.getElementById("sn-modal-title").value = "";
      document.getElementById("sn-modal-badge").value = "";
      document.getElementById("sn-modal-rich-content").innerHTML = "";
      document.getElementById("btn-delete-smart-note").style.display = "none";
      modal.classList.add("active");
    });

  document.querySelectorAll(".modal-toolbar .toolbar-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute("data-cmd-modal");
      const editor = document.getElementById("sn-modal-rich-content");
      editor.focus();
      cmd === "hilite"
        ? document.execCommand("hiliteColor", false, "#8e54e9")
        : document.execCommand(cmd, false, null);
    });
  });

  document
    .getElementById("btn-close-sn-modal")
    ?.addEventListener("click", () => modal.classList.remove("active"));

  document
    .getElementById("btn-save-smart-note")
    ?.addEventListener("click", () => {
      const title = document.getElementById("sn-modal-title").value.trim();
      if (!title) return alert("Введите заголовок");
      const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
      const data = {
        icon: document.getElementById("sn-modal-icon").value || "📌",
        badgeClass: document.getElementById("sn-modal-color").value,
        title,
        badge: document.getElementById("sn-modal-badge").value.trim(),
        content: document.getElementById("sn-modal-rich-content").innerHTML,
      };
      if (editingSmartNoteId) {
        Object.assign(
          notes.find((n) => n.id === editingSmartNoteId),
          data,
        );
      } else {
        notes.push({ id: "sn_" + Date.now(), ...data });
      }
      saveStored(STORAGE_KEYS.SMART_NOTES, notes);
      modal.classList.remove("active");
      renderSmartNotes();
    });

  document
    .getElementById("btn-delete-smart-note")
    ?.addEventListener("click", () => {
      if (confirm("Удалить карточку?")) {
        saveStored(
          STORAGE_KEYS.SMART_NOTES,
          getStored(STORAGE_KEYS.SMART_NOTES, []).filter(
            (n) => n.id !== editingSmartNoteId,
          ),
        );
        modal.classList.remove("active");
        renderSmartNotes();
      }
    });
}

window.openEditSmartNote = function (id) {
  editingSmartNoteId = id;
  const item = getStored(STORAGE_KEYS.SMART_NOTES, []).find((n) => n.id === id);
  if (!item) return;
  document.getElementById("smart-note-modal-title").textContent =
    "Редактирование";
  document.getElementById("sn-modal-icon").value = item.icon || "📌";
  document.getElementById("sn-modal-color").value =
    item.badgeClass || "badge-purple";
  document.getElementById("sn-modal-title").value = item.title;
  document.getElementById("sn-modal-badge").value = item.badge || "";
  document.getElementById("sn-modal-rich-content").innerHTML =
    item.content || "";
  document.getElementById("btn-delete-smart-note").style.display = "block";
  document.getElementById("smart-note-modal").classList.add("active");
};

function renderSmartNotes() {
  const notes = getStored(STORAGE_KEYS.SMART_NOTES, []);
  document.getElementById("pinned-notes-list").innerHTML = notes
    .map(
      (n) => `
    <div class="card smart-card">
      <div class="smart-card-header">
        <div class="smart-card-title-wrap"><span>${n.icon}</span><span>${escapeHtml(n.title)}</span></div>
        ${n.badge ? `<span class="smart-card-badge ${n.badgeClass}">${escapeHtml(n.badge)}</span>` : ""}
      </div>
      <div class="smart-card-body">${n.content || ""}</div>
      <div class="smart-card-actions"><button class="btn-text" onclick="openEditSmartNote('${n.id}')">Изменить</button></div>
    </div>
  `,
    )
    .join("");
}

// ================= CAR HUB =================
function initCarHub() {
  const modal = document.getElementById("car-oil-modal");
  document
    .getElementById("btn-edit-oil-status")
    ?.addEventListener("click", () => {
      document.getElementById("modal-car-oil-input").value = getStored(
        STORAGE_KEYS.CAR_OIL,
        "",
      );
      modal.classList.add("active");
    });
  document
    .getElementById("btn-close-oil-modal")
    ?.addEventListener("click", () => modal.classList.remove("active"));
  document
    .getElementById("btn-save-oil-modal")
    ?.addEventListener("click", () => {
      saveStored(
        STORAGE_KEYS.CAR_OIL,
        document.getElementById("modal-car-oil-input").value.trim(),
      );
      modal.classList.remove("active");
      renderCarHub();
    });

  document.getElementById("btn-add-car-log")?.addEventListener("click", () => {
    const mileage = document.getElementById("car-log-mileage").value.trim();
    const works = document.getElementById("car-log-works").value.trim();
    if (!mileage || !works) return alert("Заполните пробег и работы");

    const logs = getStored(STORAGE_KEYS.CAR_LOGS, []);
    logs.unshift({
      id: "c_" + Date.now(),
      mileage,
      date: document.getElementById("car-log-date").value,
      works,
    });
    saveStored(STORAGE_KEYS.CAR_LOGS, logs);

    document.getElementById("car-log-mileage").value = "";
    document.getElementById("car-log-works").value = "";
    renderCarHub();
  });
}

window.deleteCarLog = function (id) {
  saveStored(
    STORAGE_KEYS.CAR_LOGS,
    getStored(STORAGE_KEYS.CAR_LOGS, []).filter((l) => l.id !== id),
  );
  renderCarHub();
};

function renderCarHub() {
  document.getElementById("car-oil-target-km").textContent = getStored(
    STORAGE_KEYS.CAR_OIL,
    "Не указано",
  );
  const logs = getStored(STORAGE_KEYS.CAR_LOGS, []);
  const container = document.getElementById("car-maintenance-list");
  if (!logs.length)
    return (container.innerHTML = `<div class="empty-state">Нет записей</div>`);

  container.innerHTML = logs
    .map(
      (l) => `
    <div class="card">
      <div class="car-log-header">
        <strong>${escapeHtml(l.mileage)}</strong>
        <div style="display:flex; gap:12px; align-items:center; color:var(--text-muted); font-size:13px;">
          ${l.date} <button class="btn-text text-danger" onclick="deleteCarLog('${l.id}')">✕</button>
        </div>
      </div>
      <div class="car-log-works">${escapeHtml(l.works)}</div>
    </div>
  `,
    )
    .join("");
}

// ================= SCHEMES =================
function initSchemes() {
  document.getElementById("btn-add-scheme")?.addEventListener("click", () => {
    const title = document.getElementById("scheme-title").value.trim();
    if (!title) return alert("Введите название");
    const list = getStored(STORAGE_KEYS.SCHEMES, []);
    list.unshift({
      id: "s_" + Date.now(),
      title,
      status: "idea",
      potential:
        document.getElementById("scheme-potential").value.trim() || "-",
      notes: document.getElementById("scheme-notes").value.trim(),
    });
    saveStored(STORAGE_KEYS.SCHEMES, list);
    document.getElementById("scheme-title").value = "";
    document.getElementById("scheme-potential").value = "";
    document.getElementById("scheme-notes").value = "";
    renderSchemes();
  });

  const pills = document.querySelectorAll(".week-pill");
  pills.forEach((btn) =>
    btn.addEventListener("click", () => {
      pills.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentSchemeFilter = btn.getAttribute("data-scheme-filter");
      renderSchemes();
    }),
  );

  const modal = document.getElementById("scheme-modal");
  document
    .getElementById("btn-close-scheme-modal")
    ?.addEventListener("click", () => modal.classList.remove("active"));
  document
    .getElementById("btn-save-scheme-modal")
    ?.addEventListener("click", () => {
      const list = getStored(STORAGE_KEYS.SCHEMES, []);
      const item = list.find((s) => s.id === editingSchemeId);
      if (item) {
        item.title = document.getElementById("modal-scheme-title").value.trim();
        item.potential = document
          .getElementById("modal-scheme-potential")
          .value.trim();
        item.status = document.getElementById("modal-scheme-status").value;
        item.notes = document.getElementById("modal-scheme-notes").value.trim();
        saveStored(STORAGE_KEYS.SCHEMES, list);
        renderSchemes();
      }
      modal.classList.remove("active");
    });

  document
    .getElementById("btn-delete-scheme-modal")
    ?.addEventListener("click", () => {
      saveStored(
        STORAGE_KEYS.SCHEMES,
        getStored(STORAGE_KEYS.SCHEMES, []).filter(
          (s) => s.id !== editingSchemeId,
        ),
      );
      modal.classList.remove("active");
      renderSchemes();
    });
}

window.openEditSchemeModal = function (id) {
  editingSchemeId = id;
  const item = getStored(STORAGE_KEYS.SCHEMES, []).find((s) => s.id === id);
  if (!item) return;
  document.getElementById("modal-scheme-title").value = item.title;
  document.getElementById("modal-scheme-potential").value =
    item.potential || "";
  document.getElementById("modal-scheme-status").value = item.status || "idea";
  document.getElementById("modal-scheme-notes").value = item.notes || "";
  document.getElementById("scheme-modal").classList.add("active");
};

window.cycleSchemeStatus = function (id) {
  const list = getStored(STORAGE_KEYS.SCHEMES, []);
  const item = list.find((s) => s.id === id);
  if (item) {
    item.status =
      item.status === "idea"
        ? "in_progress"
        : item.status === "in_progress"
          ? "launched"
          : "idea";
    saveStored(STORAGE_KEYS.SCHEMES, list);
    renderSchemes();
  }
};

function renderSchemes() {
  const list = getStored(STORAGE_KEYS.SCHEMES, []);
  document.getElementById("schemes-total-count").textContent = list.length;
  const filtered =
    currentSchemeFilter === "all"
      ? list
      : list.filter((s) => s.status === currentSchemeFilter);
  const container = document.getElementById("schemes-items-list");
  if (!filtered.length)
    return (container.innerHTML = `<div class="empty-state">Нет записей</div>`);

  const statusMap = {
    idea: { label: "Идея", class: "status-idea" },
    in_progress: { label: "В работе", class: "status-in_progress" },
    launched: { label: "Запущено", class: "status-launched" },
  };

  container.innerHTML = filtered
    .map((s) => {
      const st = statusMap[s.status] || statusMap.idea;
      return `
      <div class="card">
        <div class="scheme-header-row">
          <span class="scheme-title-text">${escapeHtml(s.title)}</span>
          <span class="status-pill ${st.class}" onclick="cycleSchemeStatus('${s.id}')">${st.label}</span>
        </div>
        ${s.notes ? `<div class="scheme-details">${escapeHtml(s.notes)}</div>` : ""}
        <div class="scheme-footer-row">
          <span style="font-size:13px; color:var(--text-main);">Цель: ${escapeHtml(s.potential)}</span>
          <button class="btn-text" onclick="openEditSchemeModal('${s.id}')">Изменить</button>
        </div>
      </div>
    `;
    })
    .join("");
}

// ================= ARCHIVE =================
function renderArchive() {
  const archive = getStored(STORAGE_KEYS.ARCHIVE, []);
  const activeDone = getStored(STORAGE_KEYS.TASKS, []).filter((t) => t.done);
  const combined = [...activeDone, ...archive];
  const container = document.getElementById("archive-tasks-list");

  if (!combined.length)
    return (container.innerHTML = `<div class="empty-state">Архив пуст</div>`);

  const grouped = {};
  combined.forEach((t) => {
    const d = t.doneDate || t.createdAt || "Ранее";
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(t);
  });

  container.innerHTML = Object.keys(grouped)
    .sort()
    .reverse()
    .map(
      (d) => `
    <div class="archive-date-group">
      <div class="archive-date-title">${d}</div>
      <div class="items-list">
        ${grouped[d]
          .map(
            (t) => `
          <div class="task-item done">
            <div class="custom-checkbox" style="background:var(--bg-input); border-color:transparent;"><svg style="display:block; stroke:var(--text-muted);" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
            <div class="task-text" style="color:var(--text-muted);">${escapeHtml(t.text)}</div>
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

function renderAll() {
  renderTasks();
  renderSmartNotes();
  renderCarHub();
  renderSchemes();
}
function escapeHtml(str) {
  return str
    ? str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
    : "";
}
