/* DS플래닛 site.js — 2026-11-21 멀티페이지 전환 */

/* ── FAQ 아코디언 ── */
document.querySelectorAll('.faq-q').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var item = this.closest('.faq-item');
    var answer = item.querySelector('.faq-a');
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function(openItem) {
      openItem.classList.remove('open');
      openItem.querySelector('.faq-a').style.maxHeight = '0';
    });
    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

/* ── 앵커 부드러운 스크롤 ── */
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── 문의 폼 (Apps Script) ── */
var INQUIRY_URL = 'https://script.google.com/macros/s/AKfycbz5RgMgzZJwrKAjAFkXAQAgOFiIf9LAzCfp0vUG116asiJHYj0IZCrMH8nX_EdWme8j/exec';
var inquiryForm = document.getElementById('inquiryForm');
if (inquiryForm) {
  inquiryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = document.getElementById('inqBtn');
    var status = document.getElementById('inqStatus');
    if (!INQUIRY_URL) {
      var n = document.getElementById('inqName').value;
      var em = document.getElementById('inqEmail').value;
      var addr = document.getElementById('inqAddress').value;
      var msg = document.getElementById('inqMessage').value;
      var body = '이름: '+n+'%0A이메일: '+em+'%0A대상 지번: '+addr+'%0A%0A'+encodeURIComponent(msg);
      window.open('mailto:dscon36@naver.com?subject='+encodeURIComponent('[DS플래닛] 리포트 문의 - '+n)+'&body='+body);
      status.textContent = '메일 클라이언트가 열립니다. 발송을 완료해주세요.';
      status.style.display = 'block';
      return;
    }
    btn.disabled = true;
    btn.textContent = '전송 중...';
    fetch(INQUIRY_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('inqName').value,
        email: document.getElementById('inqEmail').value,
        address: document.getElementById('inqAddress').value,
        message: document.getElementById('inqMessage').value
      })
    }).then(function() {
      status.textContent = '문의가 접수되었습니다. 빠른 시일 내 회신드리겠습니다.';
      status.style.display = 'block';
      status.style.color = '#3CB371';
      btn.textContent = '전송 완료';
      inquiryForm.reset();
      setTimeout(function() { btn.disabled = false; btn.textContent = '문의 보내기'; }, 3000);
    }).catch(function() {
      status.textContent = '전송 중 오류가 발생했습니다. 이메일로 직접 문의해주세요.';
      status.style.display = 'block';
      status.style.color = '#EF4444';
      btn.disabled = false;
      btn.textContent = '문의 보내기';
    });
  });
}

/* ── 현재 페이지에 맞는 내비 하이라이트 ── */
(function() {
  var path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
  document.querySelectorAll('[data-nav]').forEach(function(a) {
    var nav = a.getAttribute('data-nav');
    if ((nav === '/' && path === '/') || (nav !== '/' && path.startsWith(nav))) {
      a.classList.add('active');
    }
  });
})();

/* ── 휴대폰 접는 메뉴 ── */
function toggleNavMenu(force) {
  var nav = document.querySelector('nav'); if (!nav) return;
  var open = (typeof force === 'boolean') ? force : !nav.classList.contains('menu-open');
  nav.classList.toggle('menu-open', open);
  var b = document.querySelector('.nav-burger'); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
}
document.querySelectorAll('.nav-drawer a').forEach(function(a) {
  a.addEventListener('click', function() { toggleNavMenu(false); });
});
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') toggleNavMenu(false); });
window.addEventListener('resize', function() { if (innerWidth > 720) toggleNavMenu(false); });

/* ===== 여기서부터는 조회 페이지(/lookup/)에서만 동작하는 코드 ===== */
/* Chart.js, Leaflet이 로드되지 않은 페이지에서는 조건 분기로 건너뛴다 */

var luChart = null;
var PC_API = 'https://planetarycomputer.microsoft.com';

var DEMO_DATA = {
  label: '샘플 — 전북 김제 만경평야 논 (실측값)',
  lat: 35.8155, lon: 126.8392,
  years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  ndvi_summer: [0.81, 0.82, 0.86, 0.85, 0.84, 0.80, 0.80, 0.84, 0.87, 0.86],
  ndvi_spring: [0.32, 0.26, 0.20, 0.46, 0.37, 0.25, 0.29, 0.32, 0.33, 0.32],
  scenes: 58,
  ndmi_summer: [0.35, 0.38, 0.42, 0.40, 0.37, 0.33, 0.35, 0.39, 0.41, 0.40],
  bsi_summer: [-0.08, -0.10, -0.15, -0.12, -0.10, -0.06, -0.07, -0.11, -0.14, -0.13],
  sar: { 2017: -5.5, 2018: -7.6, 2019: -7.8, 2020: -6.4, 2021: -4.0, 2022: -5.9, 2023: -7.4, 2024: -4.8, 2025: -7.5, 2026: -6.5 },
  note: '10년 내내 봄(3~5월)에는 0.2~0.46으로 낮고 여름(7~9월)에는 0.8 이상으로 올라갑니다. 해마다 모내기 전 맨땅에서 벼가 자라는, 계속 경작 중인 논의 전형적인 패턴입니다.'
};

function renderChart(data) {
  if (typeof Chart === 'undefined') return;
  var wrap = document.getElementById('luChartWrap');
  if (!wrap) return;
  wrap.classList.add('active');
  document.getElementById('luChartTitle').textContent = data.label + ' — NDVI 시계열';
  if (luChart) luChart.destroy();
  var ctx = document.getElementById('luChart').getContext('2d');
  luChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.years.map(String),
      datasets: [
        {
          label: '여름 최고 NDVI',
          data: data.ndvi_summer,
          backgroundColor: data.ndvi_summer.map(function(v) {
            return v >= 0.4 ? 'rgba(76,175,80,0.8)' : v >= 0.2 ? 'rgba(253,216,53,0.8)' : 'rgba(161,136,127,0.8)';
          }),
          borderColor: data.ndvi_summer.map(function(v) {
            return v >= 0.4 ? '#388E3C' : v >= 0.2 ? '#F9A825' : '#8D6E63';
          }),
          borderWidth: 1,
          borderRadius: 4,
          order: 1
        },
        {
          label: '봄 최저 NDVI',
          data: data.ndvi_spring,
          type: 'line',
          borderColor: '#90CAF9',
          backgroundColor: 'rgba(144,202,249,0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#90CAF9',
          tension: 0.3,
          fill: true,
          order: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94A3B8', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            afterLabel: function(ctx) {
              var v = ctx.raw;
              if (v >= 0.4) return '판정: 경작 중';
              if (v >= 0.2) return '판정: 약한 식생/전환기';
              return '판정: 맨땅/휴경';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true, max: 1,
          title: { display: true, text: 'NDVI', color: '#94A3B8' },
          ticks: { color: '#64748B' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
          ticks: { color: '#94A3B8' },
          grid: { display: false }
        }
      }
    }
  });
  document.getElementById('luMeta').innerHTML =
    '위치: ' + data.lat.toFixed(4) + ', ' + data.lon.toFixed(4) +
    ' | 분석 장면: ' + data.scenes + '개 | 데이터: Copernicus Sentinel-2' +
    (data.note ? '<br>' + data.note : '');
  renderSar(data.sar);
  renderTimeline(data);
}

function renderTimeline(data) {
  var el = document.getElementById('luTimeline');
  if (!el) return;
  el.hidden = false;
  var rows = '';
  for (var i = 0; i < data.years.length; i++) {
    var y = data.years[i];
    var ndvi = data.ndvi_summer[i];
    var ndmi = data.ndmi_summer ? data.ndmi_summer[i] : null;
    var bsi = data.bsi_summer ? data.bsi_summer[i] : null;
    var sarDb = data.sar ? data.sar[y] : null;
    var farm = ndvi >= 0.4 ? '경작' : ndvi >= 0.2 ? '약한 식생' : '맨땅';
    var farmCls = ndvi >= 0.4 ? 'tl-good' : ndvi >= 0.2 ? 'tl-mid' : 'tl-bad';
    var moist = ndmi != null ? (ndmi >= 0.3 ? '습윤' : ndmi >= 0.1 ? '보통' : '건조') : '—';
    var moistCls = ndmi != null ? (ndmi >= 0.3 ? 'tl-good' : ndmi >= 0.1 ? 'tl-mid' : 'tl-bad') : '';
    var soil = bsi != null ? (bsi >= 0.1 ? '나지' : bsi >= -0.05 ? '혼합' : '식생') : '—';
    var soilCls = bsi != null ? (bsi >= 0.1 ? 'tl-bad' : bsi >= -0.05 ? 'tl-mid' : 'tl-good') : '';
    var bld = sarDb != null ? (sarDb >= -3 ? '있음' : sarDb >= -4 ? '불확실' : '없음') : '—';
    var bldCls = sarDb != null ? (sarDb >= -3 ? 'tl-bad' : sarDb >= -4 ? 'tl-mid' : 'tl-good') : '';
    rows += '<tr><td>' + y + '</td>'
      + '<td class="' + farmCls + '">' + farm + ' (' + ndvi.toFixed(2) + ')</td>'
      + '<td class="' + moistCls + '">' + moist + (ndmi != null ? ' (' + ndmi.toFixed(2) + ')' : '') + '</td>'
      + '<td class="' + soilCls + '">' + soil + (bsi != null ? ' (' + bsi.toFixed(2) + ')' : '') + '</td>'
      + '<td class="' + bldCls + '">' + bld + (sarDb != null ? ' (' + sarDb + 'dB)' : '') + '</td></tr>';
  }
  el.innerHTML = '<h3 class="tl-title">연도별 종합 판정</h3>'
    + '<div class="tl-scroll"><table class="tl-table"><thead><tr><th>연도</th><th>경작(NDVI)</th><th>수분(NDMI)</th><th>나지(BSI)</th><th>건물(SAR)</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>'
    + '<p class="tl-legend">경작: 여름 최고 NDVI ≥0.4 경작, ≥0.2 약한 식생, &lt;0.2 맨땅 · 수분: NDMI ≥0.3 습윤, ≥0.1 보통, &lt;0.1 건조 · 나지: BSI ≥0.1 나지, ≥-0.05 혼합, &lt;-0.05 식생 · 건물: SAR VV ≥-3dB 있음, ≥-4dB 불확실, &lt;-4dB 없음</p>';
}

function sarClass(db) {
  if (db == null) return ['sar-na', '자료 없음'];
  if (db >= -3) return ['sar-bldg', '건물급 반사'];
  if (db >= -4) return ['sar-unsure', '판단 보류'];
  return ['sar-none', '흔적 없음'];
}
function renderSar(sar) {
  var box = document.getElementById('luSar');
  if (!box) return;
  if (!sar || !Object.keys(sar).length) { box.innerHTML = ''; return; }
  var ys = Object.keys(sar).map(Number).sort(function(a, b) { return a - b; });
  var cells = ys.map(function(y) {
    var c = sarClass(sar[y]);
    return '<div class="lookup-sar-cell ' + c[0] + '"><b>' + y + '</b>' + c[1] + '</div>';
  }).join('');
  box.innerHTML = '<div class="lookup-sar-title">레이더로 본 건물급 구조물 (해마다 1~3월)</div>' +
    '<div class="lookup-sar-row">' + cells + '</div>' +
    '<div class="lookup-sar-note">Sentinel-1 레이더로 선택 지점 주변 약 60m 안에 건물처럼 강하게 반사되는 구조물이 있었는지 봅니다. ' +
    '농막·비닐하우스·쉼터처럼 작거나 벽이 없는 시설은 잡히지 않는 것이 정상이며, 정확한 유무는 현장 사진·항공사진으로 확인해야 합니다.</div>';
}

function runDemo() {
  if (typeof Chart === 'undefined' || !document.getElementById('luChart')) return;
  var ob0 = document.getElementById('luOrder'); if (ob0) ob0.hidden = true;
  document.getElementById('luLat').value = DEMO_DATA.lat;
  document.getElementById('luLon').value = DEMO_DATA.lon;
  document.getElementById('luStatus').textContent = '샘플을 표시합니다 (전북 김제 만경평야 논, 실제 위성 관측값)';
  luSetPoint(DEMO_DATA.lat, DEMO_DATA.lon, 15);
  renderChart(DEMO_DATA);
}

/* ── 위치 선택 지도 (Leaflet + Esri 위성영상) ── */
var luMap = null, luMarker = null, luBox = null;
function luInitMap() {
  if (luMap || typeof L === 'undefined' || !document.getElementById('luMap')) return;
  luMap = L.map('luMap', { scrollWheelZoom: false, tap: true, dragging: !L.Browser.mobile }).setView([36.3, 127.8], 7);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18, attribution: 'Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics'
  }).addTo(luMap);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18, opacity: 0.8
  }).addTo(luMap);
  luMap.on('click', function(e) {
    luSetPoint(e.latlng.lat, e.latlng.lng); window.LU_LABEL = null; window.LU_QUERY = null;
    document.getElementById('luStatus').textContent = '위치를 선택했습니다. 사각형 안이 분석할 땅이 맞으면 "조회 시작"을 누르세요.';
    document.getElementById('luStatus').style.color = '#94A3B8';
  });
  luMap.on('focus', function() { luMap.scrollWheelZoom.enable(); });
  luMap.on('blur', function() { luMap.scrollWheelZoom.disable(); });
  ['luLat', 'luLon'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
      var la = parseFloat(document.getElementById('luLat').value);
      var lo = parseFloat(document.getElementById('luLon').value);
      if (!isNaN(la) && !isNaN(lo)) luSetPoint(la, lo, Math.max(luMap.getZoom(), 15));
    });
  });
}
function luSetPoint(lat, lon, zoom) {
  document.getElementById('luLat').value = lat.toFixed(5);
  document.getElementById('luLon').value = lon.toFixed(5);
  if (!luMap) return;
  var d = 0.0015;
  var bounds = [[lat - d, lon - d], [lat + d, lon + d]];
  if (luMarker) luMarker.setLatLng([lat, lon]); else luMarker = L.circleMarker([lat, lon], { radius: 5, color: '#FFFFFF', weight: 2, fillColor: '#3CB371', fillOpacity: 1 }).addTo(luMap);
  if (luBox) luBox.setBounds(bounds); else luBox = L.rectangle(bounds, { color: '#FFD54F', weight: 3, fill: true, fillOpacity: 0.08, dashArray: '6,4' }).addTo(luMap);
  if (zoom) luMap.setView([lat, lon], zoom);
}
if (document.getElementById('luMap')) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', luInitMap); else luInitMap();
}

/* ── 지번 → 좌표 (브이월드 지오코더, JSONP) ── */
var VWORLD_KEY = '76B7A6A5-F15B-43FA-9688-6F7B181656C4';
function luGeocode(addr, type) {
  return new Promise(function(resolve, reject) {
    var cb = 'luVw' + Date.now() + Math.floor(Math.random() * 1000);
    var s = document.createElement('script');
    var timer = setTimeout(function() { cleanup(); reject(new Error('timeout')); }, 10000);
    function cleanup() { clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
    window[cb] = function(data) { cleanup(); resolve(data); };
    s.onerror = function() { cleanup(); reject(new Error('network')); };
    s.src = 'https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326' +
      '&type=' + type + '&refine=true&simple=false&format=json&domain=dssat.co.kr&key=' + VWORLD_KEY +
      '&callback=' + cb + '&address=' + encodeURIComponent(addr);
    document.body.appendChild(s);
  });
}
async function luFindAddr() {
  var input = document.getElementById('luAddr');
  var btn = document.getElementById('luAddrBtn');
  var status = document.getElementById('luStatus');
  if (!input || !btn || !status) return false;
  var addr = input.value.trim();
  if (addr.length < 4) {
    status.textContent = '지번을 입력하세요 (예: 김제시 진봉면 정당리 100)';
    status.style.color = '#EF4444';
    return false;
  }
  btn.disabled = true; btn.textContent = '찾는 중...';
  status.style.color = '#94A3B8';
  status.textContent = '지번 위치를 찾는 중...';
  try {
    var res = null;
    var types = ['parcel', 'road'];
    for (var i = 0; i < types.length; i++) {
      var d = await luGeocode(addr, types[i]);
      if (d && d.response && d.response.status === 'OK') { res = d.response; break; }
    }
    if (!res) {
      status.textContent = '해당 지번을 찾지 못했습니다. 시·군·구와 읍·면·리를 포함해 다시 입력하거나 지도에서 직접 클릭해 주세요.';
      status.style.color = '#EF4444';
      return false;
    }
    var lat = parseFloat(res.result.point.y), lon = parseFloat(res.result.point.x);
    luSetPoint(lat, lon, 16);
    var label = res.refined && res.refined.text ? res.refined.text : addr;
    status.textContent = '찾았습니다: ' + label;
    status.style.color = '#3CB371';
    window.LU_LABEL = label;
    return true;
  } catch (e) {
    status.textContent = '지번 검색 서버가 응답하지 않습니다. 잠시 후 다시 시도하거나 지도에서 직접 클릭해 주세요.';
    status.style.color = '#EF4444';
    return false;
  } finally {
    btn.disabled = false; btn.textContent = '바로 조회';
  }
}
(function() {
  var a = document.getElementById('luAddr');
  if (a) a.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); luQuick(); } });
})();

/* ── Planetary Computer STAC 조회 엔진 ── */
async function runLookup() {
  var lat = parseFloat(document.getElementById('luLat').value);
  var lon = parseFloat(document.getElementById('luLon').value);
  var status = document.getElementById('luStatus');
  var btn = document.getElementById('luBtn');
  if (!status || !btn) return;
  if (isNaN(lat) || isNaN(lon) || lat < 33 || lat > 43 || lon < 124 || lon > 132) {
    status.textContent = (isNaN(lat) || isNaN(lon)) ? '먼저 지번을 찾거나 지도에서 땅을 클릭해 위치를 골라 주세요.' : '국내 위치만 조회할 수 있습니다 (위도 33~43, 경도 124~132).';
    status.style.color = '#EF4444';
    return;
  }
  btn.disabled = true;
  btn.textContent = '조회 중...';
  status.style.color = '#94A3B8';
  status.textContent = 'Planetary Computer에서 Sentinel-2 장면을 검색 중...';
  try {
    var FIRST_YEAR = 2017;
    var thisYear = new Date().getFullYear();
    var CANDIDATES = 5;
    var NEED = 2;
    var CONCURRENCY = 8;
    var TIMEOUT_MS = 16000;
    var now = new Date();
    var seasons = [];
    for (var yy = thisYear; yy >= FIRST_YEAR; yy--) {
      var sp = { year: yy, kind: 'spring', from: yy + '-03-01T00:00:00Z', to: yy + '-05-31T23:59:59Z' };
      var su = { year: yy, kind: 'summer', from: yy + '-07-01T00:00:00Z', to: yy + '-09-30T23:59:59Z' };
      if (new Date(su.from) <= now) seasons.push(su);
      if (new Date(sp.from) <= now) seasons.push(sp);
    }

    async function fetchJson(url, opts, retries) {
      for (var attempt = 0; attempt <= retries; attempt++) {
        var ctrl = new AbortController();
        var timer = setTimeout(function() { ctrl.abort(); }, TIMEOUT_MS);
        try {
          var r = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
          clearTimeout(timer);
          if (r.ok) return await r.json();
          if (r.status < 500 && r.status !== 429) throw new Error('HTTP ' + r.status);
        } catch (err) {
          clearTimeout(timer);
          if (attempt === retries) throw err;
        }
        if (attempt < retries) await new Promise(function(res) { setTimeout(res, 1500); });
      }
      throw new Error('응답 없음');
    }

    var d = 0.0015;
    var geom = { type: 'Polygon', coordinates: [[[lon-d,lat-d],[lon+d,lat-d],[lon+d,lat+d],[lon-d,lat+d],[lon-d,lat-d]]] };
    var feat = JSON.stringify({ type: 'Feature', properties: {}, geometry: geom });
    var ndviByYear = {};
    var springByYear = {};
    var ndmiByYear = {};
    var bsiByYear = {};
    var seasonsDone = 0, searchFail = 0, ok = 0, fail = 0;

    var progWrap = document.getElementById('luProgWrap'), prog = document.getElementById('luProg');
    if (progWrap) progWrap.hidden = false;
    function showProgress() {
      var tot = seasons.length + (typeof sarYears !== 'undefined' && sarYears ? sarYears.length : 0);
      var done = seasonsDone + (typeof sarDone === 'number' ? sarDone : 0);
      var pct = tot ? Math.min(100, Math.round(done / tot * 100)) : 0;
      if (prog) prog.style.width = Math.max(4, pct) + '%';
      status.textContent = '위성 영상 분석 중... ' + pct + '% (' + FIRST_YEAR + '~' + thisYear + '년, 광학 위성과 레이더)' +
        (fail ? ' · 서버 지연으로 건너뜀 ' + fail + '건' : '');
    }

    async function doSeason(s) {
      var items = [];
      try {
        var res = await fetchJson(PC_API + '/api/stac/v1/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collections: ['sentinel-2-l2a'],
            intersects: { type: 'Point', coordinates: [lon, lat] },
            datetime: s.from + '/' + s.to,
            query: { 'eo:cloud_cover': { lt: 30 } },
            sortby: [{ field: 'eo:cloud_cover', direction: 'asc' }],
            limit: CANDIDATES,
            fields: { include: ['properties.datetime', 'properties.s2:processing_baseline', 'id'] }
          })
        }, 1);
        items = res.features || [];
      } catch (e) { searchFail++; }
      var got = 0;
      var seenDates = {};
      for (var i = 0; i < items.length && got < NEED; i++) {
        var it = items[i];
        var day = it.properties.datetime.slice(0, 10);
        if (seenDates[day]) continue;
        seenDates[day] = true;
        var baseline = it.properties['s2:processing_baseline'] || '00.00';
        var expr = baseline >= '04.00' ? '(B08-B04)/(B08+B04-2000)' : '(B08-B04)/(B08+B04)';
        try {
          var statUrl = PC_API + '/api/data/v1/item/statistics?collection=sentinel-2-l2a&item=' + it.id;
          var statOpts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: feat };
          var ndviP = fetchJson(statUrl + '&expression=' + encodeURIComponent(expr) + '&asset_as_band=true', statOpts, 0);
          var extraP = [];
          if (s.kind === 'summer') {
            var ndmiExpr = baseline >= '04.00' ? '(B08-B11)/(B08+B11-2000)' : '(B08-B11)/(B08+B11)';
            var bsiExpr = baseline >= '04.00' ? '(B11+B04-B08-B02)/(B11+B04+B08+B02-4000)' : '(B11+B04-B08-B02)/(B11+B04+B08+B02)';
            extraP.push(fetchJson(statUrl + '&expression=' + encodeURIComponent(ndmiExpr) + '&asset_as_band=true', statOpts, 0).catch(function() { return null; }));
            extraP.push(fetchJson(statUrl + '&expression=' + encodeURIComponent(bsiExpr) + '&asset_as_band=true', statOpts, 0).catch(function() { return null; }));
          }
          var results = await Promise.all([ndviP].concat(extraP));
          var sj = results[0];
          var sv = sj && sj.properties && sj.properties.statistics ? Object.values(sj.properties.statistics)[0] : null;
          if (sv && sv.mean != null && isFinite(sv.mean)) {
            var v = sv.mean;
            if (s.kind === 'summer') {
              if (ndviByYear[s.year] == null || v > ndviByYear[s.year]) ndviByYear[s.year] = v;
              if (results[1]) {
                var ns = results[1].properties && results[1].properties.statistics ? Object.values(results[1].properties.statistics)[0] : null;
                if (ns && ns.mean != null && isFinite(ns.mean)) {
                  if (ndmiByYear[s.year] == null || ns.mean > ndmiByYear[s.year]) ndmiByYear[s.year] = ns.mean;
                }
              }
              if (results[2]) {
                var bs = results[2].properties && results[2].properties.statistics ? Object.values(results[2].properties.statistics)[0] : null;
                if (bs && bs.mean != null && isFinite(bs.mean)) {
                  if (bsiByYear[s.year] == null || bs.mean > bsiByYear[s.year]) bsiByYear[s.year] = bs.mean;
                }
              }
            } else {
              if (springByYear[s.year] == null || v < springByYear[s.year]) springByYear[s.year] = v;
            }
            got++; ok++;
          } else { fail++; }
        } catch (e) { fail++; }
        showProgress();
      }
      seasonsDone++;
      showProgress();
    }

    var sarByYear = {};
    var sh = 0.0003, shl = sh / Math.cos(lat * Math.PI / 180);
    var sarFeat = JSON.stringify({ type: 'Feature', properties: {}, geometry: { type: 'Polygon',
      coordinates: [[[lon-shl,lat-sh],[lon+shl,lat-sh],[lon+shl,lat+sh],[lon-shl,lat+sh],[lon-shl,lat-sh]]] } });
    var sarYears = [];
    for (var sy = FIRST_YEAR; sy <= thisYear; sy++) if (new Date(sy + '-01-15T00:00:00Z') <= now) sarYears.push(sy);
    var sarDone = 0;
    async function doSarYear(y) {
      try {
        var res = await fetchJson(PC_API + '/api/stac/v1/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collections: ['sentinel-1-rtc'], intersects: { type: 'Point', coordinates: [lon, lat] },
            datetime: y + '-01-01T00:00:00Z/' + y + '-03-31T23:59:59Z', limit: 40,
            fields: { include: ['id', 'properties.datetime', 'properties.sat:orbit_state', 'properties.sat:relative_orbit'] } })
        }, 1);
        var its = res.features || [];
        var cnt = {};
        its.forEach(function(f) { var k = f.properties['sat:orbit_state'] + f.properties['sat:relative_orbit']; cnt[k] = (cnt[k] || 0) + 1; });
        var best = Object.keys(cnt).sort(function(a, b) { return cnt[b] - cnt[a]; })[0];
        its = its.filter(function(f) { return f.properties['sat:orbit_state'] + f.properties['sat:relative_orbit'] === best; }).slice(0, 4);
        var vals = [];
        for (var i = 0; i < its.length; i++) {
          try {
            var sj = await fetchJson(PC_API + '/api/data/v1/item/statistics?collection=sentinel-1-rtc&item=' + its[i].id + '&assets=vv',
              { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: sarFeat }, 0);
            var st = sj && sj.properties && sj.properties.statistics ? Object.values(sj.properties.statistics)[0] : null;
            if (st && st.max > 0) vals.push(10 * Math.log10(st.max));
          } catch (e) {}
        }
        if (vals.length) {
          vals.sort(function(a, b) { return a - b; });
          var m = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
          sarByYear[y] = Math.round(m * 10) / 10;
        } else { sarByYear[y] = null; }
      } catch (e) { sarByYear[y] = null; }
      sarDone++;
      showProgress();
    }
    var sarIdx = 0;
    async function sarRunner() { while (sarIdx < sarYears.length) { await doSarYear(sarYears[sarIdx++]); } }
    var sarRunners = [];
    for (var k2 = 0; k2 < Math.min(5, sarYears.length); k2++) sarRunners.push(sarRunner());
    showProgress();
    var nextIdx = 0;
    async function runner() {
      while (nextIdx < seasons.length) { await doSeason(seasons[nextIdx++]); }
    }
    var runners = [];
    for (var k = 0; k < Math.min(CONCURRENCY, seasons.length); k++) runners.push(runner());
    await Promise.all(runners.concat(sarRunners));

    if (searchFail === seasons.length) {
      throw new Error('위성 데이터 서버(Planetary Computer)가 응답하지 않습니다. 잠시 후 다시 시도하세요');
    }

    var years = Object.keys(ndviByYear).map(Number).sort(function(a, b) { return a - b; });
    if (years.length < 2) {
      throw new Error(fail > ok ? '위성 데이터 서버 응답이 불안정합니다. 잠시 후 다시 시도하세요' : '유효한 여름 NDVI 데이터가 부족합니다 (' + years.length + '년). 좌표를 확인하세요');
    }
    renderChart({
      label: window.LU_LABEL || (lat.toFixed(4) + ', ' + lon.toFixed(4)),
      lat: lat, lon: lon,
      years: years,
      ndvi_summer: years.map(function(y) { return Math.round(ndviByYear[y] * 100) / 100; }),
      ndvi_spring: years.map(function(y) { return springByYear[y] != null ? Math.round(springByYear[y] * 100) / 100 : null; }),
      ndmi_summer: years.map(function(y) { return ndmiByYear[y] != null ? Math.round(ndmiByYear[y] * 100) / 100 : null; }),
      bsi_summer: years.map(function(y) { return bsiByYear[y] != null ? Math.round(bsiByYear[y] * 100) / 100 : null; }),
      scenes: ok,
      sar: sarByYear,
      note: years[0] + '~' + years[years.length - 1] + '년 여름(7~9월) 최고 NDVI와 봄(3~5월) 최저 NDVI입니다. 계절마다 구름이 가장 적은 장면 ' + NEED + '개 기준.'
    });
    status.textContent = '조회 완료: ' + (window.LU_LABEL ? window.LU_LABEL + ' · ' : '') + years.length + '년, ' + ok + '개 장면 분석' + (fail ? ' (서버 지연 ' + fail + '건 건너뜀)' : '') + ' — 위치가 어긋나면 지도에서 땅을 눌러 다시 조회하세요.';
    var ob = document.getElementById('luOrder'); if (ob) ob.hidden = false;
    if (innerWidth < 1024) { var cw = document.getElementById('luChartWrap'); if (cw) cw.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    try { if (window.LU_LABEL) history.replaceState(null, '', '?jibun=' + encodeURIComponent(window.LU_QUERY || window.LU_LABEL)); } catch (e) {}
    status.style.color = '#3CB371';
  } catch (e) {
    status.textContent = '조회 실패: ' + e.message + ' — 샘플 보기를 먼저 사용해 보세요.';
    status.style.color = '#EF4444';
  } finally {
    var pw = document.getElementById('luProgWrap'); if (pw) pw.hidden = true;
    btn.disabled = false;
    btn.textContent = '조회 시작';
  }
}

/* ── 조회 결과 → 리포트 의뢰 ── */
function luOrder(e) {
  if (e) e.preventDefault();
  var lat = document.getElementById('luLat').value, lon = document.getElementById('luLon').value;
  var label = window.LU_LABEL || (lat && lon ? '좌표 ' + lat + ', ' + lon : '');
  /* 같은 페이지에 contact가 있으면 스크롤, 없으면 /about/#contact로 이동 */
  var f = document.getElementById('inqAddress');
  if (f) {
    f.value = label;
    var m = document.getElementById('inqMessage'); if (m && !m.value) m.value = '간편 조회를 해 봤습니다. 이 땅의 경작이력 리포트를 받고 싶습니다. (용도: )';
    var c = document.getElementById('contact'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function() { var n = document.getElementById('inqName'); if (n) n.focus({ preventScroll: true }); }, 700);
  } else {
    window.location.href = '/about/#contact';
  }
}

/* ── 지번 한 번에 조회 (첫 화면·조회 영역 공통) ── */
var LU_BUSY = false;
async function luQuick() {
  if (LU_BUSY) return; LU_BUSY = true;
  try {
    window.LU_QUERY = (document.getElementById('luAddr').value || '').trim();
    var found = await luFindAddr();
    if (found) await runLookup();
  } finally { LU_BUSY = false; }
}
function heroQuick(e) {
  if (e) e.preventDefault();
  var v = (document.getElementById('heroAddr').value || '').trim();
  if (!v) return;
  /* 홈페이지에서 입력 시 조회 페이지로 이동 */
  window.location.href = '/lookup/?jibun=' + encodeURIComponent(v);
}

/* ── URL 파라미터로 자동 조회 (조회 페이지 전용) ── */
(function() {
  if (!document.getElementById('luAddr')) return;
  var m = location.search.match(/[?&]jibun=([^&]+)/);
  if (!m) return;
  var v = decodeURIComponent(m[1].replace(/\+/g, ' '));
  window.LU_FROM_URL = true;
  var go = function() { document.getElementById('luAddr').value = v; luQuick(); };
  if (document.readyState === 'complete') setTimeout(go, 300); else window.addEventListener('load', function() { setTimeout(go, 300); });
})();

/* ── PC에서는 조회 섹션이 보이면 샘플 결과를 먼저 보여 준다 (오른쪽 빈칸 방지) ── */
(function() {
  var sec = document.getElementById('lookup'); if (!sec || !('IntersectionObserver' in window)) return;
  var ob = new IntersectionObserver(function(es) {
    if (!es[0].isIntersecting) return; ob.disconnect();
    var wrap = document.getElementById('luChartWrap');
    if (innerWidth >= 1024 && !window.LU_FROM_URL && !LU_BUSY && wrap && !wrap.classList.contains('active') && typeof runDemo === 'function') {
      if (typeof luInitMap === 'function') luInitMap();
      runDemo();
    }
  }, { threshold: 0.25 });
  ob.observe(sec);
})();
