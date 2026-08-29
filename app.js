// ============================================================
// APP LOGIC & LOCAL PERSISTENCE (V7 PRO - CAR & RICH NOTES)
// ============================================================

const STORAGE_KEYS = {
  TASKS: 'pwa_tasks_v7',
  TWELVE_GOAL: 'pwa_twelve_goal_v7',
  TWELVE_TASKS: 'pwa_twelve_tasks_v7',
  ARCHIVE: 'pwa_archive_v7',
  INCOMES: 'pwa_incomes_v7',
  MONTHLY_EXPENSE_TOTAL: 'pwa_monthly_expense_total_v7',
  FIXED_EXPENSES: 'pwa_fixed_expenses_v7',
  NOTES: 'pwa_notes_v7',
  SMART_NOTES: 'pwa_smart_notes_v7',
  CAR_OIL: 'pwa_car_oil_v7',
  CAR_LOGS: 'pwa_car_logs_v7',
  SCHEMES: 'pwa_schemes_v7',
  WISHLIST: 'pwa_wishlist_v7',
  LAST_DATE: 'pwa_last_login_date'
};

// Initial Smart Notes (БАЗА ЗНАНИЙ - БЕЗ ТАЧКИ, ТАК КАК ОНА ТЕПЕРЬ В СВОЕМ РАЗДЕЛЕ!)
const DEFAULT_SMART_NOTES = [
  {
    id: 'note_gostraight',
    icon: '⭐️',
    title: 'GÖ STRAIGHT — Дедлайны',
    badge: 'Сентябрь',
    badgeClass: 'badge-orange',
    content: `• <b>14 сентября:</b> забрать вклад ФинУслуги (100к), перекинуть в ликвидность (LQDT)<br>• <b>15 сентября:</b> подать на увольнение<br>• <b>16 сентября:</b> купить зимнюю резину`
  },
  {
    id: 'note_health',
    icon: '⚡️',
    title: '2DAŸZ — Здоровье & Тело',
    badge: 'Режим',
    badgeClass: 'badge-green',
    content: `<b>Больная спина и осанка:</b><br>• ДЕРЖАТЬ ОСАНКУ<br>• Турник по 1 минуте (после умывания, перед/после смены, перед сном)<br>• Отжимания: раз в день на максимум<br><br><b>Привычки & Питание:</b><br>• С 1-го сентября: новый курс витаминов<br>• Не обжираться на работе<br>• Полностью исключить энергетики<br>• Когда закончится жижа — на сигареты, кьюб выкинуть<br>• С 1-го октября: полностью бросить курить<br><br><b>На выходных после работы:</b><br>• Выписать в заметках все хотелки (от глобальных до мелочей)<br>• Выписать все источники дохода и статьи расходов`
  },
  {
    id: 'note_invest',
    icon: '💵',
    title: 'Инвестор — Правила',
    badge: 'Стратегия 5 лет',
    badgeClass: 'badge-green',
    content: `• <b>Акции (Яндекс, Лукойл, Сбер):</b> откладывать 10% от ЗП на протяжении ближайших 5 лет + реинвестировать 100% дивидендов обратно в акции.<br>• <b>Ликвидность:</b> откладывать 8% от абсолютно любой прибыли в фонд LQDT.`
  }
];

// Initial Car Logs (Журнал ТО KIA RIO)
const DEFAULT_CAR_LOGS = [
  {
    id: 'car_3',
    mileage: '209к',
    date: '2026-08-15',
    works: '• Ремонт фишки моторчика дворников'
  },
  {
    id: 'car_2',
    mileage: '206к',
    date: '2026-07-20',
    works: '• Ремонт моторчика дворников (проводка)\n• Замена всех задних лампочек\n• Полировка передних фар'
  },
  {
    id: 'car_1',
    mileage: '205к',
    date: '2026-06-10',
    works: '• Замена масла и фильтров\n• Замена задней правой ступицы\n• Замена задних тормозов'
  }
];

// Initial Fixed Obligations
const DEFAULT_FIXED_EXPENSES = [
  {
    id: 'fix_1',
    name: 'Фикса за жилье (аренда + коммуналка)',
    amount: 26000
  },
  {
    id: 'fix_2',
    name: 'Мобильная связь (Yota)',
    amount: 500
  }
];

// Initial Schemes
const DEFAULT_SCHEMES = [
  {
    id: 'scheme_1',
    title: 'Купить электровелик и сдавать в аренду',
    potential: '20 000 ₽ / мес',
    status: 'idea',
    notes: 'Купить Minako / колхозник, батарею 60V. Сдавать по договору посуточно курьерам.'
  },
  {
    id: 'scheme_2',
    title: 'Купить гараж и сдавать под склад / авто',
    potential: '8 000 ₽ / мес',
    status: 'idea',
    notes: 'Найти сухой кооперативный гараж в спальнике. Сдавать под хранение шин и мототехники.'
  },
  {
    id: 'scheme_3',
    title: 'Устроиться на удаленку (IT / саппорт)',
    potential: '80 000 ₽ / мес',
    status: 'in_progress',
    notes: 'Упаковать кейсы по сайтам и ботам. Отправлять отклики.'
  }
];

// Initial Wishlist
const DEFAULT_WISHLIST = [
  {
    id: 'wish_1',
    title: 'Своя квартира (покупка / взнос)',
    price: 3500000,
    tag: '🎯 Глобальное',
    bought: false
  },
  {
    id: 'wish_2',
    title: 'Диски и зимняя резина на тачку',
    price: 65000,
    tag: '🚗 Авто',
    bought: false
  },
  {
    id: 'wish_3',
    title: 'MacBook Pro для работы',
    price: 180000,
    tag: '💻 Техника',
    bought: false
  }
];

// State
let currentPeriod = 'day'; // 'day' | '12weeks'
let currentNotesTab = 'pinned'; // 'pinned' | 'quick' | 'car'
let selectedTwelveWeek = 1;
let currentAnalyticsMonth = getYearMonthString(new Date());
let currentWishFilter = 'all';
let currentSchemeFilter = 'all';

let editingSmartNoteId = null;
let editingSchemeId = null;

document.addEventListener('DOMContentLoaded', () => {
  initDefaults();
  initDate();
  checkMidnightArchiving();
  initNavigation();
  initDayTasks();
  initTwelveWeeks();
  initIncomes();
  initRichNotesEditor();
  initSmartNotes();
  initCarHub();
  initSchemes();
  initWishlist();
  initDeltaAnalytics();
  renderAll();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW reg error:', err));
  }
});

function initDefaults() {
  if (!localStorage.getItem(STORAGE_KEYS.SMART_NOTES)) saveStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
  if (!localStorage.getItem(STORAGE_KEYS.CAR_OIL)) saveStored(STORAGE_KEYS.CAR_OIL, '212 000 км');
  if (!localStorage.getItem(STORAGE_KEYS.CAR_LOGS)) saveStored(STORAGE_KEYS.CAR_LOGS, DEFAULT_CAR_LOGS);
  if (!localStorage.getItem(STORAGE_KEYS.FIXED_EXPENSES)) saveStored(STORAGE_KEYS.FIXED_EXPENSES, DEFAULT_FIXED_EXPENSES);
  if (!localStorage.getItem(STORAGE_KEYS.SCHEMES)) saveStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
  if (!localStorage.getItem(STORAGE_KEYS.WISHLIST)) saveStored(STORAGE_KEYS.WISHLIST, DEFAULT_WISHLIST);
}

function getIsoDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function getYearMonthString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function initDate() {
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const str = new Date().toLocaleDateString('ru-RU', options);
  const curDateEl = document.getElementById('current-date-text');
  if (curDateEl) curDateEl.textContent = str.charAt(0).toUpperCase() + str.slice(1);
  
  const incDateEl = document.getElementById('income-date');
  if (incDateEl) incDateEl.value = getIsoDateString(new Date());

  const carDateEl = document.getElementById('car-log-date');
  if (carDateEl) carDateEl.value = getIsoDateString(new Date());
  
  const anMonthEl = document.getElementById('analytics-month-select');
  if (anMonthEl) anMonthEl.value = currentAnalyticsMonth;
}

function getStored(key, def) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : def;
  } catch(e) {
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

  tasks.forEach(t => {
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
  // Main 5-tabbar
  const tabBtns = document.querySelectorAll('.bottom-tabbar .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');

      if (targetId === 'tab-analytics') renderAnalytics();
      else if (targetId === 'tab-wishlist') renderWishlist();
      else if (targetId === 'tab-schemes') renderSchemes();
      else if (targetId === 'tab-income') renderIncomesScreen();
    });
  });

  // Analytics subtabs
  const subnavBtns = document.querySelectorAll('.subnav-btn');
  subnavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subnavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const subId = btn.getAttribute('data-subtab');
      const finPane = document.getElementById('subtab-fin-analytics');
      const archivePane = document.getElementById('subtab-tasks-archive');

      if (subId === 'fin-analytics') {
        finPane.style.display = 'block';
        finPane.classList.add('active');
        archivePane.style.display = 'none';
        archivePane.classList.remove('active');
        renderAnalytics();
      } else {
        finPane.style.display = 'none';
        finPane.classList.remove('active');
        archivePane.style.display = 'block';
        archivePane.classList.add('active');
        renderArchive();
      }
    });
  });

  // 1. ISOLATED TASKS PERIOD SWITCHER (#tasks-period-control)
  const taskPeriodBtns = document.querySelectorAll('#tasks-period-control .seg-btn');
  taskPeriodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      taskPeriodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.getAttribute('data-period');
      
      const dayContainer = document.getElementById('day-tasks-container');
      const twelveContainer = document.getElementById('twelve-weeks-container');

      if (currentPeriod === 'day') {
        dayContainer.style.display = 'block';
        twelveContainer.style.display = 'none';
        renderDayTasks();
      } else {
        dayContainer.style.display = 'none';
        twelveContainer.style.display = 'block';
        renderTwelveWeeks();
      }
    });
  });

  // 2. ISOLATED 3-WAY NOTES SWITCHER (#notes-category-control: База | Мысли | Тачка)
  // BUG FIX: Strictly does not touch tasks section!
  const notesCategoryBtns = document.querySelectorAll('#notes-category-control .seg-btn');
  notesCategoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      notesCategoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentNotesTab = btn.getAttribute('data-notes-tab');
      
      const pinnedC = document.getElementById('notes-pinned-container');
      const quickC = document.getElementById('notes-quick-container');
      const carC = document.getElementById('notes-car-container');

      pinnedC.style.display = (currentNotesTab === 'pinned') ? 'block' : 'none';
      quickC.style.display = (currentNotesTab === 'quick') ? 'block' : 'none';
      carC.style.display = (currentNotesTab === 'car') ? 'block' : 'none';

      if (currentNotesTab === 'car') renderCarHub();
      else if (currentNotesTab === 'pinned') renderSmartNotes();
      else if (currentNotesTab === 'quick') renderNotes();
    });
  });

  // Analytics month selector
  const anMonthSelect = document.getElementById('analytics-month-select');
  if (anMonthSelect) {
    anMonthSelect.addEventListener('change', (e) => {
      currentAnalyticsMonth = e.target.value;
      renderAnalytics();
    });
  }

  // Export JSON Backup
  const exportBtn = document.getElementById('btn-export-data');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dump = {
        tasks: getStored(STORAGE_KEYS.TASKS, []),
        twelveGoal: getStored(STORAGE_KEYS.TWELVE_GOAL, ''),
        twelveTasks: getStored(STORAGE_KEYS.TWELVE_TASKS, []),
        archive: getStored(STORAGE_KEYS.ARCHIVE, []),
        incomes: getStored(STORAGE_KEYS.INCOMES, []),
        monthlyExpenseTotal: getStored(STORAGE_KEYS.MONTHLY_EXPENSE_TOTAL, {}),
        fixedExpenses: getStored(STORAGE_KEYS.FIXED_EXPENSES, []),
        notes: getStored(STORAGE_KEYS.NOTES, []),
        smartNotes: getStored(STORAGE_KEYS.SMART_NOTES, []),
        carOil: getStored(STORAGE_KEYS.CAR_OIL, '212 000 км'),
        carLogs: getStored(STORAGE_KEYS.CAR_LOGS, []),
        schemes: getStored(STORAGE_KEYS.SCHEMES, []),
        wishlist: getStored(STORAGE_KEYS.WISHLIST, []),
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planner_backup_${getIsoDateString(new Date())}.json`;
      a.click();
    });
  }
}

// ================= 1. DAY TASKS =================
function initDayTasks() {
  const input = document.getElementById('task-input');
  const addBtn = document.getElementById('btn-add-task');
  if (!input || !addBtn) return;

  const addTask = () => {
    const text = input.value.trim();
    if (!text) return;

    const tasks = getStored(STORAGE_KEYS.TASKS, []);
    tasks.unshift({
      id: 'task_' + Date.now(),
      text: text,
      done: false,
      createdAt: getIsoDateString(new Date()),
      doneDate: null
    });
    saveStored(STORAGE_KEYS.TASKS, tasks);
    input.value = '';
    renderDayTasks();
  };

  addBtn.addEventListener('click', addTask);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
}

function toggleDayTask(id) {
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  const todayStr = getIsoDateString(new Date());
  const item = tasks.find(t => t.id === id);
  if (item) {
    item.done = !item.done;
    item.doneDate = item.done ? todayStr : null;
    saveStored(STORAGE_KEYS.TASKS, tasks);
    renderDayTasks();
  }
}

function deleteDayTask(id) {
  let tasks = getStored(STORAGE_KEYS.TASKS, []);
  tasks = tasks.filter(t => t.id !== id);
  saveStored(STORAGE_KEYS.TASKS, tasks);
  renderDayTasks();
}

function renderDayTasks() {
  const container = document.getElementById('tasks-list');
  if (!container) return;
  const tasks = getStored(STORAGE_KEYS.TASKS, []);

  if (tasks.length === 0) {
    container.innerHTML = `<div class="empty-state">Нет запланированных дел на сегодня ✨</div>`;
    return;
  }

  container.innerHTML = tasks.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}">
      <div class="custom-checkbox" onclick="toggleDayTask('${t.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="task-text">${escapeHtml(t.text)}</div>
      <button class="task-del-btn" onclick="deleteDayTask('${t.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `).join('');
}

// ================= 2. 12 WEEKS SYSTEM =================
function initTwelveWeeks() {
  const goalTextarea = document.getElementById('twelve-weeks-goal');
  const saveGoalBtn = document.getElementById('btn-save-goal');
  const taskInput = document.getElementById('twelve-week-task-input');
  const addTaskBtn = document.getElementById('btn-add-twelve-task');
  if (!goalTextarea || !saveGoalBtn || !taskInput || !addTaskBtn) return;

  goalTextarea.value = getStored(STORAGE_KEYS.TWELVE_GOAL, '');

  saveGoalBtn.addEventListener('click', () => {
    saveStored(STORAGE_KEYS.TWELVE_GOAL, goalTextarea.value.trim());
    saveGoalBtn.textContent = 'Сохранено!';
    setTimeout(() => { saveGoalBtn.textContent = 'Сохранить'; }, 1500);
  });

  const addTwelveTask = () => {
    const text = taskInput.value.trim();
    if (!text) return;

    const allTasks = getStored(STORAGE_KEYS.TWELVE_TASKS, []);
    allTasks.push({
      id: 'tw_' + Date.now(),
      week: selectedTwelveWeek,
      text: text,
      done: false
    });
    saveStored(STORAGE_KEYS.TWELVE_TASKS, allTasks);
    taskInput.value = '';
    renderTwelveWeeks();
  };

  addTaskBtn.addEventListener('click', addTwelveTask);
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTwelveTask();
  });
}

function selectTwelveWeek(weekNum) {
  selectedTwelveWeek = weekNum;
  renderTwelveWeeks();
}

function toggleTwelveTask(id) {
  const tasks = getStored(STORAGE_KEYS.TWELVE_TASKS, []);
  const item = tasks.find(t => t.id === id);
  if (item) {
    item.done = !item.done;
    saveStored(STORAGE_KEYS.TWELVE_TASKS, tasks);
    renderTwelveWeeks();
  }
}

function deleteTwelveTask(id) {
  let tasks = getStored(STORAGE_KEYS.TWELVE_TASKS, []);
  tasks = tasks.filter(t => t.id !== id);
  saveStored(STORAGE_KEYS.TWELVE_TASKS, tasks);
  renderTwelveWeeks();
}

function renderTwelveWeeks() {
  const pillsContainer = document.getElementById('weeks-pills');
  if (!pillsContainer) return;
  let pillsHtml = '';
  for (let w = 1; w <= 12; w++) {
    pillsHtml += `<button class="week-pill ${w === selectedTwelveWeek ? 'active' : ''}" onclick="selectTwelveWeek(${w})">Неделя ${w}</button>`;
  }
  pillsContainer.innerHTML = pillsHtml;

  const titleEl = document.getElementById('selected-week-title');
  if (titleEl) titleEl.textContent = `Неделя ${selectedTwelveWeek}: Шаги и задачи`;

  const allTwelveTasks = getStored(STORAGE_KEYS.TWELVE_TASKS, []);
  const weekTasks = allTwelveTasks.filter(t => t.week === selectedTwelveWeek);
  const doneCount = weekTasks.filter(t => t.done).length;
  const badgeEl = document.getElementById('week-progress-badge');
  if (badgeEl) badgeEl.textContent = `${doneCount}/${weekTasks.length} выполнено`;

  const container = document.getElementById('twelve-weeks-tasks-list');
  if (!container) return;
  if (weekTasks.length === 0) {
    container.innerHTML = `<div class="empty-state">Нет шагов для Недели ${selectedTwelveWeek}. Добавьте первое действие! 🚀</div>`;
    return;
  }

  container.innerHTML = weekTasks.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}">
      <div class="custom-checkbox" onclick="toggleTwelveTask('${t.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="task-text">${escapeHtml(t.text)}</div>
      <button class="task-del-btn" onclick="deleteTwelveTask('${t.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `).join('');
}

// ================= 3. SMART NOTES (БАЗА ЗНАНИЙ) С iOS-ФОРМАТИРОВАНИЕМ =================
function initSmartNotes() {
  const modal = document.getElementById('smart-note-modal');
  const addBtn = document.getElementById('btn-add-smart-note');
  const closeBtn = document.getElementById('btn-close-sn-modal');
  const saveBtn = document.getElementById('btn-save-smart-note');
  const deleteBtn = document.getElementById('btn-delete-smart-note');
  const modalEditor = document.getElementById('sn-modal-rich-content');
  if (!modal) return;

  // Toolbar buttons for Modal editor
  const modalToolbarBtns = document.querySelectorAll('.modal-toolbar .toolbar-btn');
  modalToolbarBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-cmd-modal');
      execRichCommand(cmd, modalEditor);
    });
  });

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      editingSmartNoteId = null;
      document.getElementById('smart-note-modal-title').textContent = 'Новая карточка базы';
      document.getElementById('sn-modal-icon').value = '📌';
      document.getElementById('sn-modal-color').value = 'badge-blue';
      document.getElementById('sn-modal-title').value = '';
      document.getElementById('sn-modal-badge').value = '';
      if (modalEditor) modalEditor.innerHTML = '';
      deleteBtn.style.display = 'none';
      modal.classList.add('active');
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const icon = document.getElementById('sn-modal-icon').value.trim() || '📌';
      const color = document.getElementById('sn-modal-color').value;
      const title = document.getElementById('sn-modal-title').value.trim();
      const badge = document.getElementById('sn-modal-badge').value.trim();
      const content = modalEditor ? modalEditor.innerHTML : '';

      if (!title) {
        alert('Укажите заголовок карточки');
        return;
      }

      const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
      if (editingSmartNoteId) {
        const item = notes.find(n => n.id === editingSmartNoteId);
        if (item) {
          item.icon = icon;
          item.badgeClass = color;
          item.title = title;
          item.badge = badge;
          item.content = content;
        }
      } else {
        notes.push({
          id: 'sn_' + Date.now(),
          icon: icon,
          badgeClass: color,
          title: title,
          badge: badge,
          content: content
        });
      }

      saveStored(STORAGE_KEYS.SMART_NOTES, notes);
      modal.classList.remove('active');
      renderSmartNotes();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!editingSmartNoteId) return;
      if (confirm('Точно удалить эту карточку из базы?')) {
        let notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
        notes = notes.filter(n => n.id !== editingSmartNoteId);
        saveStored(STORAGE_KEYS.SMART_NOTES, notes);
        modal.classList.remove('active');
        renderSmartNotes();
      }
    });
  }
}

function openEditSmartNote(id) {
  editingSmartNoteId = id;
  const modal = document.getElementById('smart-note-modal');
  const deleteBtn = document.getElementById('btn-delete-smart-note');
  const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
  const item = notes.find(n => n.id === id);
  const modalEditor = document.getElementById('sn-modal-rich-content');
  if (!item || !modal) return;

  document.getElementById('smart-note-modal-title').textContent = 'Редактировать карточку';
  document.getElementById('sn-modal-icon').value = item.icon || '📌';
  document.getElementById('sn-modal-color').value = item.badgeClass || 'badge-blue';
  document.getElementById('sn-modal-title').value = item.title;
  document.getElementById('sn-modal-badge').value = item.badge || '';
  if (modalEditor) modalEditor.innerHTML = item.content || '';
  deleteBtn.style.display = 'block';
  modal.classList.add('active');
}

function renderSmartNotes() {
  const container = document.getElementById('pinned-notes-list');
  if (!container) return;
  const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);

  container.innerHTML = notes.map(n => `
    <div class="glass-card smart-card">
      <div class="smart-card-header">
        <div class="smart-card-title-wrap">
          <span class="smart-card-icon">${n.icon}</span>
          <span class="smart-card-title">${escapeHtml(n.title)}</span>
        </div>
        ${n.badge ? `<span class="smart-card-badge ${n.badgeClass || 'badge-blue'}">${escapeHtml(n.badge)}</span>` : ''}
      </div>
      <div class="smart-card-body">
        ${n.content || ''}
      </div>
      <div class="smart-card-actions">
        <button class="btn-card-edit" onclick="openEditSmartNote('${n.id}')">✏️ Настроить / Изменить</button>
      </div>
    </div>
  `).join('');
}

// ================= 4. iOS NOTES RICH EDITOR (МЫСЛИ) =================
function initRichNotesEditor() {
  const richEditor = document.getElementById('note-rich-editor');
  const saveBtn = document.getElementById('btn-save-note');
  if (!richEditor || !saveBtn) return;

  const toolbarBtns = document.querySelectorAll('.note-input-card .toolbar-btn');
  toolbarBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-cmd');
      execRichCommand(cmd, richEditor);
    });
  });

  saveBtn.addEventListener('click', () => {
    const html = richEditor.innerHTML.trim();
    if (!html || html === '<br>') return;

    const notes = getStored(STORAGE_KEYS.NOTES, []);
    notes.unshift({
      id: 'note_' + Date.now(),
      html: html,
      date: getIsoDateString(new Date()),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    });
    saveStored(STORAGE_KEYS.NOTES, notes);
    richEditor.innerHTML = '';
    renderNotes();
  });
}

function execRichCommand(cmd, targetElement) {
  targetElement.focus();
  if (cmd === 'hilite') {
    document.execCommand('hiliteColor', false, 'rgba(245, 158, 11, 0.35)');
  } else if (cmd === 'insertHorizontalRule') {
    document.execCommand('insertHorizontalRule', false, null);
  } else {
    document.execCommand(cmd, false, null);
  }
}

function deleteNote(id) {
  let notes = getStored(STORAGE_KEYS.NOTES, []);
  notes = notes.filter(n => n.id !== id);
  saveStored(STORAGE_KEYS.NOTES, notes);
  renderNotes();
}

function renderNotes() {
  const container = document.getElementById('notes-list');
  if (!container) return;
  const notes = getStored(STORAGE_KEYS.NOTES, []);

  if (notes.length === 0) {
    container.innerHTML = `<div class="empty-state">Нет мыслей. Запишите инсайт дня выше ✍️</div>`;
    return;
  }

  container.innerHTML = notes.slice(0, 10).map(n => `
    <div class="note-item">
      <button class="note-del" onclick="deleteNote('${n.id}')">✕</button>
      <div class="note-time">${n.date} в ${n.time}</div>
      <div class="note-body">${n.html || escapeHtml(n.text || '')}</div>
    </div>
  `).join('');
}

// ================= 5. 🚗 CAR HUB (ТАЧКА & ЖУРНАЛ ТО) =================
function initCarHub() {
  // 1. Oil Status Modal
  const oilModal = document.getElementById('car-oil-modal');
  const editOilBtn = document.getElementById('btn-edit-oil-status');
  const closeOilBtn = document.getElementById('btn-close-oil-modal');
  const saveOilBtn = document.getElementById('btn-save-oil-modal');
  const oilInput = document.getElementById('modal-car-oil-input');

  if (editOilBtn && oilModal) {
    editOilBtn.addEventListener('click', () => {
      oilInput.value = getStored(STORAGE_KEYS.CAR_OIL, '212 000 км');
      oilModal.classList.add('active');
    });
  }
  if (closeOilBtn) closeOilBtn.addEventListener('click', () => oilModal.classList.remove('active'));
  if (saveOilBtn) {
    saveOilBtn.addEventListener('click', () => {
      const val = oilInput.value.trim() || '212 000 км';
      saveStored(STORAGE_KEYS.CAR_OIL, val);
      oilModal.classList.remove('active');
      renderCarHub();
    });
  }

  // 2. Add Maintenance Entry Form
  const addLogBtn = document.getElementById('btn-add-car-log');
  const mileageInput = document.getElementById('car-log-mileage');
  const dateInput = document.getElementById('car-log-date');
  const worksInput = document.getElementById('car-log-works');

  if (addLogBtn) {
    addLogBtn.addEventListener('click', () => {
      const mileage = mileageInput.value.trim();
      const dateVal = dateInput.value || getIsoDateString(new Date());
      const works = worksInput.value.trim();

      if (!mileage || !works) {
        alert('Укажите пробег и выполненные работы');
        return;
      }

      const logs = getStored(STORAGE_KEYS.CAR_LOGS, DEFAULT_CAR_LOGS);
      logs.unshift({
        id: 'car_' + Date.now(),
        mileage: mileage,
        date: dateVal,
        works: works
      });
      saveStored(STORAGE_KEYS.CAR_LOGS, logs);

      mileageInput.value = '';
      worksInput.value = '';
      renderCarHub();
    });
  }
}

function deleteCarLog(id) {
  let logs = getStored(STORAGE_KEYS.CAR_LOGS, DEFAULT_CAR_LOGS);
  logs = logs.filter(l => l.id !== id);
  saveStored(STORAGE_KEYS.CAR_LOGS, logs);
  renderCarHub();
}

function renderCarHub() {
  // Update Oil display
  const oilTarget = getStored(STORAGE_KEYS.CAR_OIL, '212 000 км');
  const oilEl = document.getElementById('car-oil-target-km');
  if (oilEl) oilEl.textContent = oilTarget;

  // Render Log List
  const container = document.getElementById('car-maintenance-list');
  if (!container) return;
  const logs = getStored(STORAGE_KEYS.CAR_LOGS, DEFAULT_CAR_LOGS);

  if (logs.length === 0) {
    container.innerHTML = `<div class="empty-state">Журнал обслуживания пуст. Добавьте первую запись выше 🚗</div>`;
    return;
  }

  container.innerHTML = logs.map(l => `
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
  `).join('');
}

// ================= 6. INCOMES SCREEN =================
function initIncomes() {
  const amountInput = document.getElementById('income-amount');
  const catInput = document.getElementById('income-category');
  const dateInput = document.getElementById('income-date');
  const descInput = document.getElementById('income-desc');
  const saveBtn = document.getElementById('btn-save-income');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    const dateVal = dateInput.value || getIsoDateString(new Date());

    if (!amount || amount <= 0) {
      alert('Укажите корректную сумму дохода');
      return;
    }

    const incomes = getStored(STORAGE_KEYS.INCOMES, []);
    incomes.unshift({
      id: 'inc_' + Date.now(),
      amount: amount,
      category: catInput.value,
      description: descInput.value.trim(),
      date: dateVal,
      timestamp: Date.now()
    });
    saveStored(STORAGE_KEYS.INCOMES, incomes);

    amountInput.value = '';
    descInput.value = '';
    renderIncomesScreen();
    renderAnalytics();
  });
}

function deleteIncomeEntry(id) {
  let incomes = getStored(STORAGE_KEYS.INCOMES, []);
  incomes = incomes.filter(i => i.id !== id);
  saveStored(STORAGE_KEYS.INCOMES, incomes);
  renderIncomesScreen();
  renderAnalytics();
}

function renderIncomesScreen() {
  const incomes = getStored(STORAGE_KEYS.INCOMES, []);
  const todayStr = getIsoDateString(new Date());
  
  const todayTotal = incomes.filter(i => i.date === todayStr).reduce((s, i) => s + i.amount, 0);
  const dispEl = document.getElementById('today-earned-display');
  if (dispEl) dispEl.textContent = `+${formatMoney(todayTotal)} ₽`;

  const sorted = [...incomes].sort((a, b) => b.date.localeCompare(a.date));

  const listContainer = document.getElementById('income-recent-list');
  if (!listContainer) return;
  if (sorted.length === 0) {
    listContainer.innerHTML = `<div class="empty-state">Нет записей о доходах. Добавьте сумму выше 💰</div>`;
    return;
  }

  listContainer.innerHTML = sorted.slice(0, 30).map(i => `
    <div class="history-item">
      <div>
        <div style="font-weight:600; font-size:14.5px;">${escapeHtml(i.category)}</div>
        <div style="font-size:12px; color:var(--text-muted);">${i.date} ${i.description ? `• ${escapeHtml(i.description)}` : ''}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="text-green font-bold" style="font-size:16px;">+${formatMoney(i.amount)} ₽</span>
        <button class="task-del-btn" onclick="deleteIncomeEntry('${i.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

// ================= 7. ТЕМКИ (SCHEMES) =================
function initSchemes() {
  const titleInput = document.getElementById('scheme-title');
  const potentialInput = document.getElementById('scheme-potential');
  const notesInput = document.getElementById('scheme-notes');
  const addBtn = document.getElementById('btn-add-scheme');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const potential = potentialInput.value.trim();
    const notes = notesInput.value.trim();

    if (!title) {
      alert('Укажите название темки');
      return;
    }

    const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
    list.unshift({
      id: 'sch_' + Date.now(),
      title: title,
      potential: potential || 'Не указан',
      status: 'idea',
      notes: notes
    });
    saveStored(STORAGE_KEYS.SCHEMES, list);

    titleInput.value = '';
    potentialInput.value = '';
    notesInput.value = '';
    renderSchemes();
  });

  const filterBtns = document.querySelectorAll('#scheme-filter-pills .week-pill');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSchemeFilter = btn.getAttribute('data-scheme-filter');
      renderSchemes();
    });
  });

  const modal = document.getElementById('scheme-modal');
  const closeBtn = document.getElementById('btn-close-scheme-modal');
  const saveBtn = document.getElementById('btn-save-scheme-modal');
  const delBtn = document.getElementById('btn-delete-scheme-modal');

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!editingSchemeId) return;
      const title = document.getElementById('modal-scheme-title').value.trim();
      const potential = document.getElementById('modal-scheme-potential').value.trim();
      const status = document.getElementById('modal-scheme-status').value;
      const notes = document.getElementById('modal-scheme-notes').value.trim();

      if (!title) {
        alert('Укажите название темки');
        return;
      }

      const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
      const item = list.find(s => s.id === editingSchemeId);
      if (item) {
        item.title = title;
        item.potential = potential;
        item.status = status;
        item.notes = notes;
        saveStored(STORAGE_KEYS.SCHEMES, list);
        renderSchemes();
      }
      modal.classList.remove('active');
    });
  }

  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (!editingSchemeId) return;
      if (confirm('Удалить эту темку?')) {
        let list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
        list = list.filter(s => s.id !== editingSchemeId);
        saveStored(STORAGE_KEYS.SCHEMES, list);
        modal.classList.remove('active');
        renderSchemes();
      }
    });
  }
}

function openEditSchemeModal(id) {
  editingSchemeId = id;
  const modal = document.getElementById('scheme-modal');
  const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
  const item = list.find(s => s.id === id);
  if (!item || !modal) return;

  document.getElementById('modal-scheme-title').value = item.title;
  document.getElementById('modal-scheme-potential').value = item.potential || '';
  document.getElementById('modal-scheme-status').value = item.status || 'idea';
  document.getElementById('modal-scheme-notes').value = item.notes || '';
  modal.classList.add('active');
}

function cycleSchemeStatus(id) {
  const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
  const item = list.find(s => s.id === id);
  if (item) {
    if (item.status === 'idea') item.status = 'in_progress';
    else if (item.status === 'in_progress') item.status = 'launched';
    else item.status = 'idea';
    
    saveStored(STORAGE_KEYS.SCHEMES, list);
    renderSchemes();
  }
}

function renderSchemes() {
  const container = document.getElementById('schemes-items-list');
  if (!container) return;
  const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);

  const totalBadge = document.getElementById('schemes-total-count');
  if (totalBadge) totalBadge.textContent = `${list.length} тем`;

  let filtered = list;
  if (currentSchemeFilter !== 'all') {
    filtered = list.filter(s => s.status === currentSchemeFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">Темки не найдены. Запишите новую идею выше 💡</div>`;
    return;
  }

  const statusMap = {
    idea: { label: '💡 В идеях', class: 'status-idea' },
    in_progress: { label: '⚙️ В работе', class: 'status-in_progress' },
    launched: { label: '🚀 Запущено', class: 'status-launched' }
  };

  container.innerHTML = filtered.map(s => {
    const st = statusMap[s.status] || statusMap.idea;
    return `
      <div class="scheme-card">
        <div class="scheme-header-row">
          <span class="scheme-title-text">${escapeHtml(s.title)}</span>
          <span class="scheme-status-pill ${st.class}" onclick="cycleSchemeStatus('${s.id}')" title="Нажмите для быстрой смены статуса">${st.label}</span>
        </div>
        ${s.notes ? `<div class="scheme-details">${escapeHtml(s.notes)}</div>` : ''}
        <div class="scheme-footer-row">
          <span class="scheme-potential-tag">💰 Потенциал: ${escapeHtml(s.potential)}</span>
          <button class="btn-card-edit" onclick="openEditSchemeModal('${s.id}')">✏️ Настроить</button>
        </div>
      </div>
    `;
  }).join('');
}

// ================= 8. WISHLIST =================
function initWishlist() {
  const titleInput = document.getElementById('wish-title');
  const priceInput = document.getElementById('wish-price');
  const tagInput = document.getElementById('wish-tag');
  const addBtn = document.getElementById('btn-add-wish');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const price = parseFloat(priceInput.value) || 0;

    if (!title) {
      alert('Укажите название хотелки');
      return;
    }

    const list = getStored(STORAGE_KEYS.WISHLIST, DEFAULT_WISHLIST);
    list.unshift({
      id: 'wish_' + Date.now(),
      title: title,
      price: price,
      tag: tagInput.value,
      bought: false
    });
    saveStored(STORAGE_KEYS.WISHLIST, list);

    titleInput.value = '';
    priceInput.value = '';
    renderWishlist();
  });

  const filterBtns = document.querySelectorAll('#wish-filter-pills .week-pill');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWishFilter = btn.getAttribute('data-filter');
      renderWishlist();
    });
  });
}

function toggleWish(id) {
  const list = getStored(STORAGE_KEYS.WISHLIST, DEFAULT_WISHLIST);
  const item = list.find(w => w.id === id);
  if (item) {
    item.bought = !item.bought;
    saveStored(STORAGE_KEYS.WISHLIST, list);
    renderWishlist();
  }
}

function deleteWish(id) {
  let list = getStored(STORAGE_KEYS.WISHLIST, DEFAULT_WISHLIST);
  list = list.filter(w => w.id !== id);
  saveStored(STORAGE_KEYS.WISHLIST, list);
  renderWishlist();
}

function renderWishlist() {
  const container = document.getElementById('wishlist-items-list');
  if (!container) return;
  const list = getStored(STORAGE_KEYS.WISHLIST, DEFAULT_WISHLIST);

  const activeSum = list.filter(w => !w.bought).reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalSumEl = document.getElementById('wish-total-sum');
  if (totalSumEl) totalSumEl.textContent = `Осталось: ${formatMoney(activeSum)} ₽`;

  let filtered = list;
  if (currentWishFilter === 'active') {
    filtered = list.filter(w => w.bought === false);
  } else if (currentWishFilter === 'done') {
    filtered = list.filter(w => w.bought === true);
  }

  if (filtered.length === 0) {
    const msg = currentWishFilter === 'done' ? 'Нет исполненных целей' : 'Список пуст';
    container.innerHTML = `<div class="empty-state">${msg}</div>`;
    return;
  }

  container.innerHTML = filtered.map(w => `
    <div class="wish-card ${w.bought ? 'bought' : ''}">
      <div class="wish-checkbox" onclick="toggleWish('${w.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="wish-info">
        <div class="wish-title-text">${escapeHtml(w.title)}</div>
        <div class="wish-meta-row">
          <span class="wish-tag-badge">${escapeHtml(w.tag || '🎯')}</span>
          ${w.price > 0 ? `<span class="wish-price-badge">${formatMoney(w.price)} ₽</span>` : ''}
          ${w.bought ? '<span style="color:var(--accent-green); font-weight:700;">Куплено! 🎉</span>' : ''}
        </div>
      </div>
      <button class="task-del-btn" onclick="deleteWish('${w.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `).join('');
}

// ================= 9. DELTA ANALYTICS & FIXED EXPENSES =================
function initDeltaAnalytics() {
  const expenseInput = document.getElementById('monthly-total-expense-input');
  const saveExpenseBtn = document.getElementById('btn-save-monthly-total-expense');

  if (saveExpenseBtn && expenseInput) {
    saveExpenseBtn.addEventListener('click', () => {
      const val = parseFloat(expenseInput.value) || 0;
      const totals = getStored(STORAGE_KEYS.MONTHLY_EXPENSE_TOTAL, {});
      totals[currentAnalyticsMonth] = val;
      saveStored(STORAGE_KEYS.MONTHLY_EXPENSE_TOTAL, totals);
      renderAnalytics();
      saveExpenseBtn.textContent = 'Сохранено!';
      setTimeout(() => { saveExpenseBtn.textContent = 'Зафиксировать'; }, 1200);
    });
  }

  const modal = document.getElementById('fixed-expense-modal');
  const openBtn = document.getElementById('btn-open-fixed-expense-modal');
  const closeBtn = document.getElementById('btn-close-fixed-modal');
  const saveFixedBtn = document.getElementById('btn-save-fixed-expense');

  if (openBtn) openBtn.addEventListener('click', () => modal.classList.add('active'));
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  if (saveFixedBtn) {
    saveFixedBtn.addEventListener('click', () => {
      const name = document.getElementById('fixed-exp-name').value.trim();
      const amount = parseFloat(document.getElementById('fixed-exp-amount').value);

      if (!name || !amount || amount <= 0) {
        alert('Укажите название и сумму фиксы');
        return;
      }

      const fixedList = getStored(STORAGE_KEYS.FIXED_EXPENSES, DEFAULT_FIXED_EXPENSES);
      fixedList.push({
        id: 'fix_' + Date.now(),
        name: name,
        amount: amount
      });
      saveStored(STORAGE_KEYS.FIXED_EXPENSES, fixedList);

      modal.classList.remove('active');
      document.getElementById('fixed-exp-name').value = '';
      document.getElementById('fixed-exp-amount').value = '';
      renderAnalytics();
    });
  }
}

function deleteFixedExpense(id) {
  let list = getStored(STORAGE_KEYS.FIXED_EXPENSES, DEFAULT_FIXED_EXPENSES);
  list = list.filter(f => f.id !== id);
  saveStored(STORAGE_KEYS.FIXED_EXPENSES, list);
  renderAnalytics();
}

function renderAnalytics() {
  const incomes = getStored(STORAGE_KEYS.INCOMES, []);
  const monthlyExpenseTotals = getStored(STORAGE_KEYS.MONTHLY_EXPENSE_TOTAL, {});
  const fixedExpenses = getStored(STORAGE_KEYS.FIXED_EXPENSES, DEFAULT_FIXED_EXPENSES);

  const monthIncomes = incomes.filter(i => i.date.startsWith(currentAnalyticsMonth));
  const totalMonthIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);

  const totalMonthExpense = monthlyExpenseTotals[currentAnalyticsMonth] || 0;
  const expInpEl = document.getElementById('monthly-total-expense-input');
  if (expInpEl) expInpEl.value = totalMonthExpense > 0 ? totalMonthExpense : '';

  const netDelta = totalMonthIncome - totalMonthExpense;

  const inEl = document.getElementById('stat-income-month');
  if (inEl) inEl.textContent = `+${formatMoney(totalMonthIncome)} ₽`;
  
  const outEl = document.getElementById('stat-expense-month');
  if (outEl) outEl.textContent = `-${formatMoney(totalMonthExpense)} ₽`;
  
  const badgeEl = document.getElementById('month-income-total-badge');
  if (badgeEl) badgeEl.textContent = `+${formatMoney(totalMonthIncome)} ₽`;

  const deltaEl = document.getElementById('stat-net-month');
  if (deltaEl) {
    deltaEl.textContent = `${netDelta >= 0 ? '+' : ''}${formatMoney(netDelta)} ₽`;
    deltaEl.className = 'stat-value font-bold ' + (netDelta >= 0 ? 'text-green' : 'text-red');
  }

  const totalFixed = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const fixSumEl = document.getElementById('fixed-expenses-total-sum');
  if (fixSumEl) fixSumEl.textContent = `${formatMoney(totalFixed)} ₽ / мес`;

  const fixedContainer = document.getElementById('fixed-expenses-list');
  if (fixedContainer) {
    if (fixedExpenses.length === 0) {
      fixedContainer.innerHTML = `<div class="empty-state">Обязательные фиксы не добавлены</div>`;
    } else {
      fixedContainer.innerHTML = fixedExpenses.map(f => `
        <div class="breakdown-row">
          <span>${escapeHtml(f.name)}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="text-red" style="font-weight:600;">-${formatMoney(f.amount)} ₽</span>
            <button class="task-del-btn" onclick="deleteFixedExpense('${f.id}')">✕</button>
          </div>
        </div>
      `).join('');
    }
  }

  const catMap = {};
  monthIncomes.forEach(i => {
    catMap[i.category] = (catMap[i.category] || 0) + i.amount;
  });

  const catContainer = document.getElementById('income-breakdown-list');
  if (catContainer) {
    const catEntries = Object.entries(catMap);
    if (catEntries.length === 0) {
      catContainer.innerHTML = `<div class="empty-state">В месяце ${currentAnalyticsMonth} начислений нет</div>`;
    } else {
      catContainer.innerHTML = catEntries.map(([cat, sum]) => `
        <div class="breakdown-row">
          <span>${escapeHtml(cat)}</span>
          <span class="text-green" style="font-weight:700;">+${formatMoney(sum)} ₽</span>
        </div>
      `).join('');
    }
  }

  const sortedMonthIncomes = [...monthIncomes].sort((a, b) => b.date.localeCompare(a.date));
  const historyContainer = document.getElementById('full-income-history');
  if (historyContainer) {
    if (sortedMonthIncomes.length === 0) {
      historyContainer.innerHTML = `<div class="empty-state">История начислений за этот месяц пуста</div>`;
    } else {
      historyContainer.innerHTML = sortedMonthIncomes.map(i => `
        <div class="history-item">
          <div>
            <div style="font-weight:600; font-size:14px;">${escapeHtml(i.category)}</div>
            <div style="font-size:12px; color:var(--text-muted);">${i.date} ${i.description ? `• ${escapeHtml(i.description)}` : ''}</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="text-green" style="font-weight:700;">+${formatMoney(i.amount)} ₽</div>
            <button class="task-del-btn" onclick="deleteIncomeEntry('${i.id}')">✕</button>
          </div>
        </div>
      `).join('');
    }
  }
}

function renderArchive() {
  const archiveContainer = document.getElementById('archive-tasks-list');
  if (!archiveContainer) return;
  const archive = getStored(STORAGE_KEYS.ARCHIVE, []);
  const activeDone = getStored(STORAGE_KEYS.TASKS, []).filter(t => t.done);
  const combined = [...activeDone, ...archive];

  if (combined.length === 0) {
    archiveContainer.innerHTML = `<div class="empty-state">Нет выполненных дел в архиве</div>`;
    return;
  }

  const grouped = {};
  combined.forEach(t => {
    const d = t.doneDate || t.createdAt || 'Ранее';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(t);
  });

  const dates = Object.keys(grouped).sort().reverse();

  archiveContainer.innerHTML = dates.map(d => `
    <div class="archive-date-group">
      <div class="archive-date-title">${d}</div>
      <div class="items-list">
        ${grouped[d].map(t => `
          <div class="task-item done">
            <div class="custom-checkbox">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="task-text">${escapeHtml(t.text)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderAll() {
  renderDayTasks();
  renderSmartNotes();
  renderNotes();
  renderCarHub();
  renderIncomesScreen();
  renderSchemes();
  renderWishlist();
  renderAnalytics();
}

function formatMoney(num) {
  return Number(num).toLocaleString('ru-RU');
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
