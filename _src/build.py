"""DS플래닛 사이트 페이지 조립 (2026-11-21 멀티페이지 전환).
문구 수정은 _src/parts/*.html, 디자인은 assets/site.css, 동작은 assets/site.js에서 한다.
실행: python -I _src/build.py  → index.html, lookup/, reports/, pricing/, about/ 의 index.html
(_src 폴더는 GitHub Pages가 공개하지 않는다 — 밑줄로 시작하는 폴더)
"""
import os, sys, hashlib
sys.stdout.reconfigure(encoding='utf-8')
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = f'{R}/_src/parts'
def part(n): return open(f'{P}/{n}.html', encoding='utf-8').read()

def intro(label, title, desc):
    """하위 페이지 맨 위의 짧은 머리말 (첫 화면과 같은 어두운 띠)"""
    return f'''
<!-- PAGE INTRO -->
<section class="hero" style="padding-block:56px 44px;">
  <div class="inner">
    <div class="section-label" style="color:var(--accent);">{label}</div>
    <h1 style="font-family:var(--font-display);font-size:clamp(28px,4vw,40px);font-weight:800;line-height:1.2;margin:8px 0 12px;">{title}</h1>
    <p style="max-width:640px;color:#94A3B8;font-size:16px;line-height:1.7;margin:0;">{desc}</p>
  </div>
</section>
'''

# Chart.js + Leaflet은 조회 페이지에서만 필요
LOOKUP_LIBS = '''<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
'''

PAGES = {
 '': ('DS플래닛 — 위성으로 보는 토지의 진실',
      ['hero', 'services', 'faq', 'cta']),
 'services': ('서비스 소개 — DS플래닛',
      [intro('OUR SERVICES', '위성 데이터로 답하는 세 가지 영역',
             'DS플래닛은 토지·도로·건물, 세 가지 영역에서 위성 관측 데이터를 분석하여 세금·투자·관리의 객관적 근거를 제공합니다.'),
       'services-overview', 'cta']),
 'lookup': ('토지 분석 — DS플래닛',
      [intro('LAND ANALYSIS', '위성이 답하는 토지의 질문',
             '현장 방문 없이, 위성이 10년 동안 찍어 둔 기록에서 답을 꺼냅니다. 간편 조회는 무료이고, 정밀 리포트는 전문가가 판독한 보고서로 납품합니다.'),
       'lookup', 'why', 'service-detail', 'usecases']),
 'reports': ('리포트 소개 — DS플래닛',
      [intro('REPORTS', '분석 리포트',
             '위성 관측 데이터와 항공영상을 바탕으로, 대상 필지의 경작이력·건물 유무·토지 변화를 정리한 보고서를 제공합니다.'),
       'sample', 'howit', 'cta']),
 'pricing': ('요금 안내 — DS플래닛',
      [intro('PRICING', '요금 안내',
             '간편 조회는 무료입니다. 정밀 리포트는 분석 범위에 따라 세 가지 패키지를 제공합니다.'),
       'pricing', 'cta']),
 'about': ('회사 소개 — DS플래닛',
      [intro('ABOUT', '회사 소개',
             'DS플래닛은 위성 데이터로 토지의 과거를 읽는 부동산 분석 서비스입니다. 동산건설주식회사의 위성 분석 사업 법인입니다.'),
       'faq', 'contact']),
 'road': ('도로 점용 진단 — DS플래닛',
      [intro('ROAD', '내 땅이 도로가 됐는데, 세금은 그대로?',
             '보상 없이 도로에 편입된 토지는 재산세 비과세 대상입니다. 위성으로 도로화 시점을 특정하고, 세무사를 연결합니다.'),
       'road-lookup', 'road', 'cta']),
 'construction': ('건설현장 모니터링 — DS플래닛',
      [intro('CONSTRUCTION MONITORING', '건설 현장을 위성으로 감시합니다',
             '접근 허가 없이, 날씨와 무관하게, 전국·해외 어느 현장이든 정기적으로 공정률을 측정합니다. PF 대출 관리, 시공 검증, 경쟁사 벤치마킹까지.'),
       'const-lookup', 'construction', 'cta']),
}

head, nav, footer = part('head'), part('nav'), part('footer')
def ver(f): return hashlib.md5(open(f'{R}/assets/{f}', 'rb').read()).hexdigest()[:8]
head = head.replace('/assets/site.css"', f'/assets/site.css?v={ver("site.css")}"')
js_ver = ver('site.js')

for slug, (title, blocks) in PAGES.items():
    path = f'/{slug}/' if slug else '/'
    body = ''.join(b if b.lstrip().startswith('<') else part(b) for b in blocks)
    libs = LOOKUP_LIBS if slug in ('lookup', 'road', 'construction') else ''
    html = (head.replace('{TITLE}', title).replace('{PATH}', path)
            + '</head>\n<body>\n' + nav + body + footer
            + libs
            + f'<script src="/assets/site.js?v={js_ver}"></script>\n</body>\n</html>\n')
    d = f'{R}/{slug}' if slug else R; os.makedirs(d, exist_ok=True)
    open(f'{d}/index.html', 'w', encoding='utf-8', newline='\n').write(html)
    print(f'  {"/" + slug if slug else "/":<12} {len(html) // 1024:>3} KB')
print('Done.')
