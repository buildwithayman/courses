/* ════════════════════════════════════
   CONFIG
════════════════════════════════════ */
const API = 'http://127.0.0.1:8000';
let allCourses = [];
let editMode = false;

const VIEW_META = {
  courses:  ['All Courses',    '/ overview'],
  add:      ['Add Course',     '/ new entry'],
  filter:   ['Filter by ID',   '/ lookup'],
  paginate: ['Paginated View', '/ browse'],
};

const NAV_ORDER = ['courses', 'add', 'filter', 'paginate'];

/* ════════════════════════════════════
   NAVIGATION
════════════════════════════════════ */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    btn.classList.toggle('active', NAV_ORDER[i] === name);
  });

  const [title, sub] = VIEW_META[name] || ['', ''];
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-sub').textContent = sub;

  if (name === 'courses') loadCourses();
  if (name === 'add' && !editMode) {
    resetForm();
    document.getElementById('form-title').textContent = 'Add New Course';
    document.getElementById('form-btn-text').textContent = 'Save Course';
  }
}

/* ════════════════════════════════════
   API HELPER
════════════════════════════════════ */
async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

/* ════════════════════════════════════
   LOAD & RENDER ALL COURSES
════════════════════════════════════ */
async function loadCourses() {
  document.getElementById('table-loading').style.display = 'flex';
  document.getElementById('table-container').style.display = 'none';
  try {
    allCourses = await apiFetch('/data');
    renderStats(allCourses);
    renderTable(allCourses);
  } catch (e) {
    toast('Failed to load: ' + e.message, 'error');
    document.getElementById('table-loading').style.display = 'none';
  }
}

function renderStats(data) {
  document.getElementById('stat-total').textContent = data.length;
  document.getElementById('stat-pub').textContent = data.filter(c => c.is_published).length;
  const avg = data.length
    ? '$' + (data.reduce((s, c) => s + c.price, 0) / data.length).toFixed(0)
    : '—';
  document.getElementById('stat-avg').textContent = avg;
  document.getElementById('stat-cat').textContent = new Set(data.map(c => c.category)).size || '—';
}

function priceTier(price) {
  if (price < 500)  return ['Budget',   'badge-budget'];
  if (price < 1000) return ['Mid-range','badge-mid'];
  return ['Premium', 'badge-premium'];
}

function renderTable(data) {
  document.getElementById('table-loading').style.display = 'none';
  document.getElementById('table-container').style.display = 'block';
  const tbody = document.getElementById('courses-tbody');
  const empty = document.getElementById('empty-state');

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map(c => {
    const [tier, tierClass] = priceTier(c.price);
    const disc = c.discount_percent != null
      ? `<span style="font-size:11px;color:var(--success)"> -${c.discount_percent}%</span>`
      : '';
    return `
      <tr>
        <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)">#${c.id}</span></td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.title)}</td>
        <td>${esc(c.instructor)}</td>
        <td style="text-transform:capitalize">${esc(c.category)}</td>
        <td>$${c.price.toFixed(2)}${disc}</td>
        <td>${c.duration_hours}h</td>
        <td><span class="badge ${c.is_published ? 'badge-published' : 'badge-unpublished'}">${c.is_published ? 'Published' : 'Draft'}</span></td>
        <td><span class="badge ${tierClass}">${tier}</span></td>
        <td>
          <div class="action-group">
            <button class="btn btn-ghost btn-sm" onclick="editCourse(${c.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCourse(${c.id})">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function filterTable() {
  const q = document.getElementById('search-input').value.toLowerCase();
  if (!q) { renderTable(allCourses); return; }
  const filtered = allCourses.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.instructor.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q)
  );
  renderTable(filtered);
}

function refreshData() {
  loadCourses();
  toast('Data refreshed', 'success');
}

/* ════════════════════════════════════
   FORM — ADD / EDIT
════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('f-published').addEventListener('change', function () {
    document.getElementById('pub-label').textContent = this.checked ? 'Published' : 'Draft';
  });
  loadCourses();
});

function resetForm() {
  ['f-title', 'f-instructor', 'f-category', 'f-price', 'f-duration', 'f-discount'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-published').checked = true;
  document.getElementById('pub-label').textContent = 'Published';
  document.getElementById('f-edit-id').value = '';
  editMode = false;
}

async function submitForm() {
  const title      = document.getElementById('f-title').value.trim();
  const instructor = document.getElementById('f-instructor').value.trim();
  const category   = document.getElementById('f-category').value.trim();
  const price      = parseFloat(document.getElementById('f-price').value);
  const duration   = parseInt(document.getElementById('f-duration').value);
  const published  = document.getElementById('f-published').checked;
  const discRaw    = document.getElementById('f-discount').value;
  const discount   = discRaw !== '' ? parseFloat(discRaw) : null;
  const editId     = document.getElementById('f-edit-id').value;

  if (!title      || title.length < 2)              { toast('Title must be at least 2 characters', 'error'); return; }
  if (!instructor || instructor.length < 2)          { toast('Instructor name required', 'error'); return; }
  if (!category   || category.length < 2)            { toast('Category required', 'error'); return; }
  if (!price      || price <= 0 || price > 1000)     { toast('Price must be between 0.01 and 1000', 'error'); return; }
  if (!duration   || duration <= 0 || duration > 1000) { toast('Duration must be between 1 and 1000', 'error'); return; }
  if (!published  && discount && discount > 0)        { toast('Unpublished courses cannot have a discount', 'error'); return; }

  const payload = {
    id: null,
    title,
    instructor,
    category,
    price,
    duration_hours: duration,
    is_published: published,
    discount_percent: discount,
  };

  try {
    if (editId) {
      await apiFetch('/update/' + editId, { method: 'PUT', body: JSON.stringify(payload) });
      toast('Course updated!', 'success');
    } else {
      await apiFetch('/new', { method: 'POST', body: JSON.stringify(payload) });
      toast('Course created!', 'success');
    }
    resetForm();
    showView('courses');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

function editCourse(id) {
  const c = allCourses.find(x => x.id === id);
  if (!c) return;
  editMode = true;
  document.getElementById('form-title').textContent = 'Edit Course #' + id;
  document.getElementById('form-btn-text').textContent = 'Update Course';
  document.getElementById('f-title').value       = c.title;
  document.getElementById('f-instructor').value  = c.instructor;
  document.getElementById('f-category').value    = c.category;
  document.getElementById('f-price').value       = c.price;
  document.getElementById('f-duration').value    = c.duration_hours;
  document.getElementById('f-published').checked = c.is_published;
  document.getElementById('pub-label').textContent = c.is_published ? 'Published' : 'Draft';
  document.getElementById('f-discount').value    = c.discount_percent ?? '';
  document.getElementById('f-edit-id').value     = id;
  showView('add');
}

async function deleteCourse(id) {
  if (!confirm(`Delete course #${id}? This cannot be undone.`)) return;
  try {
    await apiFetch('/delete/' + id, { method: 'DELETE' });
    toast('Course deleted', 'success');
    loadCourses();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

/* ════════════════════════════════════
   FILTER VIEW
════════════════════════════════════ */
async function runFilter() {
  const id = document.getElementById('filter-id').value;
  if (!id) { toast('Please enter an ID', 'error'); return; }

  try {
    const data   = await apiFetch('/filter?id=' + id);
    const box    = document.getElementById('filter-result');
    const detail = document.getElementById('filter-detail');
    box.style.display = 'block';

    if (!data.Data || !data.Data.length) {
      detail.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <strong>No course found</strong>
          <p>ID #${id} does not exist.</p>
        </div>`;
      return;
    }

    const c = data.Data[0];
    const [tier, tierClass] = priceTier(c.price);
    detail.innerHTML = `
      <div class="detail-grid">
        <div class="detail-cell"><div class="dk">ID</div><div class="dv">#${c.id}</div></div>
        <div class="detail-cell" style="grid-column:span 2"><div class="dk">Title</div><div class="dv">${esc(c.title)}</div></div>
        <div class="detail-cell"><div class="dk">Instructor</div><div class="dv">${esc(c.instructor)}</div></div>
        <div class="detail-cell"><div class="dk">Category</div><div class="dv" style="text-transform:capitalize">${esc(c.category)}</div></div>
        <div class="detail-cell"><div class="dk">Status</div><div class="dv">
          <span class="badge ${c.is_published ? 'badge-published' : 'badge-unpublished'}">${c.is_published ? 'Published' : 'Draft'}</span>
        </div></div>
        <div class="detail-cell"><div class="dk">Price</div><div class="dv">$${c.price.toFixed(2)}</div></div>
        <div class="detail-cell"><div class="dk">Duration</div><div class="dv">${c.duration_hours}h</div></div>
        <div class="detail-cell"><div class="dk">Discount</div><div class="dv">${c.discount_percent != null ? c.discount_percent + '%' : 'None'}</div></div>
      </div>
      <div style="padding:14px 20px;display:flex;gap:10px">
        <button class="btn btn-primary btn-sm" onclick="editCourse(${c.id})">Edit this course</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCourse(${c.id})">Delete</button>
      </div>`;
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

function clearFilter() {
  document.getElementById('filter-id').value = '';
  document.getElementById('filter-result').style.display = 'none';
}

/* ════════════════════════════════════
   PAGINATE VIEW
════════════════════════════════════ */
async function runPaginate() {
  const page  = parseInt(document.getElementById('pag-page').value)  || 1;
  const limit = parseInt(document.getElementById('pag-limit').value) || 10;

  try {
    const data = await apiFetch(`/items?page=${page}&limit=${limit}`);
    const box  = document.getElementById('pag-result');
    box.style.display = 'block';

    document.getElementById('pag-meta').textContent =
      `Page ${data['Current page no.']} — Showing ${data['records shown on this page']} of ${data['Total items']} courses`;

    const tbody = document.getElementById('pag-tbody');
    if (!data.Data.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No data on this page</td></tr>`;
    } else {
      tbody.innerHTML = data.Data.map(c => `
        <tr>
          <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)">#${c.id}</span></td>
          <td>${esc(c.title)}</td>
          <td>${esc(c.instructor)}</td>
          <td style="text-transform:capitalize">${esc(c.category)}</td>
          <td>$${c.price.toFixed(2)}</td>
          <td><span class="badge ${c.is_published ? 'badge-published' : 'badge-unpublished'}">${c.is_published ? 'Published' : 'Draft'}</span></td>
        </tr>`).join('');
    }

    const totalPages = Math.ceil(data['Total items'] / limit);
    const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => Math.abs(p - page) < 3);

    document.getElementById('pag-pagination').innerHTML = `
      <span>${data['Total items']} total records</span>
      <div class="page-btns">
        <button class="page-btn" onclick="jumpPage(${page - 1}, ${limit})" ${page <= 1 ? 'disabled' : ''}>‹</button>
        ${pageNums.map(p => `
          <button class="page-btn ${p === page ? 'active' : ''}" onclick="jumpPage(${p}, ${limit})">${p}</button>
        `).join('')}
        <button class="page-btn" onclick="jumpPage(${page + 1}, ${limit})" ${page >= totalPages ? 'disabled' : ''}>›</button>
      </div>`;
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

function jumpPage(p, limit) {
  document.getElementById('pag-page').value  = p;
  document.getElementById('pag-limit').value = limit;
  runPaginate();
}

/* ════════════════════════════════════
   TOAST NOTIFICATIONS
════════════════════════════════════ */
function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ════════════════════════════════════
   UTILITY
════════════════════════════════════ */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}