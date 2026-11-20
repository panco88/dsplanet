"""DS플래닛 휴대폰 '내 지번 바로 조회' 개선 (2026-11-20). 한 번만 실행.
- 첫 화면에 지번 입력창 → 한 번에 위치 찾기 + 10년 조회
- 위성(NDVI)과 레이더 조회를 동시에 돌려 대기 시간 단축, 진행 막대 표시, 끝나면 결과로 이동
- 휴대폰 지도: 한 손가락은 페이지 스크롤, 두 손가락으로 지도 이동·확대, 한 번 눌러 위치 선택
- 결과 주소 공유: ?jibun=... 로 열면 자동 조회
- 입력창 글자 16px (아이폰이 입력할 때 화면을 확대하지 않게)
"""
import os, sys
sys.stdout.reconfigure(encoding='utf-8')
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); F = f'{R}/index.html'
s = open(F, encoding='utf-8').read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:70], s.count(a)); s = s.replace(a, b)

# ── 1) 첫 화면 지번 입력창 ──
rep('''    <div class="hero-actions">
      <a href="/reports/dsplanet-sample-farm-history.pdf"''',
'''    <form class="hero-quick" onsubmit="heroQuick(event)" role="search" aria-label="내 땅 10년 이력 바로 보기">
      <label for="heroAddr" class="hero-quick-label">내 땅 10년 이력, 지번만 넣으면 무료로 바로 봅니다</label>
      <div class="hero-quick-row">
        <input type="text" id="heroAddr" placeholder="예: 김제시 진봉면 정당리 100" autocomplete="off" enterkeyhint="search">
        <button type="submit">바로 조회</button>
      </div>
      <div class="hero-quick-note">위성 영상 약 40장을 분석합니다 · 1분 안팎 · 회원가입 없음</div>
    </form>
    <div class="hero-actions">
      <a href="/reports/dsplanet-sample-farm-history.pdf"''')
rep('<a href="#lookup" class="btn btn-outline">무료 간편 조회 해보기</a>', '<a href="#lookup" class="btn btn-outline">지도에서 직접 고르기</a>')

# ── 2) 조회 영역: 버튼 이름, 진행 막대, 휴대폰 지도 안내 ──
rep('<button type="button" id="luAddrBtn" onclick="luFindAddr()">지번 찾기</button>',
    '<button type="button" id="luAddrBtn" onclick="luQuick()">바로 조회</button>')
rep('<input type="text" id="luAddr" placeholder="지번 입력 (예: 김제시 진봉면 정당리 100)" autocomplete="off">',
    '<input type="text" id="luAddr" placeholder="지번 입력 (예: 김제시 진봉면 정당리 100)" autocomplete="off" enterkeyhint="search">')
rep('      <div class="lookup-status" id="luStatus"></div>\n',
    '      <div class="lookup-status" id="luStatus"></div>\n      <div class="lu-progress" id="luProgWrap" hidden><div id="luProg"></div></div>\n')
i = s.index('<div class="lookup-map-hint">'); j = s.index('</div>', i) + len('</div>')
s = s[:j] + '\n      <div class="lookup-map-hint touch-only">휴대폰에서는 두 손가락으로 지도를 움직이고, 한 번 눌러 땅을 고르세요.</div>' + s[j:]

# ── 3) 지번 찾기가 성공 여부를 돌려주게 ──
a = s.index('async function luFindAddr() {'); b = s.index('(function() {\n  var a = document.getElementById(\'luAddr\');')
f = s[a:b]
f2 = f.replace("    status.style.color = '#EF4444';\n    return;\n  }\n  btn.disabled = true;", "    status.style.color = '#EF4444';\n    return false;\n  }\n  btn.disabled = true;")
f2 = f2.replace("      status.style.color = '#EF4444';\n      return;\n    }", "      status.style.color = '#EF4444';\n      return false;\n    }")
f2 = f2.replace("""    status.textContent = '찾았습니다: ' + label + ' — 사각형이 분석할 땅 위에 있는지 확인한 뒤 "조회 시작"을 누르세요.';
    status.style.color = '#3CB371';""", """    status.textContent = '찾았습니다: ' + label;
    status.style.color = '#3CB371';
    window.LU_LABEL = label;
    return true;""")
f2 = f2.replace("    status.style.color = '#EF4444';\n  } finally {\n    btn.disabled = false; btn.textContent = '지번 찾기';",
                "    status.style.color = '#EF4444';\n    return false;\n  } finally {\n    btn.disabled = false; btn.textContent = '바로 조회';")
assert f2.count('return false;') == 3 and 'return true;' in f2, (f2.count('return false;'))
s = s[:a] + f2 + s[b:]
rep("if (a) a.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); luFindAddr(); } });",
    "if (a) a.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); luQuick(); } });")

# ── 4) 위성·레이더 동시 실행 + 진행 막대 ──
sar_start = s.index('    // ── 레이더(Sentinel-1 RTC)')
sar_end_marker = '    await Promise.all(sarRunners);\n'
sar_end = s.index(sar_end_marker) + len(sar_end_marker)
sar_block = s[sar_start:sar_end]
s = s[:sar_start] + s[sar_end:]
sar_block = sar_block.replace("      status.textContent = '레이더로 건물 흔적 확인 중... (' + sarDone + '/' + sarYears.length + '년)';", "      showProgress();")
sar_block = sar_block.replace("    status.textContent = '레이더로 건물 흔적 확인 중... (0/' + sarYears.length + '년)';\n", "")
sar_block = sar_block.replace(sar_end_marker, '')
rep('''    showProgress();
    var nextIdx = 0;''', sar_block + '''    showProgress();
    var nextIdx = 0;''')
rep('''    for (var k = 0; k < Math.min(CONCURRENCY, seasons.length); k++) runners.push(runner());
    await Promise.all(runners);''', '''    for (var k = 0; k < Math.min(CONCURRENCY, seasons.length); k++) runners.push(runner());
    await Promise.all(runners.concat(sarRunners));  // 위성(NDVI)과 레이더를 동시에''')
rep('''    function showProgress() {
      status.textContent = '위성 장면 분석 중... (' + seasonsDone + '/' + seasons.length + '개 계절, ' + FIRST_YEAR + '~' + thisYear + '년)' +
        (fail ? ' · 서버 지연으로 건너뜀 ' + fail + '건' : '');
    }''', '''    var progWrap = document.getElementById('luProgWrap'), prog = document.getElementById('luProg');
    if (progWrap) progWrap.hidden = false;
    function showProgress() {
      var tot = seasons.length + (typeof sarYears !== 'undefined' && sarYears ? sarYears.length : 0);
      var done = seasonsDone + (typeof sarDone === 'number' ? sarDone : 0);
      var pct = tot ? Math.min(100, Math.round(done / tot * 100)) : 0;
      if (prog) prog.style.width = Math.max(4, pct) + '%';
      status.textContent = '위성 영상 분석 중... ' + pct + '% (' + FIRST_YEAR + '~' + thisYear + '년, 광학 위성과 레이더)' +
        (fail ? ' · 서버 지연으로 건너뜀 ' + fail + '건' : '');
    }''')
# 끝나면 막대 숨기고, 휴대폰에서는 결과 그래프로 이동, 주소 공유용 URL
rep("    status.textContent = '조회 완료: ' + years.length + '년, ' + ok + '개 장면 분석' + (fail ? ' (서버 지연 ' + fail + '건 건너뜀)' : '');",
    """    status.textContent = '조회 완료: ' + (window.LU_LABEL ? window.LU_LABEL + ' · ' : '') + years.length + '년, ' + ok + '개 장면 분석' + (fail ? ' (서버 지연 ' + fail + '건 건너뜀)' : '') + ' — 위치가 어긋나면 지도에서 땅을 눌러 다시 조회하세요.';
    if (innerWidth < 1024) { var cw = document.getElementById('luChartWrap'); if (cw) cw.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    try { if (window.LU_LABEL) history.replaceState(null, '', '?jibun=' + encodeURIComponent(window.LU_QUERY || window.LU_LABEL) + '#lookup'); } catch (e) {}""")
rep("  } finally {\n    btn.disabled = false;\n", "  } finally {\n    var pw = document.getElementById('luProgWrap'); if (pw) pw.hidden = true;\n    btn.disabled = false;\n")

# 지도에서 직접 고르면 지번 표시는 지운다
rep("    luSetPoint(e.latlng.lat, e.latlng.lng);\n", "    luSetPoint(e.latlng.lat, e.latlng.lng); window.LU_LABEL = null; window.LU_QUERY = null;\n")

# ── 5) 휴대폰 지도: 한 손가락 드래그 끔 ──
rep("luMap = L.map('luMap', { scrollWheelZoom: false, tap: true })",
    "luMap = L.map('luMap', { scrollWheelZoom: false, tap: true, dragging: !L.Browser.mobile })")

# ── 6) 한 번에 조회하는 함수 + ?jibun= 자동 조회 ──
js = """
// 2026-11-20 지번 한 번에 조회 (첫 화면·조회 영역 공통)
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
  document.getElementById('luAddr').value = v;
  var sec = document.getElementById('lookup'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  luQuick();
}
(function() {
  var m = location.search.match(/[?&]jibun=([^&]+)/);
  if (!m) return;
  var v = decodeURIComponent(m[1].replace(/\\+/g, ' '));
  window.LU_FROM_URL = true;
  var go = function() { document.getElementById('heroAddr').value = v; heroQuick(); };
  if (document.readyState === 'complete') setTimeout(go, 300); else window.addEventListener('load', function() { setTimeout(go, 300); });
})();
"""
i = s.index('// 2026-11-20 PC에서는 간편 조회가 화면에 들어오면'); s = s[:i] + js.lstrip('\n') + s[i:]
# 주소로 들어왔으면 PC 자동 샘플은 띄우지 않는다
rep("if (innerWidth >= 1024 && wrap && !wrap.classList.contains('active') && typeof runDemo === 'function') {",
    "if (innerWidth >= 1024 && !window.LU_FROM_URL && !LU_BUSY && wrap && !wrap.classList.contains('active') && typeof runDemo === 'function') {")

# ── 7) CSS ──
css = """
/* ===== 2026-11-20 첫 화면 지번 바로 조회 · 휴대폰 ===== */
.hero-quick { max-width: 560px; margin: 0 0 22px; padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(60,179,113,0.35); }
.hero-quick-label { display: block; font-size: 15px; font-weight: 600; color: #FFFFFF; margin-bottom: 10px; }
.hero-quick-row { display: flex; gap: 8px; }
.hero-quick-row input { flex: 1; min-width: 0; height: 50px; padding: 0 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.25); color: #FFFFFF; font-size: 16px; font-family: 'Noto Sans KR', sans-serif; outline: none; }
.hero-quick-row input:focus { border-color: var(--accent-light); }
.hero-quick-row input::placeholder { color: #7C8B83; }
.hero-quick-row button { flex-shrink: 0; height: 50px; padding: 0 20px; border-radius: 8px; border: none; background: var(--accent); color: #FFFFFF; font-size: 16px; font-weight: 700; font-family: 'Noto Sans KR', sans-serif; cursor: pointer; }
.hero-quick-note { margin-top: 8px; font-size: 12.5px; color: #94A3B8; }
.lookup-search input { font-size: 16px; min-height: 48px; }
.lookup-search button { min-height: 48px; }
.btn-lookup, .btn-demo { min-height: 48px; }
.lu-progress { height: 8px; border-radius: 99px; background: rgba(255,255,255,0.08); overflow: hidden; margin: 6px 0 4px; }
.lu-progress > div { height: 100%; width: 4%; background: linear-gradient(90deg, var(--accent), var(--accent-light)); transition: width .4s ease; }
.touch-only { display: none; }
@media (hover: none) and (pointer: coarse) { .touch-only { display: block; color: #FFD54F; } }
@media (max-width: 640px) {
  .hero { padding-block: 44px 40px; }
  .hero h1 { font-size: 32px; }
  .hero-quick { padding: 14px; margin-bottom: 18px; }
  .hero-actions { margin-bottom: 32px; }
  .hero-actions .btn { flex: 1 1 100%; justify-content: center; }
}
"""
rep('</style>', css + '</style>')
open(F, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
