"""Runs interaction tests against real app assets in Chromium with network isolated."""
import json, os, re, sys, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
base=Path(__file__).resolve().parents[1]
fixture=json.loads((base/'assets/builtin.json').read_text())
assert len(fixture['questions'])>=10
keys={q['id']:q for q in fixture['questions']}
errors=[];external=[];passed=[]
def ok(s):
    passed.append(s); print('PASS',s,flush=True)
def require(cond):
    if not cond: raise AssertionError('condition failed')
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN'),args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking'])
    ctx=browser.new_context(viewport={'width':360,'height':800},locale='ru-RU',accept_downloads=True)
    def route(r):
        from urllib.parse import urlparse
        u=urlparse(r.request.url)
        if u.netloc!='exam.invalid' or not u.path.startswith('/app/'):external.append(r.request.url);r.abort();return
        f=base/'assets'/u.path.split('/')[-1]
        if f.is_file():r.fulfill(path=f,content_type={'.js':'application/javascript','.css':'text/css','.json':'application/json','.html':'text/html'}[f.suffix])
        else:r.abort()
    ctx.route('**/*',route);ctx.set_offline(True)
    page=ctx.new_page();page.set_default_timeout(6000);page.on('pageerror',lambda e:errors.append(str(e)))
    origin='https://exam.invalid/app/index.html'
    click=lambda a:page.locator('[data-action="'+a+'"]:visible').first.click()
    act=lambda a:page.evaluate('(a)=>act(a)',a)
    def data():return page.evaluate('JSON.parse(localStorage.getItem("exampro.v1"))')
    def profiel():return data()['profiles'][data()['active']]
    def main():return page.locator('#main').inner_text()
    page.goto(origin);page.wait_for_selector('[data-action=continue]')
    for size in [(360,800),(412,920),(800,1100),(1000,620),(320,620)]:
        page.set_viewport_size(dict(zip(('width','height'),size)))
        require(page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    ok('Главная и навигация на пяти размерах без горизонтальной прокрутки')
    page.set_viewport_size({'width':390,'height':844});click('continue')
    first=fixture['questions'][0];wrong=next(o['id'] for o in first['options'] if o['id'] not in first['keys'])
    click('answer:'+wrong);require(page.locator('.opt.wrong').count()==1 and page.locator('.opt.right').count()>=1)
    click('markstar:'+first['id']);page.get_by_text('Мои отметки и история',exact=True).click();click('markhard:'+first['id'])
    click('note:'+first['id']);page.locator('#noteText').fill('Отработать формулировку');click('savenote:'+first['id']);click('next')
    page.reload();page.wait_for_selector('[data-action=continue]');click('continue');require(profiel()['study']['at']==1);click('prev');require('Ответ неверный' in main());click('home')
    ok('Неверный и верный выбор, отметки, заметка, предыдущий вопрос и восстановление после перезапуска')
    click('catalog');page.locator('#query').fill('№ 31');require(page.locator('#matches [data-action^="openq:"]').count()==1);click('openq:31');click('answer:1');require('статье 242' in main() or 'ст. 242' in main());click('home');click('catalog');page.locator('#query').fill('322');click('openq:322');click('read');require('Разбор без оценки' in main());click('home')
    ok('Поиск и особая обработка № 31 и № 322')
    click('setupexam');page.check('#verifiedOnly');require(str(sum(bool(q.get('reviewed')) for q in fixture['questions'])) in page.locator('#avail').inner_text());page.uncheck('#verifiedOnly');page.select_option('#size','own');page.locator('#customsize').fill('3');page.check('#timerOn');page.fill('#minutes','5');page.fill('#pass','33');click('starttest')
    x=profiel()['exam'];ids=x['ids'];q=keys[ids[0]];click('answer:'+q['keys'][0]);click('flag');click('next')
    q=keys[ids[1]];click('answer:'+next(o['id'] for o in q['options'] if o['id'] not in q['keys']));require(not page.locator('.opt.right,.feedback').count());click('home')
    page.reload();page.wait_for_selector('[data-action=resumeexam]');click('resumeexam');require(profiel()['exam']['deadline']==x['deadline'] and profiel()['exam']['marked']==[ids[0]])
    click('next');click('finish');click('confirmfinish');r=profiel()['history'][0];require(len(r['answers'])==2 and len(r['ids'])==3 and 'Экзамен сдан' in main())
    click('reviewall');require('Ваш ответ' in main())
    with page.expect_download() as e:click('exportresult')
    result=json.loads(Path(e.value.path()).read_text());require(result['result']=={'right':1,'wrong':1,'skip':1,'total':3,'pct':33.3,'passed':True})
    click('retrywrong');require(len(profiel()['exam']['ids'])==2);click('finish');click('confirmfinish');click('home')
    ok('Экзамен, перемешивание, флаг, возобновление таймера, 1 верно/1 ошибка/1 пропуск, экспорт, пересдача ошибок')
    click('setupexam');page.check('#forward');page.check('#timerOn');page.fill('#minutes','1');click('starttest');require(not page.locator('[data-action=prev],#jump,[data-action=flag]').count())
    history=len(profiel()['history']);page.clock.install();page.clock.fast_forward(61000);page.wait_for_selector('[data-action=retest]');require(len(profiel()['history'])==history+1 and not profiel()['exam']);click('home')
    ok('Запрет возврата и автоматическая сдача по истечении времени')
    click('decks');click('newdeck');page.fill('#deckName','Мои вопросы');page.fill('#deckNums','1, 3–4');click('savedeck');click('deck:0');click('reveal');click('grade:again');click('reveal');click('grade:good');require(profiel()['study']['at']==2);click('home')
    click('smart');require(profiel()['study']['mode']=='smart');click('home');click('plan');page.fill('#studyMinutes','7');page.fill('#examDate','2027-01-17');click('saveplan');require(profiel()['plan']['minutes']==7);click('home');click('errors');click('listoften');require('Повторяющиеся ошибки' in main())
    ok('Своя подборка карточек, самооценка, умная подготовка, план и повтор ошибок')
    click('more');click('topics');page.locator('[data-topic]').first.check();click('topicstrain');click('starttest');require(profiel()['study']['mode']=='train');require(len({keys[k]['topic'] for k in profiel()['study']['ids']})==1)
    click('home');click('settings');page.select_option('#theme','dark');page.select_option('#font','150');require(page.evaluate('document.documentElement.classList.contains("dark")'))
    for size in [(320,640),(360,800),(768,1024),(980,550)]:
        page.set_viewport_size(dict(zip(('width','height'),size)));require(page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.select_option('#font','100');click('reset');click('cancel');require(len(profiel()['history'])>=2)
    with page.expect_download() as d:click('backup')
    saved=json.loads(Path(d.value.path()).read_text());require(saved['format']=='exampro.backup');click('reset');click('doreset');require(not profiel()['history'] and first['id'] in profiel()['notes'])
    page.evaluate('(v)=>receiveDocument("backup",v)',json.dumps(saved));click('applyimport');require(len(profiel()['history'])>=2)
    ok('Темы, светлая/тёмная тема, размер текста, подтверждение сброса, резервная копия и восстановление')
    click('more');click('banks');bad={'format':'exampro.bank'};page.evaluate('(v)=>receiveDocument("bank",v)',json.dumps(bad));require('Файл не принят' in page.locator('#modal').inner_text());click('cancel')
    lesson=json.loads(json.dumps(fixture));lesson['id']='other';lesson['questions']=lesson['questions'][:3];lesson['title']='Новая дисциплина'
    page.evaluate('(v)=>receiveDocument("bank",v)',json.dumps(lesson));click('applyimport');require(data()['active']=='other' and not profiel()['history'])
    click('more');click('banks');click('switch:'+fixture['id']);require(len(profiel()['history'])>=2)
    for actname in ['stats','history','help','decks','errors','plan','settings','banks','topics']:
        click('more');click(actname) if actname!='stats' else click('stats');require(len(main())>20)
    click('home');require(not errors and not external)
    ok('Импорт базы, изоляция дисциплин, отклонение повреждённых файлов, основные экраны без сети и ошибок JavaScript')
    print('UI groups:',len(passed),'external requests:',external,'page errors:',errors)
    browser.close()

