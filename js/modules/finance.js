import { state } from '../state.js';

import { registerRoute } from '../router.js';

import { openModal, confirmDialog } from '../components/modal.js';

import { showToast } from '../components/toast.js';

import {

  generateId, escapeHtml, formatDate, formatCurrency

} from '../utils.js';



const INCOME_CATEGORIES = ['Keluarga', 'Pekerjaan', 'Lainnya'];

const EXPENSE_CATEGORIES = ['Kuliah', 'Makan', 'Transportasi', 'Pacaran', 'Hiburan', 'Lainnya'];

const CAT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6'];

function getBudget() {
  const s = state.get().settings;
  return {
    income: s.budgetIncome || 0,
    expense: s.budgetExpense || 0
  };
}

function setBudget(income, expense) {
  state.updateSettings({ budgetIncome: income, budgetExpense: expense });
}

function renderBudgetCard(monthTotals) {
  const budget = getBudget();
  const incomePct = budget.income > 0 ? Math.min(100, Math.round((monthTotals.income / budget.income) * 100)) : 0;
  const expensePct = budget.expense > 0 ? Math.min(100, Math.round((monthTotals.expense / budget.expense) * 100)) : 0;
  const incomeRemain = budget.income - monthTotals.income;
  const expenseRemain = budget.expense - monthTotals.expense;

  return `
    <div class="card" style="margin-bottom:var(--space-6)">
      <div class="section-header" style="margin-bottom:var(--space-5)">
        <h3 class="card__title">Target Bulanan</h3>
        <button class="btn btn-ghost btn-sm" id="edit-budget-btn">Ubah Target</button>
      </div>
      <div class="page-grid page-grid--2" style="gap:var(--space-6)">
        <div>
          <div class="progress-label">
            <span>Target Pemasukan</span>
            <span>${formatCurrency(monthTotals.income)} / ${formatCurrency(budget.income)}</span>
          </div>
          <div class="progress-bar" style="height:10px">
            <div class="progress-bar__fill" style="width:${incomePct}%;background:var(--gradient-success)"></div>
          </div>
          <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:var(--space-1)">
            ${incomeRemain > 0 ? `${formatCurrency(incomeRemain)} lagi menuju target` : 'Target tercapai!'}
          </p>
        </div>
        <div>
          <div class="progress-label">
            <span>Batas Pengeluaran</span>
            <span>${formatCurrency(monthTotals.expense)} / ${formatCurrency(budget.expense)}</span>
          </div>
          <div class="progress-bar" style="height:10px">
            <div class="progress-bar__fill ${expensePct > 90 ? 'progress-bar__fill--danger' : ''}" style="width:${expensePct}%;background:var(--gradient-primary)"></div>
          </div>
          <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:var(--space-1)">
            ${expenseRemain > 0 ? `Sisa ${formatCurrency(expenseRemain)}` : 'Melebihi batas!'}
          </p>
        </div>
      </div>
    </div>
  `;
}



export function initFinance() {

  registerRoute('finance', renderFinance);

  registerRoute('exams', renderFinance);

}



function calcTotals(transactions) {

  let income = 0;

  let expense = 0;

  transactions.forEach(t => {

    if (t.type === 'income') income += t.amount;

    else expense += t.amount;

  });

  return { income, expense, balance: income - expense };

}



function groupByCategory(transactions, type) {

  const map = {};

  transactions.filter(t => t.type === type).forEach(t => {

    map[t.category] = (map[t.category] || 0) + t.amount;

  });

  return Object.entries(map).sort((a, b) => b[1] - a[1]);

}



function renderFlowBars(labels, values, colors) {

  const total = values.reduce((a, b) => a + b, 0) || 1;

  return `

    <div class="fin-flow">

      <div class="fin-flow__stack">

        ${values.map((val, i) => val > 0 ? `

          <div class="fin-flow__segment" style="width:${(val / total) * 100}%;background:${colors[i]}" title="${labels[i]}: ${formatCurrency(val)}"></div>

        ` : '').join('')}

      </div>

      <div class="fin-flow__legend">

        ${labels.map((label, i) => `

          <div class="fin-flow__legend-item">

            <span class="fin-flow__dot" style="background:${colors[i]}"></span>

            <span class="fin-flow__legend-label">${label}</span>

            <span class="fin-flow__legend-value">${formatCurrency(values[i])}</span>

            <span class="fin-flow__legend-pct">${total > 0 ? Math.round((values[i] / total) * 100) : 0}%</span>

          </div>

        `).join('')}

      </div>

    </div>

  `;

}



function renderCategoryBars(entries) {

  if (!entries.length) return '<p class="fin-empty-chart">Belum ada data</p>';

  const max = Math.max(...entries.map(([, v]) => v), 1);

  return `

    <div class="fin-categories">

      ${entries.map(([label, val], i) => {

        const pct = Math.round((val / max) * 100);

        const color = CAT_COLORS[i % CAT_COLORS.length];

        return `

          <div class="fin-cat">

            <div class="fin-cat__row">

              <span class="fin-cat__label">${escapeHtml(label)}</span>

              <span class="fin-cat__value">${formatCurrency(val)}</span>

            </div>

            <div class="fin-cat__track">

              <div class="fin-cat__fill" style="width:${pct}%;background:linear-gradient(90deg,${color},${color}cc)"></div>

            </div>

          </div>

        `;

      }).join('')}

    </div>

  `;

}



function renderRing(income, expense, balance) {

  const total = income + expense || 1;

  const incomePct = Math.round((income / total) * 100);

  const gradient = income > 0 && expense > 0

    ? `conic-gradient(#10b981 0% ${incomePct}%, #ef4444 ${incomePct}% 100%)`

    : income > 0

      ? 'conic-gradient(#10b981 0% 100%)'

      : expense > 0

        ? 'conic-gradient(#ef4444 0% 100%)'

        : 'conic-gradient(var(--border-color) 0% 100%)';



  return `

    <div class="fin-ring-wrap">

      <div class="fin-ring" style="background:${gradient}">

        <div class="fin-ring__hole">

          <span class="fin-ring__amount" style="color:${balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">${formatCurrency(balance)}</span>

          <span class="fin-ring__sub">Saldo</span>

        </div>

      </div>

      <div class="fin-ring__stats">

        <div class="fin-ring__stat fin-ring__stat--in">

          <span class="fin-ring__stat-label">Pemasukan</span>

          <span class="fin-ring__stat-value">${formatCurrency(income)}</span>

        </div>

        <div class="fin-ring__stat fin-ring__stat--out">

          <span class="fin-ring__stat-label">Pengeluaran</span>

          <span class="fin-ring__stat-value">${formatCurrency(expense)}</span>

        </div>

      </div>

    </div>

  `;

}



function renderFinance(container) {

  const data = state.get();

  const transactions = [...(data.transactions || [])].sort((a, b) => b.date.localeCompare(a.date));

  const { income, expense, balance } = calcTotals(transactions);



  const thisMonth = new Date().toISOString().slice(0, 7);

  const monthTx = transactions.filter(t => t.date.startsWith(thisMonth));

  const monthTotals = calcTotals(monthTx);

  const monthExpenseCats = groupByCategory(monthTx, 'expense');

  const monthIncomeCats = groupByCategory(monthTx, 'income');



  const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });



  container.innerHTML = `

    <div class="page">

      <div class="page-header">

        <div class="page-header__top">

          <div>

            <h1 class="page-header__title">Keuangan</h1>

            <p class="page-header__subtitle">Catat pemasukan dan pengeluaran uang Anda</p>

          </div>

          <div class="quick-actions">

            <button class="btn btn-primary" id="add-income-btn">

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>

              Pemasukan

            </button>

            <button class="btn btn-secondary" id="add-expense-btn">

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>

              Pengeluaran

            </button>

          </div>

        </div>

      </div>



      ${renderBudgetCard(monthTotals)}

      <div class="fin-summary-grid">

        <div class="card fin-card">

          <h3 class="card__title fin-card__title">Ringkasan Keseluruhan</h3>

          ${renderRing(income, expense, balance)}

        </div>

        <div class="card fin-card">

          <h3 class="card__title fin-card__title">Bulan Ini — ${monthName}</h3>

          <div class="fin-month-balance">

            <span class="fin-month-balance__label">Saldo bulan ini</span>

            <span class="fin-month-balance__value" style="color:${monthTotals.balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">${formatCurrency(monthTotals.balance)}</span>

          </div>

          ${renderFlowBars(['Pemasukan', 'Pengeluaran'], [monthTotals.income, monthTotals.expense], ['#10b981', '#ef4444'])}

        </div>

      </div>



      <div class="page-grid page-grid--2 fin-detail-grid">

        <div class="card fin-card">

          <h3 class="card__title fin-card__title">Pemasukan per Kategori</h3>

          ${renderCategoryBars(monthIncomeCats)}

        </div>

        <div class="card fin-card">

          <h3 class="card__title fin-card__title">Pengeluaran per Kategori</h3>

          ${renderCategoryBars(monthExpenseCats)}

        </div>

      </div>



      <div class="filters-bar" style="margin-top:var(--space-8)">

        <select class="form-select" id="finance-filter">

          <option value="all">Semua</option>

          <option value="income">Pemasukan</option>

          <option value="expense">Pengeluaran</option>

        </select>

      </div>



      <div id="finance-list">

        ${transactions.length ? transactions.map(t => `

          <div class="list-item" data-type="${t.type}">

            <div class="list-item__icon list-item__icon--${t.type === 'income' ? 'success' : 'danger'}">

              ${t.type === 'income' ? '+' : '−'}

            </div>

            <div class="list-item__content">

              <div class="list-item__title">${escapeHtml(t.title)}</div>

              <div class="list-item__meta">${formatDate(t.date)} · ${escapeHtml(t.category)}${t.description ? ` · ${escapeHtml(t.description)}` : ''}</div>

            </div>

            <span class="badge ${t.type === 'income' ? 'badge--success' : 'badge--danger'}" style="font-size:var(--font-size-sm);padding:var(--space-2) var(--space-3)">

              ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}

            </span>

            <div class="table-actions">

              <button class="btn btn-ghost btn-sm edit-transaction" data-id="${t.id}">Ubah</button>

              <button class="btn btn-ghost btn-sm delete-transaction" data-id="${t.id}" style="color:var(--color-danger)">Hapus</button>

            </div>

          </div>

        `).join('') : `

          <div class="empty-state">

            <h3 class="empty-state__title">Belum ada transaksi</h3>

            <p class="empty-state__text">Mulai catat pemasukan dan pengeluaran Anda.</p>

          </div>

        `}

      </div>

    </div>

  `;



  container.querySelector('#add-income-btn').addEventListener('click', () => showTransactionModal('income'));

  container.querySelector('#add-expense-btn').addEventListener('click', () => showTransactionModal('expense'));

  container.querySelector('#edit-budget-btn')?.addEventListener('click', showBudgetModal);



  container.querySelector('#finance-filter').addEventListener('change', (e) => {

    const val = e.target.value;

    container.querySelectorAll('#finance-list .list-item').forEach(item => {

      item.style.display = val === 'all' || item.dataset.type === val ? '' : 'none';

    });

  });



  container.querySelectorAll('.edit-transaction').forEach(btn => {

    btn.addEventListener('click', () => {

      const t = transactions.find(x => x.id === btn.dataset.id);

      if (t) showTransactionModal(t.type, t);

    });

  });



  container.querySelectorAll('.delete-transaction').forEach(btn => {

    btn.addEventListener('click', async () => {

      const ok = await confirmDialog({

        title: 'Hapus Transaksi',

        message: 'Transaksi ini akan dihapus permanen.',

        confirmText: 'Ya, Hapus',

        variant: 'danger'

      });

      if (ok) {

        state.deleteTransaction(btn.dataset.id);

        showToast('Transaksi dihapus', 'success');

        renderFinance(container);

      }

    });

  });

}



function showBudgetModal() {
  const budget = getBudget();

  const content = `
    <form id="budget-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="budget-income">Target Pemasukan (Rp)</label>
          <input class="form-input" id="budget-income" type="number" min="0" step="1000" value="${budget.income}" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label" for="budget-expense">Batas Pengeluaran (Rp)</label>
          <input class="form-input" id="budget-expense" type="number" min="0" step="1000" value="${budget.expense}" placeholder="0">
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary modal-cancel">Batal</button>
    <button class="btn btn-primary" id="save-budget">Simpan Target</button>
  `;

  const { close, modal } = openModal({
    title: 'Target Bulanan',
    content,
    footer
  });

  modal.querySelector('.modal-cancel').addEventListener('click', close);
  modal.querySelector('#save-budget').addEventListener('click', () => {
    const income = parseInt(modal.querySelector('#budget-income').value) || 0;
    const expense = parseInt(modal.querySelector('#budget-expense').value) || 0;
    setBudget(income, expense);
    showToast('Target bulanan disimpan', 'success');
    close();
    renderFinance(document.getElementById('page-container'));
  });
}

function showTransactionModal(type, transaction = null) {

  const isEdit = !!transaction;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const selectedCat = transaction?.category;

  const catOptions = categories.map(c => `<option value="${c}" ${selectedCat === c ? 'selected' : ''}>${c}</option>`).join('');

  const extraCat = selectedCat && !categories.includes(selectedCat)

    ? `<option value="${escapeHtml(selectedCat)}" selected>${escapeHtml(selectedCat)}</option>`

    : '';



  const content = `

    <form id="transaction-form">

      <div class="form-group">

        <label class="form-label" for="tx-title">Judul</label>

        <input class="form-input" id="tx-title" type="text" required value="${transaction ? escapeHtml(transaction.title) : ''}" placeholder="${type === 'income' ? 'cth. Uang saku' : 'cth. Bayar UKT'}">

      </div>

      <div class="form-row">

        <div class="form-group">

          <label class="form-label" for="tx-amount">Jumlah (Rp)</label>

          <input class="form-input" id="tx-amount" type="number" min="1" step="1" required value="${transaction?.amount || ''}">

        </div>

        <div class="form-group">

          <label class="form-label" for="tx-date">Tanggal</label>

          <input class="form-input" id="tx-date" type="date" required value="${transaction?.date || new Date().toISOString().split('T')[0]}">

        </div>

      </div>

      <div class="form-group">

        <label class="form-label" for="tx-category">Kategori</label>

        <select class="form-select" id="tx-category" required>

          ${extraCat}${catOptions}

        </select>

      </div>

      <div class="form-group">

        <label class="form-label" for="tx-desc">Catatan</label>

        <textarea class="form-textarea" id="tx-desc" rows="2">${transaction?.description || ''}</textarea>

      </div>

    </form>

  `;



  const footer = `

    <button class="btn btn-secondary modal-cancel">Batal</button>

    <button class="btn btn-primary" id="save-transaction">${isEdit ? 'Perbarui' : 'Simpan'}</button>

  `;



  const { close, modal } = openModal({

    title: isEdit ? `Ubah ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}` : `Tambah ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`,

    content,

    footer

  });



  modal.querySelector('.modal-cancel').addEventListener('click', close);

  modal.querySelector('#save-transaction').addEventListener('click', () => {

    const title = modal.querySelector('#tx-title').value.trim();

    const amount = parseInt(modal.querySelector('#tx-amount').value, 10);

    const date = modal.querySelector('#tx-date').value;

    const category = modal.querySelector('#tx-category').value;

    const description = modal.querySelector('#tx-desc').value.trim();



    if (!title || !amount || !date) return showToast('Lengkapi kolom wajib', 'error');



    const payload = { type, title, amount, date, category, description };



    if (isEdit) {

      state.updateTransaction(transaction.id, payload);

      showToast('Transaksi diperbarui', 'success');

    } else {

      state.addTransaction({ id: generateId(), ...payload });

      showToast('Transaksi ditambahkan', 'success');

    }



    close();

    renderFinance(document.getElementById('page-container'));

  });

}

