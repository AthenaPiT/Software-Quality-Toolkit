/* ==========================================================================
   Software Quality Toolkit — framework prototype
   Vanilla JS, no dependencies. All state lives in one serialisable object.
   ========================================================================== */
(() => {
'use strict';

/* ---------- tiny helpers ------------------------------------------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => 'n' + Math.random().toString(36).slice(2, 9);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
const I = (d, size = 14) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const ICON = {
  chevRight: I('<path d="m9 6 6 6-6 6"/>', 12),
  chevDown : I('<path d="m6 9 6 6 6-6"/>', 14),
  plus     : I('<path d="M12 5v14M5 12h14"/>', 14),
  layers   : I('<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 17 9 5 9-5"/>', 14),
  chip     : I('<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>', 14),
  grip     : I('<circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none"/>', 12),
  trash    : I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', 12),
  pencil   : I('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>', 12),
  check    : I('<path d="m5 12 4 4L19 6"/>', 10),
  close    : I('<path d="M18 6 6 18M6 6l12 12"/>', 14),
  back     : I('<path d="M19 12H5M11 18l-6-6 6-6"/>', 16),
  upRight  : I('<path d="M7 17 17 7M8 7h9v9"/>', 12),
  chart    : I('<path d="M3 20h18M6 16v-5M11 16V6M16 16v-8M21 16v-3"/>', 17),
  shield   : I('<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>', 17),
  badge    : I('<path d="m12 2 2.6 1.9 3.2-.3.8 3.1 2.4 2.2-1.5 2.9.4 3.2-3 1.1L15 21l-3-1.3L9 21l-2.9-2.9-3-1.1.4-3.2L2 9.1l2.4-2.2.8-3.1 3.2.3L12 2Z"/><path d="m9 12 2 2 4-4"/>', 17),
  calendar : I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>', 12),
  user     : I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', 12),
};

/* ---------- schema for the three editable information blocks ------------- */
const BLOCKS = [
  {
    key:'basic', num:'01', title:'Basic Information', sub:'Identity, ownership and scope',
    fields:[
      {k:'name',        label:'Node Name',          type:'text'},
      {k:'code',        label:'Node ID',            type:'text', mono:true},
      {k:'owner',       label:'Owner',              type:'text'},
      {k:'status',      label:'Status',             type:'select', options:['Planning','Active','At risk','Released'], display:'pill'},
      {k:'baseline',    label:'Baseline / Version', type:'text', mono:true},
      {k:'supplier',    label:'Supplier / Domain',  type:'text'},
      {k:'description', label:'Description',        type:'textarea', full:true},
    ]
  },
  {
    key:'plan', num:'02', title:'Quality Plan', sub:'Targets, milestones and deliverables',
    fields:[
      {k:'qualityOwner', label:'Quality Owner',   type:'text'},
      {k:'targetSop',    label:'Target SOP',      type:'text'},
      {k:'reviewCycle',  label:'Review Cycle',    type:'select', options:['Weekly','Bi-weekly','Monthly','Milestone-based']},
      {k:'coverage',     label:'Test Coverage Goal', type:'text'},
      {k:'progress',     label:'Plan Completion',  type:'number', display:'progress', full:true},
      {k:'deliverables', label:'Deliverables',     type:'textarea', full:true},
    ]
  },
  {
    key:'risk', num:'03', title:'Risk Assessment', sub:'Exposure, mitigation and follow-up',
    fields:[
      {k:'level',       label:'Risk Level',      type:'select', options:['Low','Medium','High','Critical'], display:'pill'},
      {k:'probability', label:'Probability',     type:'select', options:['Rare','Possible','Likely','Almost certain']},
      {k:'impact',      label:'Impact',          type:'select', options:['Minor','Moderate','Major','Severe']},
      {k:'riskOwner',   label:'Risk Owner',      type:'text'},
      {k:'nextReview',  label:'Next Review',     type:'text'},
      {k:'mitigation',  label:'Mitigation Plan', type:'textarea', full:true},
      {k:'notes',       label:'Assessment Notes',type:'textarea', full:true},
    ]
  },
];

const ACTIVITY_TEMPLATE = [
  { id:'kpi', color:'blue',  title:'KPI Monitoring', icon:'chart',
    desc:'Track defect density, test coverage and change-request KPIs against the agreed thresholds.',
    status:'On track', statusClass:'st-ontrack', owner:'Quality Ops', due:'Weekly',
    tasks:['Defect density trend','Test coverage ≥ 80%','Open issue ageing','Change request volatility','KPI report sign-off'] },
  { id:'swa', color:'teal',  title:'SWA Audit', icon:'shield',
    desc:'Software work product audit — checklist review, findings log and action item closure.',
    status:'In review', statusClass:'st-review', owner:'SWA Lead', due:'28 Nov 2026',
    tasks:['Audit checklist review','Work product sampling','Findings log','Action item closure','Audit report issued'] },
  { id:'ppa', color:'amber', title:'PPA Release', icon:'badge',
    desc:'Production Part Approval gate — evidence package, waivers, sign-off and baseline freeze.',
    status:'Pending', statusClass:'st-pending', owner:'Release Mgr', due:'12 Dec 2026',
    tasks:['Release evidence package','Open defect waivers','SQM sign-off','Baseline freeze','PPA approval granted'] },
];

/* ---------- sample data --------------------------------------------------- */
function makeNode(type, name, code, data = {}) {
  return {
    id: uid(), type, name, children: [],
    data: {
      basic: {
        name, code,
        owner:'M. Fischer', status:'Active', baseline:'v2.4.0 / 2026.11',
        supplier: type === 'cluster' ? 'Infotainment Platform' : 'Tier-1 Supplier',
        description: type === 'cluster'
          ? 'Logical group of software components sharing a common functional domain and release cadence.'
          : 'Software component with its own baseline, supplier and quality gate responsibilities.',
        ...(data.basic || {})
      },
      plan: {
        qualityOwner:'SQT Team', targetSop:'2027 / SOP+0', reviewCycle:'Bi-weekly',
        coverage:'≥ 80% statement coverage', progress:62,
        deliverables:'Quality plan, test specification, static analysis report, review minutes.',
        ...(data.plan || {})
      },
      risk: {
        level:'Medium', probability:'Possible', impact:'Moderate',
        riskOwner:'R. Weber', nextReview:'20 Nov 2026',
        mitigation:'Weekly defect triage, supplier review gate before each baseline freeze.',
        notes:'No blocking findings in the current review cycle.',
        ...(data.risk || {})
      }
    }
  };
}
function cluster(name, code, children = [], data = {}) {
  const n = makeNode('cluster', name, code, data); n.children = children; return n;
}
const swc = (name, code, data) => makeNode('swc', name, code, data);

function sampleProjects() {
  const infotainment = cluster('Infotainment Domain', 'CL-100', [
    swc('Media Player', 'SWC-101', { basic:{ name:'Media Player', code:'SWC-101', status:'Active', baseline:'v3.1.2', supplier:'Tier-1 / Harman', description:'Media playback, codec handling and source arbitration for the head unit.' },
      plan:{ progress:78, targetSop:'2027 / CW09', deliverables:'Test spec, codec conformance report, audio KPI dashboard.' },
      risk:{ level:'High', probability:'Likely', impact:'Major', notes:'Codec certification pending for two source devices.' } }),
    swc('Navigation Engine', 'SWC-102', { basic:{ name:'Navigation Engine', code:'SWC-102', status:'Active', baseline:'v2.8.0' } }),
    swc('Voice Assistant', 'SWC-103', { basic:{ name:'Voice Assistant', code:'SWC-103', status:'At risk', baseline:'v1.6.0' },
      plan:{ progress:41 }, risk:{ level:'Critical', probability:'Likely', impact:'Severe' } }),
  ]);
  const connectivity = cluster('Connectivity', 'CL-200', [
    swc('Bluetooth Stack', 'SWC-201', { basic:{ name:'Bluetooth Stack', code:'SWC-201', status:'Released' }, plan:{ progress:94 }, risk:{ level:'Low', probability:'Rare', impact:'Minor' } }),
    swc('Vehicle Network', 'SWC-202', { basic:{ name:'Vehicle Network', code:'SWC-202', status:'Planning' }, plan:{ progress:18 } }),
  ]);
  const hmi = cluster('HMI & Display', 'CL-300', [
    swc('Cluster Renderer', 'SWC-301', { basic:{ name:'Cluster Renderer', code:'SWC-301', status:'Active' } }),
  ]);

  return [
    { id:uid(), name:'Aurora Cockpit Program', code:'ACP-2026', owner:'Software Quality', updated:'12 Nov 2026',
      nodes:[infotainment, connectivity, hmi], activities:{} },
    { id:uid(), name:'Nova EV Platform', code:'NVP-2027', owner:'SQT / Body & Energy', updated:'08 Nov 2026',
      nodes:[cluster('Energy Management','CL-410',[swc('Battery State Estimator','SWC-411'),swc('Charge Controller','SWC-412')]),
             cluster('Body Controls','CL-420',[swc('Door & Access','SWC-421')])], activities:{} },
    { id:uid(), name:'Meridian ADAS Suite', code:'MAS-2026', owner:'Functional Safety', updated:'02 Nov 2026',
      nodes:[cluster('Perception','CL-510',[swc('Camera Pipeline','SWC-511'),swc('Sensor Fusion','SWC-512')]),
             cluster('Planning','CL-520',[swc('Trajectory Planner','SWC-521')])], activities:{} },
  ];
}

/* ---------- state --------------------------------------------------------- */
const STORE        = 'sqt.framework.v2';
const LEGACY_STORE = 'sqt.framework.v1';
const SNAP_STORE   = 'sqt.snapshots.v1';
const FORMAT       = 'sqt-workspace';
const VERSION      = 1;

const state = {
  projects: [], activeProjectId: null, selectedNodeId: null,
  expanded: new Set(), filter:'', editing:new Set(), openActivity:new Set(),
  view:'home',
  // portable workspace metadata — all of this travels inside the .sqt.json file
  log:[], settings:{ author:'QA' }, revision:1,
  updatedAt:null, lastExportedAt:null, dirty:false
};

const nowISO  = () => new Date().toISOString();
const stamp   = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
const shortTS = (iso) => { try { return new Date(iso).toLocaleString('en-GB', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); } catch { return '—'; } };

function serializeState() {
  return {
    schemaVersion:VERSION,
    projects:state.projects, activeProjectId:state.activeProjectId,
    selectedNodeId:state.selectedNodeId, expanded:[...state.expanded],
    log:state.log, settings:state.settings, revision:state.revision,
    updatedAt:state.updatedAt, lastExportedAt:state.lastExportedAt, dirty:state.dirty
  };
}
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify(serializeState())); }
  catch (e) { /* storage unavailable or full — the in-memory session still works */ }
}
function load() {
  try {
    let raw = localStorage.getItem(STORE);
    if (!raw) { // migrate a v1 prototype workspace if one exists
      raw = localStorage.getItem(LEGACY_STORE);
      if (raw) { localStorage.setItem(STORE, raw); localStorage.removeItem(LEGACY_STORE); }
    }
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!Array.isArray(d.projects) || !d.projects.length) return false;
    state.projects        = d.projects;
    state.activeProjectId = d.activeProjectId || null;
    state.selectedNodeId  = d.selectedNodeId || null;
    state.expanded        = new Set(d.expanded || []);
    state.log             = Array.isArray(d.log) ? d.log : [];
    state.settings        = { author:'QA', ...(d.settings || {}) };
    state.revision        = Number(d.revision) || 1;
    state.updatedAt       = d.updatedAt || null;
    state.lastExportedAt  = d.lastExportedAt || null;
    state.dirty           = !!d.dirty;
    return true;
  } catch (e) { return false; }
}
function resetData(silent = false) {
  state.projects = sampleProjects();
  state.activeProjectId = null; state.selectedNodeId = null;
  state.expanded = new Set(); state.editing = new Set(); state.openActivity = new Set();
  const walk = ns => ns.forEach(n => { if (n.children.length) { state.expanded.add(n.id); walk(n.children); } });
  state.projects.forEach(p => walk(p.nodes));
  if (silent) { state.log = []; state.dirty = false; state.updatedAt = nowISO(); persist(); }
  else commit('Workspace reset', 'Sample projects restored');
}

/* ---------- tree utilities ------------------------------------------------ */
const activeProject = () => state.projects.find(p => p.id === state.activeProjectId) || null;
function findNode(list, id, parent = null, path = []) {
  for (let i = 0; i < list.length; i++) {
    const n = list[i];
    if (n.id === id) return { node:n, list, index:i, parent, path };
    const r = findNode(n.children || [], id, n, [...path, n]);
    if (r) return r;
  }
  return null;
}
function detach(list, id) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) return list.splice(i, 1)[0];
    const r = detach(list[i].children || [], id);
    if (r) return r;
  }
  return null;
}
function descendants(node, acc = []) {
  (node.children || []).forEach(c => { acc.push(c.id); descendants(c, acc); });
  return acc;
}
function countNodes(list) {
  let c = 0, s = 0;
  list.forEach(n => { n.type === 'cluster' ? c++ : s++; const r = countNodes(n.children || []); c += r.c; s += r.s; });
  return { c, s };
}
const nodeById = id => findNode(activeProject()?.nodes || [], id)?.node || null;
const nodeName = n => n?.data?.basic?.name || n?.name || 'Untitled';

/* ---------- toast --------------------------------------------------------- */
function toast(msg, warn = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (warn ? ' warn' : '');
  el.innerHTML = `<i></i><span>${esc(msg)}</span>`;
  $('#toast-stack').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 250); }, 2600);
}

/* ---------- modal --------------------------------------------------------- */
function openModal(html, onMount, wide = false) {
  const o = $('#overlay');
  o.classList.toggle('has-wide', wide);
  o.innerHTML = `<div class="modal-backdrop"></div><div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  o.classList.add('is-open');
  $('.modal-backdrop', o).addEventListener('click', closeModal);
  $('.modal-close', o)?.addEventListener('click', closeModal);
  onMount?.(o);
}
function closeModal() { const o = $('#overlay'); o.classList.remove('is-open', 'has-wide'); o.innerHTML = ''; }
function confirmAction(title, text, yesLabel, onYes) {
  openModal(`
    <div class="modal-head"><div><h2>${esc(title)}</h2><p>${esc(text)}</p></div><button class="modal-close" aria-label="Close">${ICON.close}</button></div>
    <div class="modal-actions"><button class="btn btn-ghost" id="cf-no">Cancel</button><button class="btn btn-primary" id="cf-yes">${esc(yesLabel)}</button></div>
  `, (o) => {
    $('#cf-no', o).addEventListener('click', closeModal);
    $('#cf-yes', o).addEventListener('click', () => { closeModal(); onYes(); });
  });
}

/* ==========================================================================
   HOME
   ========================================================================== */
function renderHome() {
  const grid = $('#project-grid');
  const colors = ['var(--blue)','var(--teal)','var(--amber)'];
  grid.innerHTML = state.projects.map((p, i) => {
    const { c, s } = countNodes(p.nodes);
    return `<button class="project-card" data-project="${p.id}" style="--card-accent:${colors[i % 3]}">
      <div class="project-card-top">
        <div><h3>${esc(p.name)}</h3><div class="project-code">${esc(p.code)}</div></div>
        <span class="project-open">${ICON.upRight}</span>
      </div>
      <div class="project-card-bottom">
        <span><i></i>${c} Clusters</span><span><i></i>${s} SWCs</span><span>${esc(p.updated)}</span>
      </div>
    </button>`;
  }).join('');
  $('#project-count').textContent = `${state.projects.length} project${state.projects.length === 1 ? '' : 's'}`;
  $$('.project-card').forEach(el => el.addEventListener('click', () => openProject(el.dataset.project)));
}

function showAddProject() {
  openModal(`
    <div class="modal-head">
      <div><h2>Add Project</h2><p>Create a workspace for a new software quality programme. You can structure it with clusters and SWCs next.</p></div>
      <button class="modal-close" aria-label="Close">${ICON.close}</button>
    </div>
    <div class="modal-body">
      <div class="edit-grid">
        <div class="edit-field full"><label for="np-name">Project Name</label><input id="np-name" type="text" placeholder="e.g. Aurora Cockpit Program" autocomplete="off"></div>
        <div class="edit-field"><label for="np-code">Project Code</label><input id="np-code" type="text" placeholder="e.g. ACP-2027" autocomplete="off"></div>
        <div class="edit-field"><label for="np-owner">Owner</label><input id="np-owner" type="text" placeholder="e.g. Software Quality" autocomplete="off"></div>
      </div>
      <div class="field-error" id="np-err"></div>
    </div>
    <div class="modal-actions"><button class="btn btn-ghost" id="np-cancel">Cancel</button><button class="btn btn-primary" id="np-create">Create Project</button></div>
  `, (o) => {
    const name = $('#np-name', o);
    name.focus();
    $('#np-cancel', o).addEventListener('click', closeModal);
    const submit = () => {
      const v = name.value.trim();
      if (!v) { $('#np-err', o).textContent = 'A project name is required.'; name.focus(); return; }
      const p = {
        id:uid(), name:v, code:$('#np-code', o).value.trim() || v.slice(0,3).toUpperCase() + '-NEW',
        owner:$('#np-owner', o).value.trim() || 'Unassigned',
        updated:new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}),
        nodes:[], activities:{}
      };
      state.projects.unshift(p);
      commit('Project created', `${p.code} · owner ${p.owner}`, v);
      closeModal(); renderHome();
      toast(`Project "${v}" created`);
      openProject(p.id);
    };
    $('#np-create', o).addEventListener('click', submit);
    o.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
  });
}

/* ==========================================================================
   VIEW SWITCHING
   ========================================================================== */
function setView(v) {
  state.view = v;
  $('#view-home').classList.toggle('is-active', v === 'home');
  $('#view-workspace').classList.toggle('is-active', v === 'workspace');
}
function openProject(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  state.activeProjectId = id;
  state.filter = ''; $('#tree-filter').value = '';
  state.editing = new Set(); state.openActivity = new Set();
  if (!findNode(p.nodes, state.selectedNodeId)) {
    const first = p.nodes[0];
    state.selectedNodeId = first ? (first.children[0]?.id || first.id) : null;
  }
  save(); setView('workspace'); renderWorkspace();
}
function goHome() { setView('home'); renderHome(); }

/* ==========================================================================
   COLUMN 1 — PROJECT TREE
   ========================================================================== */
function rowHTML(node, depth, path) {
  const hasChildren = (node.children || []).length > 0;
  const open = state.expanded.has(node.id);
  const selected = state.selectedNodeId === node.id;
  const indent = depth * 18;
  const tag = node.type === 'cluster' ? 'CL' : 'SWC';
  const icon = node.type === 'cluster' ? ICON.layers : ICON.chip;
  return `<div class="tree-row ${selected ? 'is-selected' : ''} ${open && hasChildren ? 'is-open' : ''} ${depth > 0 ? 'is-child' : ''}"
      data-id="${node.id}" style="--indent:${indent}px" tabindex="0" role="treeitem" aria-selected="${selected}">
    <span class="tree-spacer"></span>
    <span class="twisty ${hasChildren ? '' : 'is-leaf'}">${ICON.chevRight}</span>
    <span class="node-grip" title="Hold and drag to move">${ICON.grip}</span>
    <span class="node-icon type-${node.type}">${icon}</span>
    <span class="node-label" title="${esc(nodeName(node))}">${esc(nodeName(node))}</span>
    <span class="node-tag">${tag}</span>
    ${hasChildren ? `<span class="node-count">${node.children.length}</span>` : ''}
    <span class="row-actions">
      <button class="row-act" data-act="add" title="Add child node">${ICON.plus}</button>
      <button class="row-act danger" data-act="del" title="Delete node">${ICON.trash}</button>
    </span>
  </div>`;
}

function renderTree() {
  const p = activeProject(); if (!p) return;
  const host = $('#tree');
  const f = state.filter.trim().toLowerCase();

  // inline "add" row, if one is pending
  let inlineHTML = '';
  if (state.inlineAdd !== undefined) {
    const a = state.inlineAdd;
    inlineHTML = `<div class="tree-inline" style="--indent:${a.depth * 18}px">
      <span class="node-icon ${a.type === 'cluster' ? 'type-cluster' : 'type-swc'}">${a.type === 'cluster' ? ICON.layers : ICON.chip}</span>
      <input id="inline-name" type="text" placeholder="${a.type === 'cluster' ? 'Cluster name' : 'SWC name'}" autocomplete="off">
      <button class="mini-btn" id="inline-ok">Add</button>
      <button class="mini-btn cancel" id="inline-cancel">Esc</button>
    </div>`;
  }

  let rows = '';
  const walk = (list, depth, path) => {
    list.forEach(n => {
      const match = !f || nodeName(n).toLowerCase().includes(f) || String(n.data?.basic?.code || '').toLowerCase().includes(f);
      const childMatch = !f || hasMatch(n.children || [], f);
      if (match || childMatch) {
        rows += rowHTML(n, depth, path);
        if ((state.expanded.has(n.id) || f) && (n.children || []).length) walk(n.children, depth + 1, [...path, n]);
        // inline "add child" input belongs directly beneath its parent
        if (state.inlineAdd?.parentId === n.id) rows += inlineHTML;
      }
    });
    // root-level inline row goes at the end of the root list
    if (depth === 0 && state.inlineAdd?.parentId === null) rows += inlineHTML;
  };
  const hasMatch = (list, q) => list.some(n =>
    nodeName(n).toLowerCase().includes(q) || String(n.data?.basic?.code || '').toLowerCase().includes(q) || hasMatch(n.children || [], q));

  walk(p.nodes, 0, []);

  if (!rows && !inlineHTML) {
    host.innerHTML = f
      ? `<div class="tree-empty">No nodes match “${esc(state.filter)}”.</div>`
      : `<div class="tree-empty">This project has no clusters yet.<br><button id="empty-add">+ Add the first Cluster</button></div>`;
    $('#empty-add')?.addEventListener('click', () => startInlineAdd(null, 'cluster'));
    return;
  }
  host.innerHTML = rows + inlineHTML;
  if (state.inlineAdd !== undefined) {
    const inp = $('#inline-name'); inp?.focus();
    const commitInline = () => {
      const v = inp?.value.trim(); if (!v) { cancelInline(); return; }
      const a = state.inlineAdd;
      const n = makeNode(a.type, v, a.type === 'cluster' ? `CL-${Math.floor(100 + Math.random() * 899)}` : `SWC-${Math.floor(100 + Math.random() * 899)}`);
      const p2 = activeProject();
      if (a.parentId) { const par = findNode(p2.nodes, a.parentId); par.node.children.push(n); state.expanded.add(a.parentId); }
      else p2.nodes.push(n);
      state.inlineAdd = undefined; state.selectedNodeId = n.id;
      commit('Node added', `${a.type === 'cluster' ? 'Cluster' : 'SWC'} "${v}" (${n.data.basic.code})`, activeProject()?.name, v);
      renderWorkspace(); toast(`${a.type === 'cluster' ? 'Cluster' : 'SWC'} "${v}" added`);
    };
    $('#inline-ok')?.addEventListener('click', commitInline);
    $('#inline-cancel')?.addEventListener('click', cancelInline);
    inp?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); commitInline(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelInline(); }
    });
  }
}
function cancelInline() { state.inlineAdd = undefined; renderTree(); }
function startInlineAdd(parentId, type) {
  const p = activeProject();
  const depth = parentId ? (findNode(p.nodes, parentId)?.path.length + 1 || 0) : 0;
  if (parentId) state.expanded.add(parentId);
  state.inlineAdd = { parentId, type, depth };
  // place inline row at the end of the relevant level — for a parent, after its last visible child
  renderTree();
  const el = $('#inline-name'); if (el) el.scrollIntoView({ block:'nearest' });
}

function addCluster() { startInlineAdd(null, 'cluster'); }
function addChild(parentId) {
  // A child of a Cluster is an SWC; a child of an SWC is a sub-component (also SWC).
  // Clusters are always created at root via "+ Cluster"; hierarchy changes happen by drag.
  startInlineAdd(parentId, 'swc');
}
function deleteNode(id) {
  const p = activeProject(); const found = findNode(p.nodes, id);
  if (!found) return;
  const label = nodeName(found.node);
  detach(p.nodes, id);
  state.expanded.delete(id);
  if (state.selectedNodeId === id) {
    state.selectedNodeId = found.parent?.id || p.nodes[0]?.id || null;
  }
  commit('Node deleted', `"${label}" and its children were removed`, activeProject()?.name, label);
  renderWorkspace(); toast(`"${label}" removed`, true);
}

/* tree interactions (delegated) */
let suppressClickUntil = 0;
function bindTree() {
  const tree = $('#tree');
  tree.addEventListener('click', e => {
    if (Date.now() < suppressClickUntil) return; // a drag just ended — don't re-select
    const btn = e.target.closest('.row-act');
    const row = e.target.closest('.tree-row');
    if (!row) return;
    const id = row.dataset.id;
    if (btn) {
      e.stopPropagation();
      btn.dataset.act === 'add' ? addChild(id) : deleteNode(id);
      return;
    }
    if (e.target.closest('.twisty') && (nodeById(id)?.children || []).length) {
      state.expanded.has(id) ? state.expanded.delete(id) : state.expanded.add(id);
      save(); renderTree(); return;
    }
    selectNode(id);
  });
  tree.addEventListener('keydown', e => {
    const row = e.target.closest('.tree-row'); if (!row) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectNode(row.dataset.id); }
    if (e.key === 'ArrowRight') { state.expanded.add(row.dataset.id); renderTree(); }
    if (e.key === 'ArrowLeft')  { state.expanded.delete(row.dataset.id); renderTree(); }
  });
  $('#tree-filter').addEventListener('input', e => { state.filter = e.target.value; renderTree(); });
  $('#add-cluster-btn').addEventListener('click', addCluster);
  $('#topbar-add').addEventListener('click', addCluster);
}

function selectNode(id) {
  if (state.selectedNodeId === id) return;
  state.selectedNodeId = id; state.editing = new Set();
  save(); renderTree(); renderInfo(); renderActivities();
}

/* ---------- press-and-hold drag with free reparenting -------------------- */
let drag = null;
function bindDrag() {
  const tree = $('#tree');
  tree.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const row = e.target.closest('.tree-row');
    if (!row || e.target.closest('button, input')) return;
    const id = row.dataset.id;
    const startX = e.clientX, startY = e.clientY;
    let holdTimer = null;

    const activate = (x, y) => {
      if (drag?.active || drag?.nodeId !== id) return;
      const node = nodeById(id); if (!node) return;
      drag.active = true;
      row.classList.add('is-dragging');
      document.body.classList.add('is-dragging');
      const ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      ghost.innerHTML = `<span class="node-icon ${node.type === 'cluster' ? 'type-cluster' : 'type-swc'}">${node.type === 'cluster' ? ICON.layers : ICON.chip}</span><span>${esc(nodeName(node))}</span>`;
      document.body.appendChild(ghost);
      const line = document.createElement('div');
      line.className = 'drop-line'; line.style.display = 'none';
      document.body.appendChild(line);
      drag.ghost = ghost; drag.line = line; drag.node = node;
      drag.banned = new Set([id, ...descendants(node)]);
      moveGhost(x, y);
    };

    drag = {
      nodeId:id, row, startX, startY, active:false, x:startX, y:startY,
      lastX:startX, lastY:startY, target:null, mode:null, valid:false, raf:0
    };
    holdTimer = setTimeout(() => { if (drag && !drag.active) activate(drag.lastX, drag.lastY); }, 150);
    drag.holdTimer = holdTimer;

    const onMove = ev => {
      if (!drag || drag.nodeId !== id) return;
      drag.lastX = ev.clientX; drag.lastY = ev.clientY;
      if (!drag.active) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) {
          clearTimeout(holdTimer); activate(ev.clientX, ev.clientY);
        } else return;
      }
      ev.preventDefault();
      drag.x = ev.clientX; drag.y = ev.clientY;
      if (!drag.raf) drag.raf = requestAnimationFrame(dragFrame);
    };
    const onUp = ev => {
      clearTimeout(holdTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!drag || drag.nodeId !== id) return;
      if (drag.active) {
        suppressClickUntil = Date.now() + 350;
        if (drag.valid && (drag.target || drag.mode === 'root')) applyDrop();
        cleanupDrag();
      }
      else { selectNode(id); drag = null; }
    };
    window.addEventListener('pointermove', onMove, { passive:false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
}
function moveGhost(x, y) {
  if (!drag?.ghost) return;
  drag.ghost.style.transform = `translate3d(${x + 14}px, ${y - 17}px, 0)`;
}
function dragFrame() {
  if (!drag?.active) return;
  drag.raf = 0;
  moveGhost(drag.x, drag.y);
  computeDrop(drag.x, drag.y);
  autoScroll();
  if (drag?.active) drag.raf = requestAnimationFrame(dragFrame);
}
function computeDrop(x, y) {
  const el = document.elementFromPoint(x, y);
  const row = el?.closest('.tree-row');
  const treeScroll = $('#tree-scroll');
  const r0 = treeScroll.getBoundingClientRect();
  const insideTree = x >= r0.left && x <= r0.right && y >= r0.top && y <= r0.bottom;

  // only touch the previously highlighted row — no full-tree query each frame
  if (drag.marked) drag.marked.classList.remove('drop-inside', 'drop-invalid');
  drag.marked = null;
  if (!drag.line) return;

  if (row && insideTree) {
    const id = row.dataset.id;
    const rect = row.getBoundingClientRect();
    const rel = (y - rect.top) / rect.height;
    const mode = rel < .27 ? 'before' : rel > .73 ? 'after' : 'inside';
    const valid = !drag.banned.has(id);
    drag.target = id; drag.mode = mode; drag.valid = valid;

    if (!valid) { row.classList.add('drop-invalid'); drag.marked = row; drag.line.style.display = 'none'; return; }
    if (mode === 'inside') {
      row.classList.add('drop-inside'); drag.marked = row; drag.line.style.display = 'none';
    } else {
      const top = mode === 'before' ? rect.top : rect.bottom;
      const left = Math.max(r0.left + 8, rect.left - 4);
      drag.line.style.display = 'block';
      drag.line.style.width = `${Math.max(60, r0.right - left - 14)}px`;
      drag.line.style.transform = `translate3d(${left}px, ${top - 1}px, 0)`;
    }
  } else if (insideTree) {
    // empty space below the last node → append to root level
    drag.target = null; drag.mode = 'root'; drag.valid = true;
    drag.line.style.display = 'block';
    drag.line.style.width = `${r0.width - 26}px`;
    drag.line.style.transform = `translate3d(${r0.left + 13}px, ${Math.min(y, r0.bottom - 6)}px, 0)`;
  } else {
    drag.target = null; drag.valid = false; drag.line.style.display = 'none';
  }
}
function autoScroll() {
  const box = $('#tree-scroll');
  const r = box.getBoundingClientRect();
  if (drag.y < r.top + 34) box.scrollTop -= 9;
  else if (drag.y > r.bottom - 34) box.scrollTop += 9;
}
function applyDrop() {
  const p = activeProject(); if (!p) return;
  const id = drag.nodeId, mode = drag.mode, targetId = drag.target;
  const label = nodeName(drag.node);
  const moved = detach(p.nodes, id);
  if (!moved) return;
  if (mode === 'root' || !targetId) {
    p.nodes.push(moved);
  } else {
    const t = findNode(p.nodes, targetId);
    if (!t) { p.nodes.push(moved); }
    else if (mode === 'inside') {
      t.node.children = t.node.children || [];
      t.node.children.push(moved);
      state.expanded.add(targetId);
    } else {
      t.list.splice(t.index + (mode === 'after' ? 1 : 0), 0, moved);
    }
  }
  state.selectedNodeId = id;
  const where = mode === 'inside' ? `into "${nodeName(nodeById(targetId) || {name:'root'})}"` : mode === 'root' ? 'to root level' : 'to a new position';
  commit('Node moved', `"${label}" moved ${where}`, activeProject()?.name, label);
  renderWorkspace();
  toast(`"${label}" moved ${where}`);
}
function cleanupDrag() {
  drag?.ghost?.remove(); drag?.line?.remove();
  drag?.row?.classList.remove('is-dragging');
  document.body.classList.remove('is-dragging');
  $$('.tree-row.drop-inside, .tree-row.drop-invalid').forEach(r => r.classList.remove('drop-inside', 'drop-invalid'));
  if (drag?.raf) cancelAnimationFrame(drag.raf);
  drag = null;
}

/* ==========================================================================
   COLUMN 2 — NODE INFORMATION (3 editable blocks)
   ========================================================================== */
function valueHTML(field, value) {
  if (value === '' || value === undefined || value === null) return `<div class="field-value empty">Not set</div>`;
  if (field.display === 'pill') {
    return `<span class="pill-value v-${slug(value)}"><i></i>${esc(value)}</span>`;
  }
  if (field.display === 'progress') {
    const n = Math.max(0, Math.min(100, Number(value) || 0));
    return `<div class="progress-row"><div class="progress-track"><div class="progress-fill" style="width:${n}%"></div></div><span class="progress-num">${n}%</span></div>`;
  }
  const cls = `field-value${field.mono ? ' mono' : ''}${field.type === 'textarea' ? ' multiline' : ''}`;
  return `<div class="${cls}">${esc(value)}</div>`;
}
function editFieldHTML(field, value) {
  const full = field.full ? ' full' : '';
  let control;
  if (field.type === 'textarea') {
    control = `<textarea data-key="${field.k}" rows="3">${esc(value)}</textarea>`;
  } else if (field.type === 'select') {
    control = `<select data-key="${field.k}">${field.options.map(o => `<option value="${esc(o)}" ${String(value) === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  } else {
    control = `<input data-key="${field.k}" type="${field.type === 'number' ? 'number' : 'text'}" ${field.type === 'number' ? 'min="0" max="100"' : ''} value="${esc(value)}" autocomplete="off">`;
  }
  return `<div class="edit-field${full}"><label>${esc(field.label)}</label>${control}</div>`;
}
function renderInfo() {
  const p = activeProject();
  const host = $('#info-scroll');
  const actions = $('#info-head-actions');
  const n = p ? nodeById(state.selectedNodeId) : null;
  if (!n) {
    actions.innerHTML = '';
    host.innerHTML = `<div class="info-empty"><div class="empty-orb">${ICON.layers}</div><h3>No node selected</h3><p>Select a Cluster or SWC in the project tree to view and edit its information.</p></div>`;
    return;
  }
  const found = findNode(p.nodes, n.id);
  const path = [...(found?.path || []), n].map(nodeName).join(' / ');
  const isCluster = n.type === 'cluster';

  actions.innerHTML = `<button class="block-edit" id="edit-all">${ICON.pencil} ${state.editing.size === 3 ? 'Close all' : 'Edit all'}</button>`;
  $('#edit-all').addEventListener('click', () => {
    state.editing = state.editing.size === 3 ? new Set() : new Set(BLOCKS.map(b => b.key));
    renderInfo();
  });

  const hero = `<div class="info-hero">
    <div class="info-hero-top">
      <span class="type-badge ${isCluster ? 'cluster' : 'swc'}"><i></i>${isCluster ? 'CLUSTER' : 'SWC'}</span>
      <span class="info-path">${esc(p.name)} &nbsp;/&nbsp; ${esc(path)}</span>
    </div>
    <h1>${esc(nodeName(n))}</h1>
    <div class="info-hero-meta">
      <span><code>${esc(n.data.basic.code || '—')}</code></span>
      <span>${ICON.user} ${esc(n.data.basic.owner || 'Unassigned')}</span>
      <span>${ICON.calendar} ${esc(n.data.plan.targetSop || 'No SOP')}</span>
      <span>${n.children.length} child node${n.children.length === 1 ? '' : 's'}</span>
    </div>
  </div>`;

  const blocks = BLOCKS.map(b => {
    const editing = state.editing.has(b.key);
    const d = n.data[b.key] || {};
    const body = editing
      ? `<div class="edit-grid">${b.fields.map(f => editFieldHTML(f, d[f.k] ?? '')).join('')}</div>
         <div class="edit-actions">
           <button class="btn btn-ghost btn-sm" data-cancel="${b.key}">Cancel</button>
           <button class="btn btn-primary btn-sm" data-save="${b.key}">Save changes</button>
         </div>`
      : `<div class="field-grid">${b.fields.map(f => `<div class="field${f.full ? ' full' : ''}"><span class="field-label">${esc(f.label)}</span>${valueHTML(f, d[f.k])}</div>`).join('')}</div>`;
    return `<section class="info-block ${editing ? 'is-editing' : ''}" data-block="${b.key}">
      <div class="block-head">
        <div class="block-head-left"><span class="block-num">${b.num}</span><div><h3 class="block-title">${b.title}</h3><p class="block-sub">${b.sub}</p></div></div>
        ${editing ? '' : `<button class="block-edit" data-edit="${b.key}">${ICON.pencil} Edit</button>`}
      </div>
      <div class="block-body">${body}</div>
    </section>`;
  }).join('');

  host.innerHTML = hero + blocks;
  $$('[data-edit]', host).forEach(b => b.addEventListener('click', () => { state.editing.add(b.dataset.edit); renderInfo(); }));
  $$('[data-cancel]', host).forEach(b => b.addEventListener('click', () => { state.editing.delete(b.dataset.cancel); renderInfo(); }));
  $$('[data-save]', host).forEach(b => b.addEventListener('click', () => saveBlock(b.dataset.save)));
  host.querySelectorAll('input[data-key], select[data-key], textarea[data-key]').forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.tagName !== 'TEXTAREA') { e.preventDefault(); saveBlock(inp.closest('.info-block').dataset.block); } });
  });
}
function saveBlock(key) {
  const n = nodeById(state.selectedNodeId); if (!n) return;
  const block = $(`.info-block[data-block="${key}"]`); if (!block) return;
  const definition = BLOCKS.find(b => b.key === key);
  n.data[key] = n.data[key] || {};
  block.querySelectorAll('[data-key]').forEach(inp => {
    let v = inp.value;
    if (inp.type === 'number') v = Math.max(0, Math.min(100, Number(v) || 0));
    n.data[key][inp.dataset.key] = v.trim ? v.trim() : v;
  });
  if (key === 'basic' && n.data.basic.name) n.name = n.data.basic.name;
  state.editing.delete(key);
  commit('Information updated', definition.title, activeProject()?.name, nodeName(n));
  renderTree(); renderInfo(); renderActivities();
  toast(`${definition.title} saved`);
}

/* ==========================================================================
   COLUMN 3 — QUALITY ACTIVITIES
   ========================================================================== */
function activitiesFor(nodeId) {
  const p = activeProject();
  p.activities = p.activities || {};
  if (!p.activities[nodeId]) {
    p.activities[nodeId] = ACTIVITY_TEMPLATE.map(a => ({ ...a, done:a.tasks.map(() => false) }));
  }
  return p.activities[nodeId];
}
function renderActivities() {
  const host = $('#activity-scroll');
  const n = nodeById(state.selectedNodeId);
  if (!n) { host.innerHTML = `<div class="activity-context">Select a node to see its activities.</div>`; return; }
  const list = activitiesFor(n.id);
  const context = `<div class="activity-context">Scoped to <strong>${esc(nodeName(n))}</strong> &middot; ${n.type === 'cluster' ? 'Cluster' : 'SWC'}</div>`;
  host.innerHTML = context + list.map(a => {
    const total = a.tasks.length;
    const done = a.done.filter(Boolean).length;
    const pct = Math.round(done / total * 100);
    const open = state.openActivity.has(a.id);
    const tasks = a.tasks.map((t, i) => `<div class="ac-task ${a.done[i] ? 'done' : ''}" data-act="${a.id}" data-task="${i}">
        <span class="ac-check">${ICON.check}</span><span class="ac-task-label">${esc(t)}</span><span class="ac-task-tag">${a.done[i] ? 'DONE' : 'OPEN'}</span>
      </div>`).join('');
    return `<article class="activity-card ${a.color} ${open ? 'is-open' : ''}" data-card="${a.id}">
      <div class="ac-head">
        <span class="ac-icon">${ICON[a.icon]}</span>
        <div class="ac-main">
          <div class="ac-title-row"><span class="ac-title">${esc(a.title)}</span><span class="ac-chevron">${ICON.chevDown}</span></div>
          <p class="ac-desc">${esc(a.desc)}</p>
          <span class="ac-status ${a.statusClass}"><i></i>${esc(a.status)}</span>
        </div>
      </div>
      <div class="ac-progress">
        <div class="ac-progress-top"><span>Completion</span><b>${done} / ${total}</b></div>
        <div class="ac-track"><div class="ac-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="ac-meta"><span>${ICON.user} ${esc(a.owner)}</span><span>${ICON.calendar} ${esc(a.due)}</span></div>
      <div class="ac-detail">${tasks || '<div class="ac-detail-empty">No tasks defined yet.</div>'}</div>
    </article>`;
  }).join('');

  $$('.ac-head', host).forEach(h => h.addEventListener('click', () => {
    const id = h.closest('.activity-card').dataset.card;
    state.openActivity.has(id) ? state.openActivity.delete(id) : state.openActivity.add(id);
    h.closest('.activity-card').classList.toggle('is-open');
  }));
  $$('.ac-task', host).forEach(t => t.addEventListener('click', () => {
    const a = list.find(x => x.id === t.dataset.act);
    const i = Number(t.dataset.task);
    a.done[i] = !a.done[i];
    commit('Task updated', `${a.title}: "${a.tasks[i]}" ${a.done[i] ? 'completed' : 'reopened'}`, activeProject()?.name, nodeName(n));
    renderActivities();
  }));
}

/* ==========================================================================
   DATA & RECORDS — portable, file-based persistence (no server required)
   --------------------------------------------------------------------------
   The browser cache is a working copy, never the master copy. A .sqt.json
   snapshot is the source of truth and can live on any IT-approved drive.
   ========================================================================== */
let linkedHandle = null;      // in-session file handle for auto-save (Chromium)
let autosaveTimer = 0;
let pendingImportMode = 'replace';

const DICON = {
  save   : I('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>', 18),
  doc    : I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>'),
  table  : I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M15 10v10"/>'),
  list   : I('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  shield : I('<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>', 17),
  alert  : I('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>', 17),
  folder : I('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>'),
};

/* --- UI-only persistence (selection, expansion, view) -------------------- */
function save() { persist(); updateSaveStatus(); }

/* --- a meaningful change: log it, checkpoint it, mark the file stale ------ */
function logChange(action, detail, project, node) {
  state.log.unshift({
    id:uid(), ts:nowISO(), by:state.settings.author || 'QA',
    action, detail:detail || '', project:project || '—', node:node || '—'
  });
  if (state.log.length > 500) state.log.length = 500;
}
function commit(action, detail = '', project, node) {
  logChange(action, detail, project || activeProject()?.name || '—', node || '—');
  state.revision += 1;
  state.updatedAt = nowISO();
  state.dirty = true;
  pushSnapshot(action);
  persist();
  updateSaveStatus();
  scheduleAutoSave();
}

/* --- rolling in-browser checkpoints (short-term undo only) --------------- */
function readSnapshots() {
  try { const v = JSON.parse(localStorage.getItem(SNAP_STORE) || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function writeSnapshots(list) {
  try { localStorage.setItem(SNAP_STORE, JSON.stringify(list)); } catch { /* quota — drop checkpoints silently */ }
}
function pushSnapshot(label) {
  const list = readSnapshots();
  const payload = JSON.stringify({ projects:state.projects, log:state.log, settings:state.settings });
  if (list.length && list[0].payload === payload) return;
  list.unshift({ id:uid(), ts:nowISO(), label, revision:state.revision, payload });
  if (list.length > 8) list.length = 8;
  writeSnapshots(list);
}
function snapshotNodeCount(s) {
  try {
    const roots = JSON.parse(s.payload).projects.reduce((a,p) => a.concat(p.nodes || []), []);
    return countTree(roots);
  } catch { return '—'; }
}
function restoreSnapshot(id) {
  const s = readSnapshots().find(x => x.id === id);
  if (!s) return;
  confirmAction('Restore this version?',
    'The current in-browser work will be replaced by this checkpoint. Saved .sqt.json files are not affected.',
    'Restore version', () => {
      try {
        const d = JSON.parse(s.payload);
        state.projects = (d.projects || []).map(normalizeProject);
        state.log = Array.isArray(d.log) ? d.log : [];
        state.settings = { author:'QA', ...(d.settings || {}) };
        state.activeProjectId = null; state.selectedNodeId = null;
        state.expanded = new Set(); state.editing = new Set(); state.openActivity = new Set(); state.filter = '';
        const walk = ns => ns.forEach(n => { if ((n.children||[]).length) { state.expanded.add(n.id); walk(n.children); } });
        state.projects.forEach(p => walk(p.nodes));
        state.revision += 1; state.updatedAt = nowISO(); state.dirty = true;
        logChange('Version restored', `Restored revision ${s.revision} from ${shortTS(s.ts)}`);
        persist(); closeModal(); setView('home'); renderHome(); updateSaveStatus();
        toast('Version restored — save a snapshot to keep it', true);
      } catch (e) { toast('This checkpoint could not be restored', true); }
    });
}

/* --- live backup status --------------------------------------------------- */
function updateSaveStatus() {
  const labelEl = $('#sync-label'), dot = $('#sync-dot'), homeDot = $('#home-dirty-dot');
  let text, warned = false;
  if (linkedHandle) text = 'Auto-saved to file';
  else if (state.dirty) { text = 'Unsaved to file'; warned = true; }
  else if (state.lastExportedAt) text = 'Backed up ' + shortTS(state.lastExportedAt);
  else { text = 'Not backed up'; warned = true; }
  if (labelEl) labelEl.textContent = text;
  if (dot) dot.className = 'dot-live' + (warned ? ' warn' : '');
  if (homeDot) homeDot.classList.toggle('is-on', state.dirty && !linkedHandle);
  $('#topbar-data-btn')?.classList.toggle('is-warn', warned);
}

/* --- snapshot writer ------------------------------------------------------ */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
function countTree(list) { return (list || []).reduce((a,n) => a + 1 + countTree(n.children || []), 0); }
function countAll() { return state.projects.reduce((a,p) => a + countTree(p.nodes || []), 0); }
function buildSnapshot() {
  const workspace = {
    schemaVersion:VERSION,
    projects:state.projects,
    log:state.log,
    settings:state.settings,
    revision:state.revision,
    updatedAt:state.updatedAt,
    viewState:{ activeProjectId:state.activeProjectId, selectedNodeId:state.selectedNodeId, expanded:[...state.expanded] }
  };
  return {
    format:FORMAT, version:VERSION, exportedAt:nowISO(),
    generator:'Software Quality Toolkit / local workspace',
    checksum:fnv1a(JSON.stringify(workspace)),
    stats:{ projects:state.projects.length, nodes:countAll(), records:state.log.length },
    workspace
  };
}
function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type:mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
async function writeHandle(handle, text) {
  const w = await handle.createWritable();
  await w.write(text); await w.close();
}
function markExported() {
  state.dirty = false;
  state.lastExportedAt = nowISO();
  persist();
  updateSaveStatus();
}
function scheduleAutoSave() {
  if (!linkedHandle) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    if (!linkedHandle) return;
    try {
      await writeHandle(linkedHandle, JSON.stringify(buildSnapshot(), null, 2));
      markExported();
    } catch (e) {
      linkedHandle = null;
      updateSaveStatus();
      toast('Auto-save paused — save a snapshot again to resume', true);
    }
  }, 1000);
}
async function saveSnapshot() {
  const filename = `SQT_${stamp()}.sqt.json`;
  const text = () => JSON.stringify(buildSnapshot(), null, 2);
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const h = await window.showSaveFilePicker({
        suggestedName:filename,
        types:[{ description:'SQT Workspace Snapshot', accept:{ 'application/json':['.json'] } }]
      });
      await writeHandle(h, text());
      linkedHandle = h;
      markExported();
      toast('Snapshot saved — auto-save is on for this session');
      openDataCenter('backup');
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;   // user cancelled the picker
      // unsupported or denied on file:// → fall back to a normal download
    }
  }
  downloadText(filename, text(), 'application/json;charset=utf-8');
  markExported();
  toast('Snapshot downloaded — move it into your project folder');
  openDataCenter('backup');
}

/* --- snapshot reader ------------------------------------------------------ */
function validateSnapshot(d) {
  if (!d || typeof d !== 'object') throw new Error('The file is not valid JSON.');
  if (d.format !== FORMAT) throw new Error('This is not a Software Quality Toolkit snapshot.');
  if (!d.workspace || !Array.isArray(d.workspace.projects)) throw new Error('The snapshot contains no project data.');
  return d.workspace;
}
function normalizeNode(n) {
  n = n || {};
  return {
    id:n.id || uid(), type:n.type === 'cluster' ? 'cluster' : 'swc',
    name:n.name || 'Untitled',
    children:Array.isArray(n.children) ? n.children.map(normalizeNode) : [],
    data:{ basic:{...(n.data?.basic || {})}, plan:{...(n.data?.plan || {})}, risk:{...(n.data?.risk || {})} }
  };
}
function normalizeProject(p) {
  p = p || {};
  return {
    id:p.id || uid(), name:p.name || 'Untitled Project', code:p.code || '—',
    owner:p.owner || 'Unassigned', updated:p.updated || '—',
    nodes:Array.isArray(p.nodes) ? p.nodes.map(normalizeNode) : [],
    activities:p.activities || {}
  };
}
function pickImport(mode) {
  pendingImportMode = mode;
  const input = $('#import-file');
  input.value = '';
  input.click();
}
async function handleImportFile(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ws = validateSnapshot(data);
    const checksumOK = typeof data.checksum === 'string' && data.checksum === fnv1a(JSON.stringify(ws));
    applyImported(data, file.name, pendingImportMode, checksumOK);
    if (!checksumOK) toast('Snapshot was edited outside the toolkit — opened with a warning', true);
  } catch (e) {
    toast(`Could not open snapshot: ${e.message}`, true);
  }
}
function applyImported(data, filename, mode, checksumOK) {
  const ws = data.workspace;
  const incoming = ws.projects.map(normalizeProject);
  const suffix = checksumOK ? '' : ' (checksum warning)';
  if (mode === 'merge') {
    const ids = new Set(state.projects.map(p => p.id));
    incoming.forEach(p => {
      if (ids.has(p.id)) { p.id = uid(); }
      ids.add(p.id); state.projects.push(p);
    });
    state.log = [...(Array.isArray(ws.log) ? ws.log : []), ...state.log].slice(0, 500);
    state.revision += 1; state.updatedAt = nowISO(); state.dirty = true;
    logChange('Snapshot merged', `${incoming.length} project(s) imported from ${filename}${suffix}`);
  } else {
    state.projects = incoming;
    state.log = Array.isArray(ws.log) ? ws.log.slice(0, 500) : [];
    state.settings = { author:'QA', ...(ws.settings || {}) };
    state.revision = Number(ws.revision) || 1;
    state.updatedAt = ws.updatedAt || nowISO();
    state.activeProjectId = ws.viewState?.activeProjectId || null;
    state.selectedNodeId  = ws.viewState?.selectedNodeId || null;
    state.expanded = new Set(ws.viewState?.expanded || []);
    state.editing = new Set(); state.openActivity = new Set(); state.filter = '';
    state.dirty = false;
    state.lastExportedAt = nowISO();
    logChange('Snapshot opened', `Workspace replaced by ${filename} — ${incoming.length} project(s)${suffix}`);
  }
  pushSnapshot('Snapshot ' + mode);
  persist();
  closeModal();
  setView('home'); renderHome(); updateSaveStatus();
  toast(mode === 'merge' ? 'Projects merged into this workspace' : 'Workspace restored from file');
}

/* --- human-readable records ----------------------------------------------- */
const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csvFrom = rows => '\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
function activityCounts(p, nodeId) {
  return ACTIVITY_TEMPLATE.map(a => {
    const rec = (p.activities?.[nodeId] || []).find(x => x.id === a.id);
    return rec ? `${rec.done.filter(Boolean).length}/${rec.tasks.length}` : `0/${a.tasks.length}`;
  });
}
function flatRows() {
  const rows = [['Project','Project Code','Path','Type','Node Name','Node ID','Owner','Status','Baseline','Supplier',
    'Quality Owner','Target SOP','Review Cycle','Coverage Goal','Plan Completion %','Risk Level','Probability','Impact',
    'Risk Owner','Next Review','KPI Monitoring','SWA Audit','PPA Release','Description','Deliverables','Mitigation Plan','Assessment Notes']];
  state.projects.forEach(p => {
    const walk = (list, path) => (list || []).forEach(n => {
      const b = n.data?.basic || {}, pl = n.data?.plan || {}, r = n.data?.risk || {};
      const acts = activityCounts(p, n.id);
      rows.push([p.name, p.code, [...path, nodeName(n)].join(' / '), n.type === 'cluster' ? 'Cluster' : 'SWC',
        nodeName(n), b.code, b.owner, b.status, b.baseline, b.supplier,
        pl.qualityOwner, pl.targetSop, pl.reviewCycle, pl.coverage, pl.progress,
        r.level, r.probability, r.impact, r.riskOwner, r.nextReview,
        acts[0], acts[1], acts[2], b.description, pl.deliverables, r.mitigation, r.notes]);
      walk(n.children || [], [...path, nodeName(n)]);
    });
    walk(p.nodes || [], []);
  });
  return rows;
}
const mdCell = v => String(v ?? '—').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
function buildRecordMD() {
  const L = [];
  L.push('# Software Quality Toolkit — Quality Record', '');
  L.push(`- Generated: ${shortTS(nowISO())}`);
  L.push(`- Recorded by: ${state.settings.author || 'QA'}`);
  L.push(`- Revision: ${state.revision}`);
  L.push(`- Projects: ${state.projects.length} · Nodes: ${countAll()} · Log entries: ${state.log.length}`, '');
  L.push('> This is a human-readable record. The authoritative data is the accompanying `.sqt.json` snapshot.', '');
  state.projects.forEach((p, i) => {
    L.push(`## ${i + 1}. ${p.name} (${p.code})`, '');
    L.push(`Owner: ${p.owner} · Last updated: ${p.updated} · ${countTree(p.nodes)} nodes`, '');
    L.push('| Path | Type | ID | Owner | Status | Baseline | Risk | Plan | KPI | SWA | PPA |');
    L.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    const walk = (list, path) => (list || []).forEach(n => {
      const b = n.data?.basic || {}, pl = n.data?.plan || {}, r = n.data?.risk || {};
      const acts = activityCounts(p, n.id);
      L.push(`| ${mdCell([...path, nodeName(n)].join(' / '))} | ${n.type === 'cluster' ? 'Cluster' : 'SWC'} | ${mdCell(b.code)} | ${mdCell(b.owner)} | ${mdCell(b.status)} | ${mdCell(b.baseline)} | ${mdCell(r.level)} | ${pl.progress ?? '—'}% | ${acts[0]} | ${acts[1]} | ${acts[2]} |`);
      walk(n.children || [], [...path, nodeName(n)]);
    });
    walk(p.nodes || [], []);
    L.push('', '### Quality plan & risk notes', '');
    const walk2 = (list, path) => (list || []).forEach(n => {
      const b = n.data?.basic || {}, pl = n.data?.plan || {}, r = n.data?.risk || {};
      L.push(`#### ${[...path, nodeName(n)].join(' / ')}`, '');
      L.push(`- Description: ${mdCell(b.description)}`);
      L.push(`- Deliverables: ${mdCell(pl.deliverables)}`);
      L.push(`- Mitigation: ${mdCell(r.mitigation)}`);
      L.push(`- Assessment notes: ${mdCell(r.notes)}`, '');
      walk2(n.children || [], [...path, nodeName(n)]);
    });
    walk2(p.nodes || [], []);
  });
  L.push('## Change log', '');
  L.push('| Timestamp | By | Action | Project | Node | Detail |');
  L.push('| --- | --- | --- | --- | --- | --- |');
  if (!state.log.length) L.push('| — | — | No changes recorded | — | — | — |');
  state.log.forEach(e => L.push(`| ${shortTS(e.ts)} | ${mdCell(e.by)} | ${mdCell(e.action)} | ${mdCell(e.project)} | ${mdCell(e.node)} | ${mdCell(e.detail)} |`));
  L.push('');
  return L.join('\n');
}
function buildLogCSV() {
  const rows = [['Timestamp (ISO)','Recorded by','Action','Project','Node','Detail']];
  state.log.forEach(e => rows.push([e.ts, e.by, e.action, e.project, e.node, e.detail]));
  return csvFrom(rows);
}

/* --- Data & Records center UI --------------------------------------------- */
function backupHTML() {
  return `
    <p class="dc-lead">The browser keeps a working copy so the toolkit feels instant. <strong style="color:var(--text-2)">The file is the master copy</strong> — store it on an IT-approved drive and it survives browser resets, new PCs and colleague hand-over.</p>
    <div class="dc-hero">
      <span class="dc-hero-icon">${DICON.save}</span>
      <div class="dc-hero-copy"><strong>Save snapshot to file</strong><p>A portable <code>.sqt.json</code> containing every project, tree, plan, risk, activity and change-log entry. Where supported, later edits auto-save to that same file.</p></div>
      <button class="btn btn-primary btn-sm" id="dc-save-main">Save snapshot</button>
    </div>
    <div class="dc-section-title">Open an existing snapshot</div>
    <div class="dc-inline">
      <div class="dc-field"><label>Recorded by / author</label><input id="dc-author" type="text" value="${esc(state.settings.author || 'QA')}" autocomplete="off"></div>
      <button class="btn btn-outline btn-sm" id="dc-import-replace">Replace with file</button>
      <button class="btn btn-outline btn-sm" id="dc-import-merge">Merge projects</button>
    </div>
    <p class="dc-lead" style="margin-top:8px">Author is stamped into every log entry. <em>Replace</em> swaps the whole workspace; <em>Merge</em> only appends projects.</p>
    <div class="dc-section-title">Export human-readable records</div>
    <div class="dc-grid">
      <button class="dc-card" id="dc-export-md"><i>${DICON.doc}</i><strong>Quality Record</strong><small>Audit-style report: structure, plans, risks, activity progress and the full change log.</small><span class="dc-ext">.md</span></button>
      <button class="dc-card" id="dc-export-csv"><i>${DICON.table}</i><strong>Node Register</strong><small>Flat table of every Cluster / SWC with all fields. Opens directly in Excel.</small><span class="dc-ext">.csv</span></button>
      <button class="dc-card" id="dc-export-log"><i>${DICON.list}</i><strong>Change Log</strong><small>Attributed activity history for reviews, hand-over and traceability.</small><span class="dc-ext">.csv</span></button>
    </div>`;
}
function versionsHTML() {
  const list = readSnapshots();
  return `
    <p class="dc-lead">Automatic in-browser checkpoints are taken after every change. They are for undoing a mistake during the day — <strong style="color:var(--text-2)">not a backup</strong>.</p>
    <div class="dc-note"><b>Browser-only.</b> Clearing site data, switching browser or moving to a new PC removes every checkpoint. Only a saved <code>.sqt.json</code> file is durable.</div>
    <div class="dc-section-title">Checkpoints · ${list.length} / 8</div>
    ${list.length
      ? list.map(s => `<div class="dc-row"><span class="dc-time">${esc(shortTS(s.ts))}</span><div class="dc-row-main"><strong>${esc(s.label)}</strong><span>Revision ${s.revision} · ${snapshotNodeCount(s)} nodes captured</span></div><button class="btn btn-ghost btn-sm" data-restore="${s.id}">Restore</button></div>`).join('')
      : '<div class="dc-empty">No checkpoints yet.<br>They appear as soon as you make a change.</div>'}`;
}
function logHTML() {
  const rows = state.log.slice(0, 200).map(e => `<tr><td>${esc(shortTS(e.ts))}</td><td>${esc(e.by)}</td><td class="dc-action">${esc(e.action)}</td><td>${esc(e.project)}</td><td>${esc(e.node)}</td><td>${esc(e.detail)}</td></tr>`).join('');
  return `
    <p class="dc-lead">Every structural change, information edit and task update is stamped with a timestamp and author. The log is stored inside the snapshot, so history travels with the data.</p>
    <div class="dc-inline" style="margin-bottom:14px">
      <div class="dc-field"><label>Entries retained</label><input type="text" value="${state.log.length} of max 500" readonly></div>
      <button class="btn btn-outline btn-sm" id="dc-log-export">Download change log (.csv)</button>
      <button class="btn btn-ghost btn-sm" id="dc-log-clear">Clear log</button>
    </div>
    <div class="dc-log-wrap"><table class="dc-log"><thead><tr><th>Time</th><th>By</th><th>Action</th><th>Project</th><th>Node</th><th>Detail</th></tr></thead><tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-4);padding:24px">No changes recorded yet.</td></tr>'}</tbody></table></div>`;
}
function guideHTML() {
  return `
    <p class="dc-lead">No server, no deployment, no account. The toolkit is a local HTML file; your data is a separate file you own. Keep both in a folder your company already approves — a mapped network drive, a managed sync folder, or a controlled project repository.</p>
    <div class="dc-section-title">Recommended routine</div>
    <ol class="dc-guide">
      <li><strong>Keep the toolkit and the data together</strong><p>One folder holding <code>SoftwareQualityToolkit.html</code>, <code>styles.css</code>, <code>app.js</code>, <code>assets/</code> and your <code>.sqt.json</code> file. Zip the folder to hand over to a colleague — it runs by double-clicking the HTML, with nothing installed.</p></li>
      <li><strong>Save a snapshot at the end of every session</strong><p>Use the button on the Backup tab. Keep dated copies rather than overwriting the only copy — the filename already includes a timestamp. Never treat the browser cache as the master.</p></li>
      <li><strong>Export a record for reviews</strong><p>Quality Record (.md) for meeting minutes and audits, Node Register (.csv) for Excel tracking, Change Log (.csv) for traceability. These are readable without the toolkit.</p></li>
      <li><strong>Keep at least two copies in two places</strong><p>For example the approved network drive plus a local working copy. Version checkpoints here only cover mistakes made in the last few minutes, not a lost or reimaged machine.</p></li>
      <li><strong>Set the author before entering real data</strong><p>Change-log entries carry whoever is recorded in the Backup tab. Agree on a naming convention with the team so records stay attributable.</p></li>
    </ol>
    <div class="dc-section-title">What a snapshot contains</div>
    <div class="dc-note" style="border-color:var(--blue-line);background:var(--blue-soft)"><b style="color:#a9baff">Self-contained.</b> Project tree, all three information blocks, activity checklists, view state, revision, author and the full change log — plus a checksum that detects a file edited outside the toolkit. No external references, no network calls.</div>
    <div class="dc-section-title">Workspace</div>
    <div class="dc-row">
      <div class="dc-row-main"><strong>Start an empty workspace</strong><span>Removes the built-in sample projects before you enter real company data. Saved snapshot files stay untouched.</span></div>
      <button class="btn btn-ghost btn-sm" id="dc-empty">Clear samples</button>
    </div>`;
}
function dataCenterHTML(tab) {
  const tabs = [['backup','Backup & export'],['versions','Version history'],['log','Change log'],['guide','Safe-keeping guide']];
  const warned = state.dirty && !linkedHandle;
  const statusTitle = linkedHandle ? 'Auto-save to file is ON for this session'
    : state.dirty ? 'You have changes that exist only in this browser'
    : state.lastExportedAt ? 'Your workspace is backed up to a file'
    : 'No file backup has been made yet';
  const statusSub = linkedHandle ? 'Every change is written to the linked snapshot file.'
    : state.dirty ? 'Save a snapshot before you close this browser or switch machines.'
    : state.lastExportedAt ? 'Open the snapshot on any computer to continue exactly where you left off.'
    : 'Save your first snapshot to create a durable master copy.';
  const body = tab === 'versions' ? versionsHTML() : tab === 'log' ? logHTML() : tab === 'guide' ? guideHTML() : backupHTML();
  return `
    <div class="modal-head">
      <div><h2>Data &amp; Records</h2><p>Your workspace lives in a file you control — no server required.</p></div>
      <button class="modal-close" aria-label="Close">${ICON.close}</button>
    </div>
    <div class="dc-status ${warned ? 'is-warn' : ''}">
      <span class="dc-status-icon">${warned ? DICON.alert : DICON.shield}</span>
      <div class="dc-status-copy"><strong>${statusTitle}</strong><span>${statusSub}</span></div>
      <div class="dc-status-meta">REV ${state.revision}<br>${state.projects.length} projects · ${countAll()} nodes<br>${state.lastExportedAt ? 'FILE ' + esc(shortTS(state.lastExportedAt)) : 'FILE —'}</div>
    </div>
    <nav class="dc-tabs">${tabs.map(([k,label]) => `<button class="dc-tab ${tab === k ? 'is-active' : ''}" data-tab="${k}">${label}</button>`).join('')}</nav>
    <div class="dc-body">${body}</div>
    <div class="modal-actions"><button class="btn btn-ghost" id="dc-close">Close</button><button class="btn btn-primary" id="dc-save">Save snapshot to file</button></div>`;
}
function mountDataCenter(o, tab) {
  $$('.dc-tab', o).forEach(b => b.addEventListener('click', () => openDataCenter(b.dataset.tab)));
  $('#dc-close', o).addEventListener('click', closeModal);
  $('#dc-save', o).addEventListener('click', saveSnapshot);
  $('#dc-save-main', o)?.addEventListener('click', saveSnapshot);
  const author = $('#dc-author', o);
  author?.addEventListener('change', () => {
    const v = author.value.trim() || 'QA';
    if (v === state.settings.author) return;
    state.settings.author = v;
    commit('Author changed', `Change-log author set to ${v}`);
    toast(`Recorded by: ${v}`);
  });
  $('#dc-import-replace', o)?.addEventListener('click', () => pickImport('replace'));
  $('#dc-import-merge', o)?.addEventListener('click', () => pickImport('merge'));
  $('#dc-export-md', o)?.addEventListener('click', () => {
    downloadText(`SQT_QualityRecord_${stamp()}.md`, buildRecordMD(), 'text/markdown;charset=utf-8');
    toast('Quality Record exported');
  });
  $('#dc-export-csv', o)?.addEventListener('click', () => {
    downloadText(`SQT_NodeRegister_${stamp()}.csv`, csvFrom(flatRows()), 'text/csv;charset=utf-8');
    toast('Node Register exported');
  });
  $('#dc-export-log', o)?.addEventListener('click', () => {
    downloadText(`SQT_ChangeLog_${stamp()}.csv`, buildLogCSV(), 'text/csv;charset=utf-8');
    toast('Change Log exported');
  });
  $('#dc-log-export', o)?.addEventListener('click', () => {
    downloadText(`SQT_ChangeLog_${stamp()}.csv`, buildLogCSV(), 'text/csv;charset=utf-8');
    toast('Change Log exported');
  });
  $('#dc-empty', o)?.addEventListener('click', () => confirmAction('Start an empty workspace?',
    'All current projects and change-log entries in this browser will be removed. Saved snapshot files stay untouched.',
    'Clear workspace', () => {
      state.projects = []; state.log = []; state.activeProjectId = null; state.selectedNodeId = null;
      state.expanded = new Set(); state.editing = new Set(); state.openActivity = new Set();
      state.revision += 1; state.updatedAt = nowISO(); state.dirty = true;
      logChange('Workspace cleared', 'Sample projects removed — ready for company data');
      persist(); closeModal(); setView('home'); renderHome(); updateSaveStatus();
      toast('Empty workspace ready');
    }));
  $$('[data-restore]', o).forEach(b => b.addEventListener('click', () => restoreSnapshot(b.dataset.restore)));
  $('#dc-log-clear', o)?.addEventListener('click', () => confirmAction('Clear the change log?',
    'Existing records will be removed from the browser and from future snapshots. Export a copy first if you need it.',
    'Clear log', () => {
      state.log = []; state.revision += 1; state.dirty = true; state.updatedAt = nowISO();
      logChange('Change log cleared', `Cleared by ${state.settings.author}`);
      persist(); openDataCenter('log'); toast('Change log cleared', true);
    }));
}
function openDataCenter(tab = 'backup') {
  openModal(dataCenterHTML(tab), o => mountDataCenter(o, tab), true);
}

/* ==========================================================================
   BOOT
   ========================================================================== */
function renderWorkspace() {
  const p = activeProject(); if (!p) return;
  $('#topbar-project-name').textContent = p.name;
  $('#topbar-project-code').textContent = p.code;
  renderTree(); renderInfo(); renderActivities();
}
function boot() {
  if (!load()) resetData(true);
  // back-arrow icon
  $('#back-btn').innerHTML = ICON.back;
  $('#add-cluster-btn').innerHTML = ICON.plus;
  $('#home-open-btn').addEventListener('click', () => openProject(state.projects[0]?.id));
  $('#hero-open-btn').addEventListener('click', () => openProject(state.projects[0]?.id));
  $('#add-project-btn').addEventListener('click', showAddProject);
  $('#back-btn').addEventListener('click', goHome);
  $('#home-data-btn').addEventListener('click', () => openDataCenter('backup'));
  $('#topbar-data-btn').addEventListener('click', () => openDataCenter('backup'));
  $('#import-file').addEventListener('change', e => { handleImportFile(e.target.files?.[0]); e.target.value = ''; });
  $('#reset-btn').addEventListener('click', () => { resetData(); goHome(); toast('Sample data restored', true); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#overlay').classList.contains('is-open')) { closeModal(); return; }
    if (state.inlineAdd !== undefined) { cancelInline(); return; }
    if (state.editing.size) { state.editing = new Set(); renderInfo(); return; }
    if (drag?.active) { cleanupDrag(); return; }
  });
  bindTree(); bindDrag();
  renderHome();
  setView('home');
  updateSaveStatus();
  if (state.dirty && state.lastExportedAt) {
    setTimeout(() => toast('Changes since your last file backup — open Data & Records to save', true), 900);
  }
}

/* small public hook for local automation / round-trip verification */
window.SQT = Object.freeze({
  snapshot: buildSnapshot,
  record: buildRecordMD,
  register: () => csvFrom(flatRows()),
  log: buildLogCSV,
  openDataCenter,
  importText: (text, mode = 'replace', filename = 'snapshot.sqt.json') => {
    const data = JSON.parse(text);
    const ws = validateSnapshot(data);
    const ok = typeof data.checksum === 'string' && data.checksum === fnv1a(JSON.stringify(ws));
    applyImported(data, filename, mode, ok);
    return { checksumOK:ok };
  },
  status: () => ({ dirty:state.dirty, revision:state.revision, entries:state.log.length, projects:state.projects.length, lastExportedAt:state.lastExportedAt })
});
boot();
})();
