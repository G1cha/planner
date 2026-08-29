// ============================================================
// APP LOGIC & LOCAL PERSISTENCE
// ============================================================

const STORAGE_KEYS = {
  TASKS: 'pwa_tasks_v1',
  ARCHIVE: 'pwa_archive_v1',
  INCOMES: 'pwa_incomes_v1',
  EXPENSES: 'pwa_monthly_expenses_v1',
  NOTES: 'pwa_notes_v1',
  LAST_DATE: 'pwa_last_login_date'
};

// State
let currentPeriod = 'day'; // 'day' | 'week' | '12weeks'
let currentMonthFilter = getYearMonthString(new Date());

document.addEventListener('DOMContentLoaded', () => {
  initDate();
  checkMidnightArchiving();
  initNavigation();
  initTasks();
  initIncomes();
  initNotes();
  initExpenses();
  renderAll();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW reg error:', err));
  }
});

// Helper: Date format YYYY-MM-DD
function getIsoDateString(d) {
  return d.toISOString().split('T')[0];
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
  document.getElementById('expense-month-select').value = currentMonthFilter;
}

// Midnight Archiving logic:
// Tasks marked 'done' from previous days are automatically moved to Archive!
function checkMidnightArchiving() {
  const todayStr = getIsoDateString(new Date());
  const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_DATE);
  
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  let archive = getStored(STORAGE_KEYS.ARCHIVE, []);

  // Filter out completed tasks that were created or marked before today
  const activeTasks = [];
  let movedCount = 0;

  tasks.forEach(t => {
    if (t.done && (t.doneDate && t.doneDate < todayStr)) {
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

// ================= NAVIGATION =================
function initNavigation() {
  // Main Tabbar
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
      }
    });
  });

  // Analytics Subtabs
  const subnavBtns = document.querySelectorAll('.subnav-btn');
  subnavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subnavBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.subtab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const subId = btn.getAttribute('data-subtab');
      document.getElementById(subId).classList.add('active');
    });
  });

  // Period Selector (День / Неделя / 12 Недель)
  const periodBtns = document.querySelectorAll('.seg-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.getAttribute('data-period');
      renderTasks();
    });
  });

  // Backup Export
  document.getElementById('btn-export-data').addEventListener('click', () => {
    const dump = {
      tasks: getStored(STORAGE_KEYS.TASKS, []),
      archive: getStored(STORAGE_KEYS.ARCHIVE, []),
      incomes: getStored(STORAGE_KEYS.INCOMES, []),
      expenses: getStored(STORAGE_KEYS.EXPENSES, []),
      notes: getStored(STORAGE_KEYS.NOTES, []),
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

// ================= 1. TASKS =================
function initTasks() {
  const input = document.getElementById('task-input');
  const addBtn = document.getElementById('btn-add-task');

  const addTask = () => {
    const text = input.value.trim();
    if (!text) return;

    const tasks = getStored(STORAGE_KEYS.TASKS, []);
    tasks.unshift({
      id: 'task_' + Date.now(),
      text: text,
      period: currentPeriod, // 'day' | 'week' | '12weeks'
      done: false,
      createdAt: getIsoDateString(new Date()),
      doneDate: null
    });
    saveStored(STORAGE_KEYS.TASKS, tasks);
    input.value = '';
    renderTasks();
  };

  addBtn.addEventListener('click', addTask);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
}

function toggleTask(id) {
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  const todayStr = getIsoDateString(new Date());
  const item = tasks.find(t => t.id === id);
  if (item) {
    item.done = !item.done;
    item.doneDate = item.done ? todayStr : null;
    saveStored(STORAGE_KEYS.TASKS, tasks);
    renderTasks();
  }
}

function deleteTask(id) {
  let tasks = getStored(STORAGE_KEYS.TASKS, []);
  tasks = tasks.filter(t => t.id !== id);
  saveStored(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
}

function renderTasks() {
  const container = document.getElementById('tasks-list');
  const tasks = getStored(STORAGE_KEYS.TASKS, []);
  const filtered = tasks.filter(t => t.period === currentPeriod);

  if (filtered.length === 0) {
    const labels = { day: 'на сегодня', week: 'на эту неделю', '12weeks': 'на 12 недель' };
    container.innerHTML = `<div class="empty-state">Нет запланированных дел ${labels[currentPeriod]}</div>`;
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}">
      <div class="custom-checkbox" onclick="toggleTask('${t.id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="task-text">${escapeHtml(t.text)}</div>
      <button class="task-del-btn" onclick="deleteTask('${t.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  `).join('');
}

// ================= 2. DAILY INCOMES =================
function initIncomes() {
  const amountInput = document.getElementById('income-amount');
  const catInput = document.getElementById('income-category');
  const descInput = document.getElementById('income-desc');
  const saveBtn = document.getElementById('btn-save-income');

  saveBtn.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
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
      date: getIsoDateString(new Date()),
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

// ================= 3. NOTES =================
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
    container.innerHTML = `<div class="empty-state">Нет заметок. Запишите идею или мысль дня выше ✍️</div>`;
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

// ================= 4. MONTHLY EXPENSES (BANK SUMMARY) =================
function initExpenses() {
  const modal = document.getElementById('expense-modal');
  const openBtn = document.getElementById('btn-open-expense-modal');
  const closeBtn = document.getElementById('btn-close-modal');
  const saveBtn = document.getElementById('btn-save-monthly-expense');
  const monthInput = document.getElementById('expense-month-select');

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  monthInput.addEventListener('change', (e) => {
    currentMonthFilter = e.target.value;
    renderAnalytics();
  });

  saveBtn.addEventListener('click', () => {
    const cat = document.getElementById('modal-expense-cat').value.trim();
    const amount = parseFloat(document.getElementById('modal-expense-amount').value);

    if (!cat || !amount || amount <= 0) {
      alert('Укажите категорию и сумму расхода');
      return;
    }

    const expenses = getStored(STORAGE_KEYS.EXPENSES, []);
    // check if category already exists for this month -> update or add
    const existingIndex = expenses.findIndex(e => e.month === currentMonthFilter && e.category.toLowerCase() === cat.toLowerCase());
    if (existingIndex > -1) {
      expenses[existingIndex].amount = amount;
    } else {
      expenses.push({
        id: 'exp_' + Date.now(),
        month: currentMonthFilter,
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

  // 2. Current Week stats (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 = Monday
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

  // 3. Month Stats for currentMonthFilter
  const monthIncomes = incomes.filter(i => i.date.startsWith(currentMonthFilter));
  const totalMonthIncome = monthIncomes.reduce((s, i) => s + i.amount, 0);

  const monthExpenses = expenses.filter(e => e.month === currentMonthFilter);
  const totalMonthExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const netBalance = totalMonthIncome - totalMonthExpense;

  document.getElementById('stat-income-month').textContent = `+${formatMoney(totalMonthIncome)} ₽`;
  document.getElementById('stat-expense-month').textContent = `-${formatMoney(totalMonthExpense)} ₽`;
  
  const netEl = document.getElementById('stat-net-month');
  netEl.textContent = `${netBalance >= 0 ? '+' : ''}${formatMoney(netBalance)} ₽`;
  netEl.className = 'stat-value ' + (netBalance >= 0 ? 'text-green' : 'text-red');

  // Income Breakdown by Category
  const catMap = {};
  monthIncomes.forEach(i => {
    catMap[i.category] = (catMap[i.category] || 0) + i.amount;
  });

  const catContainer = document.getElementById('income-breakdown-list');
  const catEntries = Object.entries(catMap);
  if (catEntries.length === 0) {
    catContainer.innerHTML = `<div class="empty-state">В этом месяце доходов пока не зафиксировано</div>`;
  } else {
    catContainer.innerHTML = catEntries.map(([cat, sum]) => `
      <div class="breakdown-row">
        <span>${escapeHtml(cat)}</span>
        <span class="text-green font-bold">+${formatMoney(sum)} ₽</span>
      </div>
    `).join('');
  }

  // Expenses List
  const expContainer = document.getElementById('expenses-list');
  if (monthExpenses.length === 0) {
    expContainer.innerHTML = `<div class="empty-state">Сводка расходов за ${currentMonthFilter} не добавлена. Нажмите «+ Добавить категорию».</div>`;
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

  // Full History
  const historyContainer = document.getElementById('full-income-history');
  if (monthIncomes.length === 0) {
    historyContainer.innerHTML = `<div class="empty-state">История начислений пуста</div>`;
  } else {
    historyContainer.innerHTML = monthIncomes.map(i => `
      <div class="history-item">
        <div>
          <div style="font-weight:600; font-size:14px;">${escapeHtml(i.category)}</div>
          <div style="font-size:12px; color:var(--text-muted);">${i.date} ${i.description ? `• ${escapeHtml(i.description)}` : ''}</div>
        </div>
        <div class="text-green font-bold">+${formatMoney(i.amount)} ₽</div>
      </div>
    `).join('');
  }

  // Render Completed Tasks Archive
  renderArchive();
}

function renderArchive() {
  const archiveContainer = document.getElementById('archive-tasks-list');
  const archive = getStored(STORAGE_KEYS.ARCHIVE, []);

  // Also include completed tasks from current active list if they are done
  const activeDone = getStored(STORAGE_KEYS.TASKS, []).filter(t => t.done);
  const combined = [...activeDone, ...archive];

  if (combined.length === 0) {
    archiveContainer.innerHTML = `<div class="empty-state">Нет выполненных дел в архиве</div>`;
    return;
  }

  // Group by date
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
  renderTasks();
  renderIncomeWidget();
  renderNotes();
}

// Helpers
function formatMoney(num) {
  return Number(num).toLocaleString('ru-RU');
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
