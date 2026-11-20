"""DS플래닛 마무리 (2026-11-20): 넓은 화면, 휴대폰 메뉴, 간편 조회를 위로, 과장 문구 정리. 한 번만 실행."""
import os, sys
sys.stdout.reconfigure(encoding='utf-8')
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); F = f'{R}/index.html'
s = open(F, encoding='utf-8').read()
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a[:50], s.count(a)); s = s.replace(a, b)

# 1) 문구: 사실과 다르거나 확인 안 되는 표현
rep('Sentinel-2 / SAR / 항공영상 실시간 분석', 'Sentinel-2 · Sentinel-1 레이더 · 항공영상 분석')
rep('<h4>AI 판독 + 전문가 검증</h4>', '<h4>자동 판독 + 전문가 검증</h4>')
rep('객관적 보조 자료로 활용되고 있습니다.', '객관적 보조 자료로 활용할 수 있습니다.')

# 2) 첫 화면 두 번째 버튼 → 간편 조회
rep('<a href="#services" class="btn btn-outline">서비스 알아보기</a>', '<a href="#lookup" class="btn btn-outline">무료 간편 조회 해보기</a>')

# 3) 순서: 간편 조회를 서비스 바로 아래로 (직접 써 보는 것이 가장 강한 증거)
a = s.index('<!-- QUICK LOOKUP (간편 조회) -->'); b = s.index('<!-- PRICING -->')
blk = s[a:b]; s = s[:a] + s[b:]
i = s.index('<!-- HOW IT WORKS -->'); s = s[:i] + blk + s[i:]
# 상단 메뉴 순서도 같이
rep('''      <li><a href="#howit" class="hide-mobile">작동 원리</a></li>
      <li><a href="#lookup" class="hide-mobile">간편 조회</a></li>''',
    '''      <li><a href="#lookup" class="hide-mobile">간편 조회</a></li>
      <li><a href="#howit" class="hide-mobile">작동 원리</a></li>''')

# 4) 휴대폰 접는 메뉴
rep('      <li><a href="#contact" class="nav-cta">문의하기</a></li>\n',
    '      <li><a href="#contact" class="nav-cta">문의하기</a></li>\n'
    '      <li class="nav-burger-li"><button type="button" class="nav-burger" aria-label="메뉴" aria-expanded="false" aria-controls="navDrawer" onclick="toggleNavMenu()">'
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg></button></li>\n')
drawer = ('  <div class="nav-drawer" id="navDrawer">\n'
          '    <a href="#services">서비스</a>\n    <a href="#lookup">간편 조회 (무료)</a>\n    <a href="#howit">작동 원리</a>\n'
          '    <a href="#sample">샘플 리포트</a>\n    <a href="#pricing">요금</a>\n    <a href="#faq">FAQ</a>\n'
          '    <a href="#contact" class="nav-drawer-cta">문의 · 샘플 리포트 요청</a>\n  </div>\n')
i = s.index('</nav>'); s = s[:i] + drawer + s[i:]

css = """
/* ===== 2026-11-20 넓은 화면 활용 (PC) ===== */
@media (min-width: 768px) { .inner { padding-left: 32px; padding-right: 32px; } }
@media (min-width: 1024px) {
  .inner { max-width: 1240px; }
  .section-desc { max-width: 720px; }
  .hero-sub { max-width: 680px; }
  .lookup-map { height: 420px; }
  .lookup-chart-canvas { height: 300px; }
}
@media (min-width: 1440px) { .inner { max-width: 1320px; } }

/* ===== 2026-11-20 휴대폰 접는 메뉴 ===== */
.nav-burger-li { display: none; }
.nav-burger { background: none; border: 1px solid rgba(255,255,255,0.2); color: #E2E8F0; border-radius: 6px; width: 36px; height: 34px; display: grid; place-items: center; cursor: pointer; padding: 0; }
.nav-drawer { display: none; border-top: 1px solid rgba(255,255,255,0.08); padding: 8px 16px 16px; }
.nav-drawer a { display: block; padding: 13px 4px; color: #CBD5E1; text-decoration: none; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.nav-drawer a.nav-drawer-cta { border-bottom: none; margin-top: 10px; text-align: center; background: var(--accent); color: #FFFFFF; border-radius: 8px; font-weight: 600; }
nav.menu-open .nav-drawer { display: block; }
@media (max-width: 720px) { .nav-burger-li { display: list-item; list-style: none; } }
"""
rep('</style>', css + '</style>')

js = """<script>
// 2026-11-20 휴대폰 접는 메뉴
function toggleNavMenu(force) {
  var nav = document.querySelector('nav'); if (!nav) return;
  var open = (typeof force === 'boolean') ? force : !nav.classList.contains('menu-open');
  nav.classList.toggle('menu-open', open);
  var b = document.querySelector('.nav-burger'); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
}
document.querySelectorAll('.nav-drawer a').forEach(function(a) { a.addEventListener('click', function() { toggleNavMenu(false); }); });
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') toggleNavMenu(false); });
window.addEventListener('resize', function() { if (innerWidth > 720) toggleNavMenu(false); });
</script>
"""
i = s.rindex('</script>') + len('</script>'); s = s[:i] + '\n' + js + s[i:]
open(F, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
