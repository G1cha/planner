// ============================================================
// APP LOGIC & LOCAL PERSISTENCE (V5 WITH "ТЕМКИ" TAB)
// ============================================================

const STORAGE_KEYS = {
  TASKS: 'pwa_tasks_v5',
  TWELVE_GOAL: 'pwa_twelve_goal_v5',
  TWELVE_TASKS: 'pwa_twelve_tasks_v5',
  ARCHIVE: 'pwa_archive_v5',
  INCOMES: 'pwa_incomes_v5',
  EXPENSES: 'pwa_monthly_expenses_v5',
  NOTES: 'pwa_notes_v5',
  SMART_NOTES: 'pwa_smart_notes_v5',
  SCHEMES: 'pwa_schemes_v5',
  WISHLIST: 'pwa_wishlist_v5',
  LAST_DATE: 'pwa_last_login_date'
};

// Initial Knowledge Base Notes from User Markdown
const DEFAULT_SMART_NOTES = [
  {
    id: 'note_kia',
    icon: '🚗',
    title: 'KIA RIO — Авто & ТО',
    badge: 'Масло: 212.000 км',
    badgeClass: 'badge-blue',
    content: `**Следующая замена масла:** 212.000 км
---
**История обслуживания:**
• **205к:**
  - замена масла и фильтров
  - замена задней правой ступицы
  - замена задних тормозов
• **206к:**
  - ремонт моторчика дворников (проводка)
  - замена всех задних лампочек
  - полировка передних фар
• **209к:**
  - ремонт фишки моторчика дворников`
  },
  {
    id: 'note_gostraight',
    icon: '⭐️',
    title: 'GÖ STRAIGHT — Дедлайны',
    badge: 'Сентябрь',
    badgeClass: 'badge-orange',
    content: `• **14 сентября:** забрать вклад ФинУслуги (100к), перекинуть в ликвидность (LQDT)
• **15 сентября:** подать на увольнение
• **16 сентября:** купить зимнюю резину`
  },
  {
    id: 'note_health',
    icon: '⚡️',
    title: '2DAŸZ — Здоровье & Тело',
    badge: 'Режим',
    badgeClass: 'badge-green',
    content: `**Больная спина и осанка:**
• ДЕРЖАТЬ ОСАНКУ
• Турник по 1 минуте (после умывания, перед/после смены, перед сном)
• Отжимания: раз в день на максимум

**Привычки & Питание:**
• С 1-го сентября: новый курс витаминов
• Не обжираться на работе
• Полностью исключить энергетики
• Когда закончится жижа — на сигареты, кьюб выкинуть
• С 1-го октября: полностью бросить курить

**На выходных после работы:**
• Выписать в заметках все хотелки (от глобальных до мелочей)
• Выписать все источники дохода и статьи расходов`
  },
  {
    id: 'note_invest',
    icon: '💵',
    title: 'Инвестор — Правила',
    badge: 'Стратегия 5 лет',
    badgeClass: 'badge-green',
    content: `• **Акции (Яндекс, Лукойл, Сбер):** откладывать 10% от ЗП на протяжении ближайших 5 лет + реинвестировать 100% дивидендов обратно в акции.
• **Ликвидность:** откладывать 8% от абсолютно любой прибыли в фонд LQDT.`
  }
];

// Initial Starter Schemes ("Темки")
const DEFAULT_SCHEMES = [
  {
    id: 'scheme_1',
    title: 'Купить электровелик и сдавать в аренду курьерам',
    tag: '🚲 Аренда & Прокат',
    potential: '15 000 - 25 000 ₽ / мес',
    status: 'idea', // 'idea' | 'in_progress' | 'launched'
    notes: 'Купить б/у Minako или колхозник, батарею повышенной емкости. Сдавать по договору посуточно или понедельно курьерам.'
  },
  {
    id: 'scheme_2',
    title: 'Купить гараж и сдавать в аренду под склад / авто',
    tag: '🏢 Недвижка & Гаражи',
    potential: '7 000 - 12 000 ₽ / мес',
    status: 'idea',
    notes: 'Найти недорогой сухой гараж с электричеством в спальнике. Сдавать под хранение шин, мотоцикла или личных вещей.'
  },
  {
    id: 'scheme_3',
    title: 'Устроиться на удаленку (IT / саппорт / верстка)',
    tag: '💼 Работа & Удаленка',
    potential: '70 000 - 120 000 ₽ / мес',
    status: 'in_progress',
    notes: 'Обновить резюме, упаковать кейсы по сайтам и ботам. Рассылать отклики по 5 штук в день.'
  }
];

// Initial Starter Wishlist
const DEFAULT_WISHLIST = [
  {
    id: 'wish_1',
    title: 'Своя квартира (первый взнос / покупка)',
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
    title: 'MacBook Pro для работы и кодинга',
    price: 180000,
    tag: '💻 Техника',
    bought: false
  }
];

// State
let currentPeriod = 'day';
let selectedTwelveWeek = 1;
let currentAnalyticsMonth = getYearMonthString(new Date());
let activeEditingNoteId = null;
let currentWishFilter = 'all';
let currentSchemeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initSmartNotesDefault();
  initSchemesDefault();
  initWishlistDefault();
  initDate();
  checkMidnightArchiving();
  initNavigation();
  initDayTasks();
  initTwelveWeeks();
  initIncomes();
  initNotes();
  initSmartNotes();
  initSchemes();
  initWishlist();
  initExpenses();
  renderAll();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW reg error:', err));
  }
});

function initSmartNotesDefault() {
  if (!localStorage.getItem(STORAGE_KEYS.SMART_NOTES)) {
    saveStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
  }
}
function initSchemesDefault() {
  if (!localStorage.getItem(STORAGE_KEYS.SCHEMES)) {
    saveStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
  }
}
function initWishlistDefault() {
  if (!localStorage.getItem(STORAGE_KEYS.WISHLIST)) {
    saveStored(STORAGE_KEYS.WISHLIST, DEFAULT_WISHLIST);
  }
}

// Date helpers
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
  document.getElementById('current-date-text').textContent = str.charAt(0).toUpperCase() + str.slice(1);
  
  document.getElementById('income-date').value = getIsoDateString(new Date());
  document.getElementById('analytics-month-select').value = currentAnalyticsMonth;
}

// Storage helpers
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

// Midnight Archiving
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
  // Main Tabbar (Главная, Темки, Хотелки, Аналитика)
  const tabBtns = document.querySelectorAll('.bottom-tabbar .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');

      if (targetId === 'tab-analytics') {
        renderAnalytics();
      } else if (targetId === 'tab-wishlist') {
        renderWishlist();
      } else if (targetId === 'tab-schemes') {
        renderSchemes();
      }
    });
  });

  // Analytics Subtabs
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

  // Tasks Period Selector (День vs 12 Недель)
  const periodBtns = document.querySelectorAll('.section-container:first-of-type .seg-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
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

  // Notes Switcher (База vs Мысли)
  const notesTabBtns = [document.getElementById('btn-notes-pinned'), document.getElementById('btn-notes-quick')];
  notesTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      notesTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabType = btn.getAttribute('data-notes-tab');
      
      const pinnedC = document.getElementById('notes-pinned-container');
      const quickC = document.getElementById('notes-quick-container');

      if (tabType === 'pinned') {
        pinnedC.style.display = 'block';
        quickC.style.display = 'none';
      } else {
        pinnedC.style.display = 'none';
        quickC.style.display = 'block';
      }
    });
  });

  // Analytics Month Selector
  document.getElementById('analytics-month-select').addEventListener('change', (e) => {
    currentAnalyticsMonth = e.target.value;
    renderAnalytics();
  });

  // Backup Export
  document.getElementById('btn-export-data').addEventListener('click', () => {
    const dump = {
      tasks: getStored(STORAGE_KEYS.TASKS, []),
      twelveGoal: getStored(STORAGE_KEYS.TWELVE_GOAL, ''),
      twelveTasks: getStored(STORAGE_KEYS.TWELVE_TASKS, []),
      archive: getStored(STORAGE_KEYS.ARCHIVE, []),
      incomes: getStored(STORAGE_KEYS.INCOMES, []),
      expenses: getStored(STORAGE_KEYS.EXPENSES, []),
      notes: getStored(STORAGE_KEYS.NOTES, []),
      smartNotes: getStored(STORAGE_KEYS.SMART_NOTES, []),
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

// ================= 1. DAY TASKS =================
function initDayTasks() {
  const input = document.getElementById('task-input');
  const addBtn = document.getElementById('btn-add-task');

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

  goalTextarea.value = getStored(STORAGE_KEYS.TWELVE_GOAL, '');

  saveGoalBtn.addEventListener('click', () => {
    saveStored(STORAGE_KEYS.TWELVE_GOAL, goalTextarea.value.trim());
    saveGoalBtn.textContent = 'Сохранено!';
    setTimeout(() => { saveGoalBtn.textContent = 'Сохранить цель'; }, 1500);
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
  let pillsHtml = '';
  for (let w = 1; w <= 12; w++) {
    pillsHtml += `<button class="week-pill ${w === selectedTwelveWeek ? 'active' : ''}" onclick="selectTwelveWeek(${w})">Неделя ${w}</button>`;
  }
  pillsContainer.innerHTML = pillsHtml;

  document.getElementById('selected-week-title').textContent = `Неделя ${selectedTwelveWeek}: Шаги и действия`;

  const allTwelveTasks = getStored(STORAGE_KEYS.TWELVE_TASKS, []);
  const weekTasks = allTwelveTasks.filter(t => t.week === selectedTwelveWeek);
  const doneCount = weekTasks.filter(t => t.done).length;
  document.getElementById('week-progress-badge').textContent = `${doneCount}/${weekTasks.length} выполнено`;

  const container = document.getElementById('twelve-weeks-tasks-list');
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

// ================= 3. INCOMES =================
function initIncomes() {
  const amountInput = document.getElementById('income-amount');
  const catInput = document.getElementById('income-category');
  const dateInput = document.getElementById('income-date');
  const descInput = document.getElementById('income-desc');
  const saveBtn = document.getElementById('btn-save-income');

  saveBtn.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    const dateVal = dateInput.value || getIsoDateString(new Date());

    if (!amount || amount <= 0) {
      alert('Укажите корректную сумму дохода');
      return;
    }

    const incomes = getStored(STORAGE_KEYS.INCOMES, []);
    const newEntry = {
      id: 'inc_' + Date.now(),
      amount: amount,
      category: catInput.value,
      description: descInput.value.trim(),
      date: dateVal,
      timestamp: Date.now()
    };
    incomes.unshift(newEntry);
    saveStored(STORAGE_KEYS.INCOMES, incomes);

    amountInput.value = '';
    descInput.value = '';
    renderIncomeWidget();
  });
}

function renderIncomeWidget() {
  const incomes = getStored(STORAGE_KEYS.INCOMES, []);
  const todayStr = getIsoDateString(new Date());
  
  const todayList = incomes.filter(i => i.date === todayStr);
  const totalToday = todayList.reduce((acc, curr) => acc + curr.amount, 0);

  document.getElementById('today-earned-display').textContent = `+${formatMoney(totalToday)} ₽`;

  const logContainer = document.getElementById('today-incomes-log');
  if (todayList.length === 0) {
    logContainer.innerHTML = `<span style="font-size: 12px; color: var(--text-dim);">Сегодня начислений пока не было</span>`;
  } else {
    logContainer.innerHTML = todayList.slice(0, 3).map(i => `
      <div class="mini-log-item">
        <span>${escapeHtml(i.category)} ${i.description ? `(${escapeHtml(i.description)})` : ''}</span>
        <span class="mini-log-amount">+${formatMoney(i.amount)} ₽</span>
      </div>
    `).join('');
  }
}

// ================= 4. PINNED SMART NOTES =================
function initSmartNotes() {
  const modal = document.getElementById('note-edit-modal');
  const closeBtn = document.getElementById('btn-close-note-modal');
  const saveBtn = document.getElementById('btn-save-note-modal');

  closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  saveBtn.addEventListener('click', () => {
    if (!activeEditingNoteId) return;
    const text = document.getElementById('note-modal-textarea').value;
    const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
    const item = notes.find(n => n.id === activeEditingNoteId);
    if (item) {
      item.content = text;
      saveStored(STORAGE_KEYS.SMART_NOTES, notes);
      renderSmartNotes();
    }
    modal.classList.remove('active');
  });
}

function openEditSmartNote(id) {
  activeEditingNoteId = id;
  const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);
  const item = notes.find(n => n.id === id);
  if (!item) return;

  document.getElementById('note-modal-title').textContent = item.title;
  document.getElementById('note-modal-textarea').value = item.content;
  document.getElementById('note-edit-modal').classList.add('active');
}

function renderSmartNotes() {
  const container = document.getElementById('pinned-notes-list');
  const notes = getStored(STORAGE_KEYS.SMART_NOTES, DEFAULT_SMART_NOTES);

  container.innerHTML = notes.map(n => `
    <div class="glass-card smart-card">
      <div class="smart-card-header">
        <div class="smart-card-title-wrap">
          <span class="smart-card-icon">${n.icon}</span>
          <span class="smart-card-title">${escapeHtml(n.title)}</span>
        </div>
        <span class="smart-card-badge ${n.badgeClass || ''}">${escapeHtml(n.badge)}</span>
      </div>
      <div class="smart-card-body">
        ${formatMarkdownText(n.content)}
      </div>
      <div class="smart-card-actions">
        <button class="btn-card-edit" onclick="openEditSmartNote('${n.id}')">✏️ Редактировать</button>
      </div>
    </div>
  `).join('');
}

function formatMarkdownText(text) {
  if (!text) return '';
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/---/g, '<hr style="border:none; border-top:1px solid rgba(255,255,255,0.08); margin:8px 0;">');
  formatted = formatted.replace(/• (.*)/g, '<div style="display:flex; gap:6px; margin-bottom:3px;"><span style="color:var(--accent-orange);">•</span><span>$1</span></div>');
  formatted = formatted.replace(/  - (.*)/g, '<div style="display:flex; gap:6px; margin-left:14px; margin-bottom:2px;"><span style="color:var(--text-muted);">-</span><span>$1</span></div>');
  return formatted.replace(/\n/g, '<br>');
}

// ================= 5. QUICK NOTES =================
function initNotes() {
  const noteInput = document.getElementById('note-input');
  const saveBtn = document.getElementById('btn-save-note');

  saveBtn.addEventListener('click', () => {
    const text = noteInput.value.trim();
    if (!text) return;

    const notes = getStored(STORAGE_KEYS.NOTES, []);
    notes.unshift({
      id: 'note_' + Date.now(),
      text: text,
      date: getIsoDateString(new Date()),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    });
    saveStored(STORAGE_KEYS.NOTES, notes);
    noteInput.value = '';
    renderNotes();
  });
}

function deleteNote(id) {
  let notes = getStored(STORAGE_KEYS.NOTES, []);
  notes = notes.filter(n => n.id !== id);
  saveStored(STORAGE_KEYS.NOTES, notes);
  renderNotes();
}

function renderNotes() {
  const container = document.getElementById('notes-list');
  const notes = getStored(STORAGE_KEYS.NOTES, []);

  if (notes.length === 0) {
    container.innerHTML = `<div class="empty-state">Нет мыслей. Запишите идею дня выше ✍️</div>`;
    return;
  }

  container.innerHTML = notes.slice(0, 10).map(n => `
    <div class="note-item">
      <button class="note-del" onclick="deleteNote('${n.id}')">✕</button>
      <div class="note-time">${n.date} в ${n.time}</div>
      <div class="note-body">${escapeHtml(n.text)}</div>
    </div>
  `).join('');
}

// ================= 6. ТЕМКИ (SCHEMES & HUSTLE) =================
function initSchemes() {
  const titleInput = document.getElementById('scheme-title');
  const potentialInput = document.getElementById('scheme-potential');
  const tagInput = document.getElementById('scheme-tag');
  const notesInput = document.getElementById('scheme-notes');
  const addBtn = document.getElementById('btn-add-scheme');

  addBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const potential = potentialInput.value.trim();
    const notes = notesInput.value.trim();

    if (!title) {
      alert('Напишите название темки');
      return;
    }

    const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
    list.unshift({
      id: 'sch_' + Date.now(),
      title: title,
      potential: potential || 'Не указан',
      tag: tagInput.value,
      status: 'idea', // 'idea' | 'in_progress' | 'launched'
      notes: notes
    });
    saveStored(STORAGE_KEYS.SCHEMES, list);

    titleInput.value = '';
    potentialInput.value = '';
    notesInput.value = '';
    renderSchemes();
  });

  // Filter Pills
  const filterBtns = document.querySelectorAll('#scheme-filter-pills .week-pill');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSchemeFilter = btn.getAttribute('data-scheme-filter');
      renderSchemes();
    });
  });
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

function deleteScheme(id) {
  let list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);
  list = list.filter(s => s.id !== id);
  saveStored(STORAGE_KEYS.SCHEMES, list);
  renderSchemes();
}

function renderSchemes() {
  const container = document.getElementById('schemes-items-list');
  const list = getStored(STORAGE_KEYS.SCHEMES, DEFAULT_SCHEMES);

  document.getElementById('schemes-total-count').textContent = `${list.length} тем`;

  let filtered = list;
  if (currentSchemeFilter !== 'all') {
    filtered = list.filter(s => s.status === currentSchemeFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">В этом статусе нет темок. Добавьте новую идею выше 💡</div>`;
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
          <span class="scheme-status-pill ${st.class}" onclick="cycleSchemeStatus('${s.id}')" title="Нажмите для смены статуса">${st.label}</span>
        </div>
        ${s.notes ? `<div class="scheme-details">${escapeHtml(s.notes)}</div>` : ''}
        <div class="scheme-footer-row">
          <div class="scheme-meta-wrap">
            <span class="wish-tag-badge">${escapeHtml(s.tag)}</span>
            <span class="scheme-potential-tag">💰 ${escapeHtml(s.potential)}</span>
          </div>
          <button class="task-del-btn" onclick="deleteScheme('${s.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ================= 7. WISHLIST TAB =================
function initWishlist() {
  const titleInput = document.getElementById('wish-title');
  const priceInput = document.getElementById('wish-price');
  const tagInput = document.getElementById('wish-tag');
  const addBtn = document.getElementById('btn-add-wish');

  addBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const price = parseFloat(priceInput.value) || 0;

    if (!title) {
      alert('Напишите название хотелки');
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
  const list = getStored(STORAGE_KEYS.WISHLIST, DEFAULT_WISHLIST);

  const activeSum = list.filter(w => !w.bought).reduce((acc, curr) => acc + (curr.price || 0), 0);
  document.getElementById('wish-total-sum').textContent = `Всего: ${formatMoney(activeSum)} ₽`;

  let filtered = list;
  if (currentWishFilter === 'active') {
    filtered = list.filter(w => !w.bought);
  } else if (currentWishFilter === 'done') {
    filtered = list.filter(w => !w.bought);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">Список пуст. Добавьте свою первую цель-мотиватор выше 🔥</div>`;
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
          <span class="wish-tag-badge">${escapeHtml(w.tag || '🎯 Цель')}</span>
          ${w.price > 0 ? `<span class="wish-price-badge">${formatMoney(w.price)} ₽</span>` : ''}
          ${w.bought ? '<span style="color:var(--accent-green); font-weight:600;">Куплено! 🎉</span>' : ''}
        </div>
      </div>
      <button class="task-del-btn" onclick="deleteWish('${w.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `).join('');
}

// ================= 8. MONTHLY EXPENSES =================
function initExpenses() {
  const modal = document.getElementById('expense-modal');
  const openBtn = document.getElementById('btn-open-expense-modal');
  const closeBtn = document.getElementById('btn-close-modal');
  const saveBtn = document.getElementById('btn-save-monthly-expense');

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  saveBtn.addEventListener('click', () => {
    const cat = document.getElementById('modal-expense-cat').value.trim();
    const amount = parseFloat(document.getElementById('modal-expense-amount').value);

    if (!cat || !amount || amount <= 0) {
      alert('Укажите категорию и сумму расхода');
      return;
    }

    const expenses = getStored(STORAGE_KEYS.EXPENSES, []);
    const existingIndex = expenses.findIndex(e => e.month === currentAnalyticsMonth && e.category.toLowerCase() === cat.toLowerCase());
    if (existingIndex > -1) {
      expenses[existingIndex].amount = amount;
    } else {
      expenses.push({
        id: 'exp_' + Date.now(),
        month: currentAnalyticsMonth,
        category: cat,
        amount: amount
      });
    }

    saveStored(STORAGE_KEYS.EXPENSES, expenses);
    modal.classList.remove('active');
    document.getElementById('modal-expense-cat').value = '';
    document.getElementById('modal-expense-amount').value = '';
    renderAnalytics();
  });
}

function deleteExpense(id) {
  let expenses = getStored(STORAGE_KEYS.EXPENSES, []);
  expenses = expenses.filter(e => e.id !== id);
  saveStored(STORAGE_KEYS.EXPENSES, expenses);
  renderAnalytics();
}

function deleteIncomeFromHistory(id) {
  let incomes = getStored(STORAGE_KEYS.INCOMES, []);
  incomes = incomes.filter(i => i.id !== id);
  saveStored(STORAGE_KEYS.INCOMES, incomes);
  renderAnalytics();
  renderIncomeWidget();
}

// ================= ANALYTICS & ARCHIVE RENDERING =================
function renderAnalytics() {
  const incomes = getStored(STORAGE_KEYS.INCOMES, []);
  const expenses = getStored(STORAGE_KEYS.EXPENSES, []);
  const todayStr = getIsoDateString(new Date());

  // 1. Day stats
  const todayIncomes = incomes.filter(i => i.date === todayStr);
  const totalToday = todayIncomes.reduce((s, i) => s + i.amount, 0);

  const dayValEl = document.getElementById('stat-income-day');
  const daySubEl = document.getElementById('stat-income-day-sub');
  if (totalToday > 0) {
    dayValEl.textContent = `+${formatMoney(totalToday)} ₽`;
    daySubEl.textContent = `${todayIncomes.length} начислений за сегодня`;
  } else {
    dayValEl.textContent = `0 ₽`;
    daySubEl.textContent = `Прибыли в этот день не было`;
  }

  // 2. Week stats
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  const startOfWeekStr = getIsoDateString(startOfWeek);

  const weekIncomes = incomes.filter(i => i.date >= startOfWeekStr && i.date <= todayStr);
  const totalWeek = weekIncomes.reduce((s, i) => s + i.amount, 0);

  const weekValEl = document.getElementById('stat-income-week');
  const weekSubEl = document.getElementById('stat-income-week-sub');
  if (totalWeek > 0) {
    weekValEl.textContent = `+${formatMoney(totalWeek)} ₽`;
    weekSubEl.textContent = `${weekIncomes.length} начислений на этой неделе`;
  } else {
    weekValEl.textContent = `0 ₽`;
    weekSubEl.textContent = `Прибыли на этой неделе не было`;
  }

  // 3. Month Stats
  const monthIncomes = incomes.filter(i => i.date.startsWith(currentAnalyticsMonth));
  const totalMonthIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);

  const monthExpenses = expenses.filter(e => e.month === currentAnalyticsMonth);
  const totalMonthExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const netBalance = totalMonthIncome - totalMonthExpense;

  document.getElementById('stat-income-month').textContent = `+${formatMoney(totalMonthIncome)} ₽`;
  document.getElementById('stat-expense-month').textContent = `-${formatMoney(totalMonthExpense)} ₽`;
  document.getElementById('month-income-total-badge').textContent = `+${formatMoney(totalMonthIncome)} ₽`;
  
  const netEl = document.getElementById('stat-net-month');
  netEl.textContent = `${netBalance >= 0 ? '+' : ''}${formatMoney(netBalance)} ₽`;
  netEl.className = 'stat-value ' + (netBalance >= 0 ? 'text-green' : 'text-red');

  // Breakdown by Category
  const catMap = {};
  monthIncomes.forEach(i => {
    catMap[i.category] = (catMap[i.category] || 0) + i.amount;
  });

  const catContainer = document.getElementById('income-breakdown-list');
  const catEntries = Object.entries(catMap);
  if (catEntries.length === 0) {
    catContainer.innerHTML = `<div class="empty-state">В месяце ${currentAnalyticsMonth} доходов пока не зафиксировано</div>`;
  } else {
    catContainer.innerHTML = catEntries.map(([cat, sum]) => `
      <div class="breakdown-row">
        <span>${escapeHtml(cat)}</span>
        <span class="text-green font-bold">+${formatMoney(sum)} ₽</span>
      </div>
    `).join('');
  }

  // Monthly Expenses List
  const expContainer = document.getElementById('expenses-list');
  if (monthExpenses.length === 0) {
    expContainer.innerHTML = `<div class="empty-state">Сводка расходов за ${currentAnalyticsMonth} не добавлена. Нажмите «+ Добавить».</div>`;
  } else {
    expContainer.innerHTML = monthExpenses.map(e => `
      <div class="breakdown-row">
        <span>${escapeHtml(e.category)}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="text-red font-bold">-${formatMoney(e.amount)} ₽</span>
          <button class="task-del-btn" onclick="deleteExpense('${e.id}')">✕</button>
        </div>
      </div>
    `).join('');
  }

  // Detailed History List
  const historyContainer = document.getElementById('full-income-history');
  if (monthIncomes.length === 0) {
    historyContainer.innerHTML = `<div class="empty-state">История начислений за этот месяц пуста</div>`;
  } else {
    historyContainer.innerHTML = monthIncomes.map(i => `
      <div class="history-item">
        <div>
          <div style="font-weight:600; font-size:14px;">${escapeHtml(i.category)}</div>
          <div style="font-size:12px; color:var(--text-muted);">${i.date} ${i.description ? `• ${escapeHtml(i.description)}` : ''}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="text-green font-bold">+${formatMoney(i.amount)} ₽</div>
          <button class="task-del-btn" onclick="deleteIncomeFromHistory('${i.id}')">✕</button>
        </div>
      </div>
    `).join('');
  }
}

function renderArchive() {
  const archiveContainer = document.getElementById('archive-tasks-list');
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
  renderIncomeWidget();
  renderSmartNotes();
  renderNotes();
  renderSchemes();
  renderWishlist();
}

// Formatters
function formatMoney(num) {
  return Number(num).toLocaleString('ru-RU');
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
