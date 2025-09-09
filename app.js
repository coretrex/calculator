// --- Utilities ---
const $ = (id) => document.getElementById(id);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const toPct = (v) => `${Number(v).toFixed(2)}%`;
const fmtMoney = (n, d=2) => {
  const val = Number.isFinite(n) ? n : 0;
  return val.toLocaleString(undefined,{style:'currency',currency:'USD',minimumFractionDigits:d,maximumFractionDigits:d});
};
const parseCurrency = (str, fallback=0) => {
  if (typeof str !== 'string') return fallback;
  const v = parseFloat(str.replace(/[^\d.-]/g, ''));
  return Number.isFinite(v) ? v : fallback;
};

// read/write all inputs as one object
const readInputs = () => ({
  revenueGoal: parseCurrency($('revenueGoal').value, 1000000),
  aov: parseCurrency($('aov').value, 50),
  conversionRate: clamp(parseFloat($('conversionRate').value)||1, 0.25, 50),
  organicRate: clamp(parseFloat($('organicRate').value)||70, 0, 100),
  adsConversionRate: clamp(parseFloat($('adsConversionRate').value)||2, 0.25, 50),
  cpc: parseCurrency($('cpc').value, 1.0)
});

const writeInputs = (data) => {
  $('revenueGoal').value = fmtMoney(data.revenueGoal);
  $('aov').value = fmtMoney(data.aov);
  $('conversionRate').value = data.conversionRate;
  $('organicRate').value = data.organicRate;
  $('adsConversionRate').value = data.adsConversionRate;
  $('cpc').value = fmtMoney(data.cpc);
  updateSliderLabels();
};

const updateSliderLabels = () => {
  $('conversionRateValue').textContent = toPct(parseFloat($('conversionRate').value || 0).toFixed(2));
  $('organicRateValue').textContent = `${parseFloat($('organicRate').value||0).toFixed(0)}%`;
  $('adsConversionRateValue').textContent = toPct(parseFloat($('adsConversionRate').value || 0).toFixed(2));
};

// --- URL/state helpers ---
const toQuery = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k,v])=>p.set(k, String(v)));
  return p.toString();
};
const fromQuery = () => {
  const p = new URLSearchParams(location.search);
  const getNum = (k, fb) => {
    const v = parseFloat(p.get(k));
    return Number.isFinite(v) ? v : fb;
  };
  return {
    revenueGoal: getNum('revenueGoal', 1000000),
    aov: getNum('aov', 50),
    conversionRate: getNum('conversionRate', 1),
    organicRate: getNum('organicRate', 70),
    adsConversionRate: getNum('adsConversionRate', 2),
    cpc: getNum('cpc', 1.0)
  };
};

// --- Persistence (localStorage only) ---
const STORAGE_KEY = 'coretrex-growth-calculator';
const saveLocal = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const loadLocal = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
  catch { return null; }
};

// --- Calculator (mirrors dashboard logic) ---
// Based on your dashboard’s formulas for required page views, paid split, ad spend & TACoS. :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5}
function compute(data){
  const {
    revenueGoal, aov, conversionRate,
    organicRate, adsConversionRate, cpc
  } = data;

  const cv = conversionRate/100;
  const adsCv = adsConversionRate/100;
  const organic = organicRate/100;
  const paidShare = 1 - organic;

  // Total required page views to hit revenueGoal at overall CVR
  const pvAnnual = revenueGoal / (aov * cv);
  const pvDaily  = pvAnnual / 365;
  const pvWeekly = pvAnnual / 52;
  const pvMonthly= pvAnnual / 12;

  // Non-organic (paid) page views portion calculated at ads CVR
  const paidPvAnnual  = (revenueGoal / (aov * adsCv)) * paidShare;
  const paidPvDaily   = paidPvAnnual / 365;
  const paidPvWeekly  = paidPvAnnual / 52;
  const paidPvMonthly = paidPvAnnual / 12;

  // Ad spend from paid traffic at CPC
  const spendAnnual  = paidPvAnnual * cpc;
  const spendDaily   = spendAnnual / 365;
  const spendWeekly  = spendAnnual / 52;
  const spendMonthly = spendAnnual / 12;

  // TACoS = Ad Spend / Revenue
  const tacosAnnual  = (spendAnnual  / revenueGoal) * 100;
  const tacosDaily   = (spendDaily   / (revenueGoal/365)) * 100;
  const tacosWeekly  = (spendWeekly  / (revenueGoal/52))  * 100;
  const tacosMonthly = (spendMonthly / (revenueGoal/12))  * 100;

  // Revenue from paid visits (sanity output like your page) 
  const paidRevDaily   = paidPvDaily   * aov * adsCv;
  const paidRevWeekly  = paidPvWeekly  * aov * adsCv;
  const paidRevMonthly = paidPvMonthly * aov * adsCv;
  const paidRevAnnual  = paidPvAnnual  * aov * adsCv;

  return {
    pv: {daily: pvDaily, weekly: pvWeekly, monthly: pvMonthly, annual: pvAnnual},
    paidPv: {daily: paidPvDaily, weekly: paidPvWeekly, monthly: paidPvMonthly, annual: paidPvAnnual},
    spend: {daily: spendDaily, weekly: spendWeekly, monthly: spendMonthly, annual: spendAnnual},
    tacos: {daily: tacosDaily, weekly: tacosWeekly, monthly: tacosMonthly, annual: tacosAnnual},
    paidRev: {daily: paidRevDaily, weekly: paidRevWeekly, monthly: paidRevMonthly, annual: paidRevAnnual},
  };
}

function renderResults(data, out){
  const {revenueGoal,aov,conversionRate,organicRate,adsConversionRate,cpc} = data;
  const r = compute(data);

  const rows = (obj, unit, money=false, decimals=0) => `
    <div class="card">
      <h3>Daily</h3><div>${money?fmtMoney(obj.daily):Math.round(obj.daily).toLocaleString()} ${unit}</div>
    </div>
    <div class="card">
      <h3>Weekly</h3><div>${money?fmtMoney(obj.weekly):Math.round(obj.weekly).toLocaleString()} ${unit}</div>
    </div>
    <div class="card">
      <h3>Monthly</h3><div>${money?fmtMoney(obj.monthly):Math.round(obj.monthly).toLocaleString()} ${unit}</div>
    </div>
    <div class="card">
      <h3>Annually</h3><div>${money?fmtMoney(obj.annual):Math.round(obj.annual).toLocaleString()} ${unit}</div>
    </div>
  `;

  out.innerHTML = `
    <h2>Summary</h2>
    <p>To reach <strong>${fmtMoney(revenueGoal,0)}</strong> with AOV <strong>${fmtMoney(aov)}</strong> and CVR <strong>${conversionRate.toFixed(2)}%</strong>, you’ll need approximately:</p>

    <div class="grid">
      ${rows(r.pv,'page views')}
    </div>

    <h2 style="margin-top:18px">Paid Traffic & Spend</h2>
    <p>With <strong>${organicRate.toFixed(0)}%</strong> organic (so <strong>${(100-organicRate).toFixed(0)}%</strong> paid), CPC <strong>${fmtMoney(cpc)}</strong> & Ads CVR <strong>${adsConversionRate.toFixed(2)}%</strong>:</p>
    <div class="grid">
      ${rows(r.paidPv,'paid views')}
    </div>

    <h2 style="margin-top:18px">Ad Spend</h2>
    <div class="grid">
      ${rows(r.spend,'', true)}
    </div>

    <h2 style="margin-top:18px">TACoS</h2>
    <div class="grid">
      <div class="card"><h3>Daily</h3><div>${r.tacos.daily.toFixed(2)}%</div></div>
      <div class="card"><h3>Weekly</h3><div>${r.tacos.weekly.toFixed(2)}%</div></div>
      <div class="card"><h3>Monthly</h3><div>${r.tacos.monthly.toFixed(2)}%</div></div>
      <div class="card"><h3>Annually</h3><div>${r.tacos.annual.toFixed(2)}%</div></div>
    </div>

    <h2 style="margin-top:18px">Revenue From Paid Visits</h2>
    <div class="grid">
      ${rows(r.paidRev,'', true)}
    </div>
  `;
}

// --- CSV export ---
function exportCSV(data){
  const r = compute(data);
  const lines = [
    ['Metric','Daily','Weekly','Monthly','Annual'],
    ['Total Page Views',
      Math.round(r.pv.daily), Math.round(r.pv.weekly), Math.round(r.pv.monthly), Math.round(r.pv.annual)
    ],
    ['Paid Page Views',
      Math.round(r.paidPv.daily), Math.round(r.paidPv.weekly), Math.round(r.paidPv.monthly), Math.round(r.paidPv.annual)
    ],
    ['Ad Spend (USD)',
      r.spend.daily.toFixed(2), r.spend.weekly.toFixed(2), r.spend.monthly.toFixed(2), r.spend.annual.toFixed(2)
    ],
    ['TACoS (%)',
      r.tacos.daily.toFixed(2), r.tacos.weekly.toFixed(2), r.tacos.monthly.toFixed(2), r.tacos.annual.toFixed(2)
    ],
    ['Paid Revenue (USD)',
      r.paidRev.daily.toFixed(2), r.paidRev.weekly.toFixed(2), r.paidRev.monthly.toFixed(2), r.paidRev.annual.toFixed(2)
    ]
  ];
  const csv = lines.map(row => row.map(String).map(s => /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"`: s).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'growth-calculator-results.csv';
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

// --- Tooltip Modal ---
const tooltipData = {
  revenueGoal: {
    title: "Annual Revenue Goal",
    content: "Your target annual revenue in dollars. This is the total amount you want to generate from Amazon sales over the course of a year. This number drives all other calculations in the calculator."
  },
  aov: {
    title: "Average Order Value (AOV)",
    content: "The average dollar amount customers spend per order on your Amazon products. This is calculated by dividing total revenue by the number of orders. A higher AOV means you need fewer orders to reach your revenue goal."
  },
  conversionRate: {
    title: "Conversion Rate",
    content: "The percentage of visitors who make a purchase. This is calculated by dividing the number of orders by the number of page views, then multiplying by 100. Amazon's average conversion rate is typically 1-3%, but can vary significantly by category and product quality."
  },
  organicRate: {
    title: "Organic Page Views",
    content: "The percentage of your total page views that come from organic (unpaid) traffic sources like search results, browse pages, and recommendations. CoreTrex recommends aiming for 70% organic traffic for sustainable, profitable growth."
  },
  cpc: {
    title: "Cost Per Click (CPC)",
    content: "The average amount you pay for each click on your Amazon ads. This varies by keyword competition, product category, and ad quality. Typical CPCs range from $0.50 to $5.00+ depending on your niche and competition level."
  },
  adsConversionRate: {
    title: "Ads Conversion Rate",
    content: "The conversion rate specifically for traffic that comes from paid ads. This is often different from your overall conversion rate because ad traffic may be more or less qualified than organic traffic. Ads conversion rates are typically 1-4%."
  }
};

function showTooltip(tooltipId) {
  const data = tooltipData[tooltipId];
  if (!data) {
    console.log('No data found for tooltipId:', tooltipId);
    return;
  }
  
  const modalTitle = $('modalTitle');
  const modalContent = $('modalContent');
  const modal = $('tooltipModal');
  
  if (!modalTitle || !modalContent || !modal) {
    console.log('Modal elements not found:', {modalTitle, modalContent, modal});
    return;
  }
  
  modalTitle.textContent = data.title;
  modalContent.textContent = data.content;
  modal.style.display = 'flex';
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  console.log('Modal opened for:', tooltipId, 'with data:', data);
}

function hideTooltip() {
  const modal = $('tooltipModal');
  if (modal) {
    modal.style.display = 'none';
    modal.hidden = true;
    document.body.style.overflow = '';
    console.log('Modal closed');
  }
}

// --- Events / init ---
function attachEvents(){
  // slider labels
  ['conversionRate','organicRate','adsConversionRate'].forEach(id=>{
    $(id).addEventListener('input', updateSliderLabels);
  });

  // calculator
  $('calculateButton').addEventListener('click', () => {
    const results = $('results');
    const button = $('calculateButton');
    const data = readInputs();
    
    if (results.hidden) {
      // Show results
      results.hidden = false;
      renderResults(data, results);
      button.classList.add('results-shown');
    } else {
      // Hide results
      results.hidden = true;
      button.classList.remove('results-shown');
    }
  });

  // save/load (local only)
  $('saveButton').addEventListener('click', () => {
    const data = readInputs();
    saveLocal(data);
    const msg = $('saveMessage'); msg.hidden = false; msg.textContent = 'Inputs saved.';
    setTimeout(()=> msg.hidden = true, 1200);
  });

  // shareable link
  $('shareButton').addEventListener('click', async () => {
    const data = readInputs();
    const u = new URL(location.href);
    u.search = toQuery(data);
    try{
      await navigator.clipboard.writeText(u.toString());
      const msg = $('saveMessage'); msg.hidden = false; msg.textContent = 'Link copied!';
      setTimeout(()=> msg.hidden = true, 1200);
    }catch{
      // fallback
      prompt('Copy link:', u.toString());
    }
  });

  // CSV export
  $('exportButton').addEventListener('click', () => exportCSV(readInputs()));


  // tooltip modal events
  document.querySelectorAll('.tooltip-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      const tooltipId = icon.getAttribute('data-tooltip');
      showTooltip(tooltipId);
    });
  });

  // modal close events
  const modalClose = $('modalClose');
  const tooltipModal = $('tooltipModal');
  
  if (modalClose) {
    modalClose.addEventListener('click', hideTooltip);
  }
  
  if (tooltipModal) {
    tooltipModal.addEventListener('click', (e) => {
      if (e.target === tooltipModal) {
        hideTooltip();
      }
    });
  }

  // close modal with escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tooltipModal && !tooltipModal.hidden) {
      hideTooltip();
    }
  });
}

function loadInitial(){
  // precedence: URL params > localStorage > defaults
  const fromUrl = fromQuery();
  const hasQuery = [...new URLSearchParams(location.search).keys()].length>0;

  const stored = loadLocal();
  const base = hasQuery ? fromUrl : (stored || {
    revenueGoal: 1000000, aov: 50, conversionRate: 1, organicRate: 70, adsConversionRate: 2, cpc: 1.0
  });
  writeInputs(base);
  $('year').textContent = new Date().getFullYear();
  
  // Ensure modal is hidden on page load
  const modal = $('tooltipModal');
  if (modal) {
    modal.style.display = 'none';
    modal.hidden = true;
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadInitial();
  attachEvents();
});
