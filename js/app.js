// ── State ────────────────────────────────────────────────────────────────────
const state = {
  commune: { name: '', evaluator: '', periodStart: '', date: '' },
  ratings: {},   // axisIndex → number[] (-1 = unrated)
  notes: {},     // axisIndex → string
  qualitative: {},// questionId → string
  currentAxis: 0
};

let radarChart = null;
let barChart   = null;

// ── Boot ─────────────────────────────────────────────────────────────────────
function initApp() {
  AXES.forEach((axis, i) => {
    state.ratings[i] = new Array(axis.indicators.length).fill(-1);
    state.notes[i]   = '';
  });
  QUALITATIVE_QUESTIONS.forEach(q => { state.qualitative[q.id] = ''; });

  document.getElementById('eval-date').value =
    new Date().toISOString().split('T')[0];

  renderProgressSteps();
  renderQualitativeForm();
}

// ── Navigation ────────────────────────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startEvaluation() {
  const nameInput = document.getElementById('commune-name');
  if (!nameInput.value.trim()) {
    nameInput.classList.add('error');
    nameInput.focus();
    return;
  }
  nameInput.classList.remove('error');

  state.commune.name        = nameInput.value.trim();
  state.commune.evaluator   = document.getElementById('evaluator-name').value.trim();
  state.commune.periodStart = document.getElementById('period-start').value;
  state.commune.date        = document.getElementById('eval-date').value;

  document.getElementById('header-score').style.display = 'flex';
  document.getElementById('progress-container').style.display = 'block';
  showScreen('evaluation');
  renderAxis(0);
}

function prevAxis() {
  if (state.currentAxis > 0) renderAxis(state.currentAxis - 1);
}

function nextAxis() {
  if (state.currentAxis < AXES.length - 1) {
    renderAxis(state.currentAxis + 1);
  } else {
    syncQualitativeValues();
    showScreen('qualitative');
  }
}

function showResults() {
  syncQualitativeValues();
  showScreen('results');
  renderResults();
}

function resetApp() {
  if (!confirm('هل تريد بدء تقييم جديد؟ ستُفقد جميع البيانات الحالية.')) return;

  AXES.forEach((axis, i) => {
    state.ratings[i] = new Array(axis.indicators.length).fill(-1);
    state.notes[i]   = '';
  });
  QUALITATIVE_QUESTIONS.forEach(q => { state.qualitative[q.id] = ''; });
  state.commune = { name: '', evaluator: '', periodStart: '', date: '' };

  ['commune-name', 'evaluator-name'].forEach(id =>
    { document.getElementById(id).value = ''; });
  document.getElementById('period-start').value = '';
  document.getElementById('eval-date').value =
    new Date().toISOString().split('T')[0];
  document.getElementById('header-score').style.display = 'none';
  document.getElementById('progress-container').style.display = 'none';

  if (radarChart) { radarChart.destroy(); radarChart = null; }
  if (barChart)   { barChart.destroy();   barChart   = null; }

  showScreen('welcome');
}

// ── Progress ──────────────────────────────────────────────────────────────────
function renderProgressSteps() {
  document.getElementById('progress-steps').innerHTML =
    AXES.map((a, i) => `
      <div class="progress-step" id="step-${i}" title="${a.title}"
           onclick="jumpToAxis(${i})">${i + 1}</div>
    `).join('');
}

function updateProgressBar(idx) {
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = `${((idx + 1) / AXES.length) * 100}%`;

  document.querySelectorAll('.progress-step').forEach((el, i) => {
    el.classList.remove('active', 'completed');
    if (i < idx)  el.classList.add('completed');
    if (i === idx) el.classList.add('active');
  });
}

function jumpToAxis(idx) {
  if (document.getElementById('screen-evaluation').classList.contains('active')) {
    renderAxis(idx);
  }
}

// ── Evaluation axis render ────────────────────────────────────────────────────
function renderAxis(idx) {
  state.currentAxis = idx;
  const axis    = AXES[idx];
  const ratings = state.ratings[idx];

  document.getElementById('axis-form').innerHTML = `
    <div class="axis-card" style="--axis-color:${axis.color}">
      <div class="axis-header">
        <div class="axis-meta">
          <span class="axis-number">المحور ${idx + 1} / ${AXES.length}</span>
          <span class="axis-pts-badge">${axis.maxPoints} نقطة</span>
        </div>
        <div class="axis-icon">${axis.icon}</div>
        <h2 class="axis-title">${axis.title}</h2>
        <p class="axis-subtitle">${axis.titleFr}</p>
      </div>

      <div class="indicators-list">
        ${axis.indicators.map((ind, i) => `
          <div class="indicator-item" id="ind-${idx}-${i}">
            <div class="ind-header">
              <span class="ind-num">${i + 1}</span>
              <span class="ind-name">${ind}</span>
              <span class="ind-badge ${ratings[i] >= 0 ? 'rated' : ''}"
                    id="ind-badge-${idx}-${i}"
                    style="${ratings[i] >= 0 ? 'background:' + RATING_COLORS[ratings[i]] : ''}">
                ${ratings[i] >= 0 ? RATING_LABELS[ratings[i]] : '—'}
              </span>
            </div>
            <div class="rating-row" role="group">
              ${[0,1,2,3,4,5].map(v => `
                <button class="rbtn ${ratings[i] === v ? 'sel' : ''}"
                        style="--c:${RATING_COLORS[v]}"
                        onclick="setRating(${idx},${i},${v})"
                        title="${RATING_LABELS[v]}">
                  <span class="rbtn-val">${v}</span>
                  <span class="rbtn-lbl">${RATING_LABELS[v]}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="axis-notes-wrap">
        <label for="notes-${idx}">ملاحظات إضافية (اختياري)</label>
        <textarea id="notes-${idx}" rows="3"
          placeholder="أضف ملاحظاتك وتوضيحاتك حول هذا المحور..."
          onchange="state.notes[${idx}]=this.value"
        >${state.notes[idx]}</textarea>
      </div>

      <div class="axis-score-bar">
        <span>نقطة المحور:</span>
        <strong id="axis-score-val">${calcAxisScore(idx).toFixed(1)}</strong>
        <span>/ ${axis.maxPoints}</span>
        <div class="axis-score-fill-wrap">
          <div class="axis-score-fill"
               style="width:${(calcAxisScore(idx)/axis.maxPoints)*100}%;background:${axis.color}">
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('prev-btn').style.display = idx > 0 ? 'inline-flex' : 'none';
  const nextBtn = document.getElementById('next-btn');
  nextBtn.innerHTML = idx === AXES.length - 1
    ? 'الأسئلة النوعية <span class="btn-arrow">←</span>'
    : 'التالي <span class="btn-arrow">←</span>';

  updateProgressBar(idx);
  updateSidebar();
  updateTotalScore();
}

// ── Rating ────────────────────────────────────────────────────────────────────
function setRating(axisIdx, indIdx, value) {
  state.ratings[axisIdx][indIdx] = value;

  document.querySelectorAll(`#ind-${axisIdx}-${indIdx} .rbtn`).forEach(btn => {
    btn.classList.toggle('sel', +btn.querySelector('.rbtn-val').textContent === value);
  });

  const badge = document.getElementById(`ind-badge-${axisIdx}-${indIdx}`);
  if (badge) {
    badge.textContent = RATING_LABELS[value];
    badge.className   = 'ind-badge rated';
    badge.style.background = RATING_COLORS[value];
  }

  const axisScoreVal = document.getElementById('axis-score-val');
  if (axisScoreVal) {
    const s = calcAxisScore(axisIdx);
    axisScoreVal.textContent = s.toFixed(1);
    const fill = axisScoreVal.closest('.axis-score-bar')
                             .querySelector('.axis-score-fill');
    if (fill) {
      const pct = (s / AXES[axisIdx].maxPoints) * 100;
      fill.style.width = pct + '%';
    }
  }

  updateTotalScore();
  updateSidebar();
}

// ── Score helpers ─────────────────────────────────────────────────────────────
function calcAxisScore(axisIdx) {
  const axis  = AXES[axisIdx];
  const rated = state.ratings[axisIdx].filter(r => r >= 0);
  if (rated.length === 0) return 0;
  const sum = rated.reduce((a, b) => a + b, 0);
  return (sum / (axis.indicators.length * 5)) * axis.maxPoints;
}

function calcTotal() {
  return AXES.reduce((t, _, i) => t + calcAxisScore(i), 0);
}

function getScaleInfo(score) {
  return SCALE.find(s => score >= s.min && score <= s.max) || SCALE[SCALE.length - 1];
}

// ── Live UI updates ───────────────────────────────────────────────────────────
function updateTotalScore() {
  const total   = calcTotal();
  const rounded = total.toFixed(1);

  const liveScore    = document.getElementById('live-score');
  const sidebarScore = document.getElementById('sidebar-score');
  if (liveScore)    liveScore.textContent    = rounded;
  if (sidebarScore) sidebarScore.textContent = rounded;

  const circle = document.getElementById('score-circle');
  if (circle) {
    const offset = 314.16 * (1 - total / 100);
    circle.style.strokeDashoffset = offset;
    const info = getScaleInfo(total);
    circle.style.stroke = info.color;
  }
}

function updateSidebar() {
  const container = document.getElementById('axes-mini-list');
  if (!container) return;

  container.innerHTML = AXES.map((axis, i) => {
    const score     = calcAxisScore(i);
    const completed = state.ratings[i].every(r => r >= 0);
    const partial   = state.ratings[i].some(r => r >= 0);
    const isCurrent = i === state.currentAxis;
    return `
      <div class="mini-axis ${isCurrent ? 'current' : ''} ${completed ? 'done' : partial ? 'partial' : ''}"
           onclick="jumpToAxis(${i})">
        <span class="mini-icon">${axis.icon}</span>
        <span class="mini-title">${axis.title}</span>
        <span class="mini-score">${score.toFixed(1)}/${axis.maxPoints}</span>
      </div>
    `;
  }).join('');
}

// ── Qualitative ───────────────────────────────────────────────────────────────
function renderQualitativeForm() {
  document.getElementById('qualitative-form').innerHTML =
    QUALITATIVE_QUESTIONS.map((q, i) => `
      <div class="q-item">
        <label for="${q.id}">
          <span class="q-num">${i + 1}</span>
          ${q.text}
        </label>
        <textarea id="${q.id}" rows="4"
          placeholder="${q.placeholder}"
          onchange="state.qualitative['${q.id}']=this.value"
        ></textarea>
      </div>
    `).join('');
}

function syncQualitativeValues() {
  QUALITATIVE_QUESTIONS.forEach(q => {
    const el = document.getElementById(q.id);
    if (el) state.qualitative[q.id] = el.value;
  });
}

// ── Results ───────────────────────────────────────────────────────────────────
function renderResults() {
  const total     = calcTotal();
  const info      = getScaleInfo(total);
  const evalDate  = state.commune.date
    ? new Date(state.commune.date).toLocaleDateString('ar-MA', { year:'numeric', month:'long', day:'numeric' })
    : '';

  document.getElementById('results-content').innerHTML = `
    <div class="results-top">
      <div class="results-commune">${state.commune.name}</div>
      ${state.commune.evaluator ? `<div class="results-evaluator">${state.commune.evaluator}</div>` : ''}
      ${evalDate ? `<div class="results-date">تاريخ التقييم: ${evalDate}</div>` : ''}
    </div>

    <div class="total-card" style="border-color:${info.color};background:${info.bg}">
      <div class="total-left">
        <div class="total-num" style="color:${info.color}">${total.toFixed(1)}</div>
        <div class="total-denom">/100</div>
      </div>
      <div class="total-right">
        <div class="verdict-label" style="color:${info.color}">${info.label}</div>
        <div class="verdict-desc">${info.description}</div>
        <div class="verdict-range">النطاق: ${info.min} – ${info.max} نقطة</div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <h4>المخطط الشعاعي</h4>
        <div class="chart-wrap"><canvas id="radar-chart"></canvas></div>
      </div>
      <div class="chart-card">
        <h4>النقاط حسب المحور</h4>
        <div class="chart-wrap"><canvas id="bar-chart"></canvas></div>
      </div>
    </div>

    <div class="breakdown-card">
      <h4>تفصيل النتائج</h4>
      <div class="bd-table">
        <div class="bd-row bd-head">
          <span>المحور</span><span>النقطة</span><span>من</span><span>النسبة</span><span>التقدير</span>
        </div>
        ${AXES.map((axis, i) => {
          const s   = calcAxisScore(i);
          const pct = (s / axis.maxPoints) * 100;
          const si  = getScaleInfo(pct);
          return `
            <div class="bd-row">
              <span class="bd-name">${axis.icon} ${axis.title}</span>
              <span class="bd-score">${s.toFixed(1)}</span>
              <span class="bd-max">${axis.maxPoints}</span>
              <span class="bd-pct">
                <div class="pct-track">
                  <div class="pct-bar" style="width:${pct}%;background:${axis.color}"></div>
                </div>
                ${Math.round(pct)}%
              </span>
              <span class="bd-verdict" style="color:${si.color}">${si.label}</span>
            </div>
          `;
        }).join('')}
        <div class="bd-row bd-total">
          <span>المجموع الكلي</span>
          <span>${total.toFixed(1)}</span>
          <span>100</span>
          <span>${Math.round(total)}%</span>
          <span style="color:${info.color}">${info.label}</span>
        </div>
      </div>
    </div>

    <div class="scale-ref">
      <h4>سلم قراءة النتائج</h4>
      <div class="scale-items">
        ${SCALE.map(s => `
          <div class="scale-item ${total >= s.min && total <= s.max ? 'active' : ''}"
               style="border-color:${s.color};${total>=s.min&&total<=s.max?'background:'+s.bg:''}">
            <div class="scale-badge" style="background:${s.color}">${s.min}–${s.max}</div>
            <strong style="color:${s.color}">${s.label}</strong>
            <p>${s.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    ${QUALITATIVE_QUESTIONS.some(q => state.qualitative[q.id]) ? `
    <div class="qualitative-results">
      <h4>الأجوبة النوعية</h4>
      ${QUALITATIVE_QUESTIONS.map(q => {
        const ans = state.qualitative[q.id];
        return ans ? `
          <div class="qa-item">
            <div class="qa-q">${q.text}</div>
            <div class="qa-a">${ans.replace(/\n/g, '<br>')}</div>
          </div>` : '';
      }).join('')}
    </div>` : ''}
  `;

  setTimeout(() => { renderRadarChart(); renderBarChart(); }, 80);
}

// ── Charts ────────────────────────────────────────────────────────────────────
function renderRadarChart() {
  const ctx = document.getElementById('radar-chart');
  if (!ctx) return;
  if (radarChart) radarChart.destroy();

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: AXES.map(a => {
        const words = a.title.split(' ');
        const lines = [];
        let line    = '';
        words.forEach(w => {
          if ((line + ' ' + w).trim().length > 10) { lines.push(line.trim()); line = w; }
          else line = (line + ' ' + w).trim();
        });
        if (line) lines.push(line);
        return lines;
      }),
      datasets: [{
        label: state.commune.name,
        data: AXES.map((_, i) => {
          const s = calcAxisScore(i);
          return +(( s / AXES[i].maxPoints) * 100).toFixed(1);
        }),
        fill: true,
        backgroundColor: 'rgba(193,18,28,0.15)',
        borderColor: '#C1121C',
        pointBackgroundColor: '#C1121C',
        pointBorderColor: '#fff',
        pointRadius: 5,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { stepSize: 25, font: { family: 'Cairo', size: 10 }, backdropColor: 'transparent' },
          pointLabels: { font: { family: 'Cairo', size: 11 }, color: '#2c3e50' },
          grid: { color: '#e1e8ed' },
          angleLines: { color: '#e1e8ed' }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderBarChart() {
  const ctx = document.getElementById('bar-chart');
  if (!ctx) return;
  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: AXES.map((a, i) => `${i+1}. ${a.title.length > 12 ? a.title.slice(0,12)+'…' : a.title}`),
      datasets: [
        {
          label: 'النقطة المحصل عليها',
          data: AXES.map((_, i) => +calcAxisScore(i).toFixed(1)),
          backgroundColor: AXES.map(a => a.color + 'cc'),
          borderColor: AXES.map(a => a.color),
          borderWidth: 2, borderRadius: 6
        },
        {
          label: 'النقطة القصوى',
          data: AXES.map(a => a.maxPoints),
          backgroundColor: '#e1e8ed99',
          borderColor: '#bdc3c7',
          borderWidth: 1, borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true, indexAxis: 'y',
      scales: {
        x: { max: 15, ticks: { font: { family: 'Cairo', size: 10 } }, grid: { color: '#f0f0f0' } },
        y: { ticks: { font: { family: 'Cairo', size: 10 } } }
      },
      plugins: { legend: { labels: { font: { family: 'Cairo', size: 11 } } } }
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initApp);
