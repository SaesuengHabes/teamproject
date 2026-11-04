let portfolios = [];
let selectedId = null;
let nextId = 1;

const listEl = document.getElementById('portfolioList');
const badgeEl = document.getElementById('countBadge');
const contentEl = document.getElementById('detailContent');
const emptyEl = document.getElementById('emptyState');
const titleEl = document.getElementById('detailTitle');
const enjoyEl = document.getElementById('detailEnjoy');
const triedEl = document.getElementById('detailTried');
const curiousEl = document.getElementById('detailCurious');
const deleteBtn = document.getElementById('deleteBtn');

function renderList() {
  badgeEl.textContent = portfolios.length;
  listEl.innerHTML = '';

  portfolios.forEach(p => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'portfolio-item' + (p.id === selectedId ? ' active' : '');

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = p.name;

    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = p.items + ' รายการ';

    btn.append(name, count);
    
    btn.addEventListener('click', () => selectPortfolio(p.id));
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

function renderDetail() {
  const p = portfolios.find(x => x.id === selectedId);

  contentEl.hidden = !p;
  emptyEl.hidden = !!p;
  if (!p) return;

  titleEl.textContent = p.name;
  enjoyEl.textContent = p.enjoy;
  triedEl.textContent = p.tried;
  curiousEl.textContent = p.curious;
}

function selectPortfolio(id) {
  selectedId = id;
  renderList();
  renderDetail();
}


deleteBtn.addEventListener('click', () => {
  const p = portfolios.find(x => x.id === selectedId);
  if (!p || !confirm('ลบ "' + p.name + '" ใช่หรือไม่?')) return;
  portfolios = portfolios.filter(x => x.id !== selectedId);
  selectedId = portfolios.length ? portfolios[0].id : null;
  renderList();
  renderDetail();
});

const form = document.getElementById('portfolioForm');
const fields = form.querySelectorAll('.field');

function validate(field) {
  const input = field.querySelector('input, textarea');
  field.classList.toggle('invalid', input.value.trim() === '');
}

fields.forEach(field => {
  field.querySelector('input, textarea').addEventListener('input', () => validate(field));
});

form.addEventListener('submit', e => {
  e.preventDefault();
  fields.forEach(validate);
  if (form.querySelector('.invalid')) return;

  const newItem = {
    id: nextId++,
    name: document.getElementById('displayName').value.trim(),
    enjoy: document.getElementById('enjoy').value.trim(),
    tried: document.getElementById('tried').value.trim(),
    curious: document.getElementById('curious').value.trim(),
    items: 0
  };
  portfolios.push(newItem);
  selectedId = newItem.id;

  form.reset();
  fields.forEach(validate); 
  renderList();
  renderDetail();
});

renderList();
renderDetail();