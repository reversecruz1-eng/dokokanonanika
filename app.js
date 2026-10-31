(function () {
  'use strict';
  var KN = window.KN;
  var DB = window.HABITS || { entries: [], updated: '' };
  var entries = DB.entries;
  var byId = {};
  entries.forEach(function (e) { byId[e.id] = e; });
  var verified = entries.filter(function (e) { return e.status === 'verified'; });

  function load(k, def) { try { var v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存できなくても動く */ } }
  function $(s) { return document.querySelector(s); }

  var state = {
    tone: load('kn.tone', 'normal'),
    auto: load('kn.auto', true),
    mine: load('kn.mine', []),
    checks: load('kn.checks', {}),
    recent: [], current: null, token: 0, playing: false, fast: false, wake: null, last: Date.now()
  };

  // ---- 吹き出し ----
  function speak(who, on) { var c = $('#' + who); if (c) c.classList.toggle('talking', on); }
  function addMsg(who, text) {
    var box = $('#balloon');
    var d = document.createElement('div');
    d.className = 'msg ' + who;
    d.textContent = text;
    box.appendChild(d);
    while (box.children.length > 8) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }
  function wait(ms) {
    return new Promise(function (res) {
      var t = setTimeout(res, ms);
      state.wake = function () { clearTimeout(t); res(); };
    });
  }
  async function play(lines) {
    var my = ++state.token;
    state.playing = true; state.fast = false;
    for (var i = 0; i < lines.length; i++) {
      if (my !== state.token) return;
      var l = lines[i];
      addMsg(l.who, l.text);
      if (!state.fast) {
        speak(l.who, true);
        await wait(Math.min(3200, 900 + l.text.length * 70));
        speak(l.who, false);
      }
    }
    if (my === state.token) { state.playing = false; speak('kotori', false); speak('noise', false); }
  }
  function skip() { if (state.playing) { state.fast = true; if (state.wake) state.wake(); return true; } return false; }

  // ---- 話す ----
  function refreshButtons() {
    var cur = state.current;
    $('#btn-src').disabled = !cur;
    $('#btn-add').disabled = !cur || state.mine.indexOf(cur.id) >= 0;
    $('#btn-add').textContent = cur && state.mine.indexOf(cur.id) >= 0 ? '✓ 追加済み' : '＋ マイ習慣';
  }
  // 話すボタンは常に新しい話を始める。キャラのタップは、再生中なら早送り、止まっていれば話す
  function talk(fromChar) {
    state.last = Date.now();
    if (fromChar === true && skip()) return;
    if (state.playing) { state.token++; state.playing = false; speak('kotori', false); speak('noise', false); }
    var e = KN.pickEntry(entries, { recent: state.recent, now: new Date() });
    if (!e) { addMsg('sys', '検証済みのデータがありません'); return; }
    state.recent.push(e.id); if (state.recent.length > 8) state.recent.shift();
    state.current = e; refreshButtons();
    var dlg = KN.buildDialogue(e, { tone: state.tone, now: new Date() });
    play(dlg.lines);
  }

  // ---- 出典シート ----
  function showSource(e) {
    $('#sheet-claim').textContent = e.claim;
    var dl = $('#sheet-dl'); dl.textContent = '';
    function row(k, v, href) {
      var dt = document.createElement('dt'); dt.textContent = k;
      var dd = document.createElement('dd');
      if (href) { var a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = v; dd.appendChild(a); }
      else dd.textContent = v;
      dl.appendChild(dt); dl.appendChild(dd);
    }
    var s = e.source || {};
    row('出典', (s.org || '') + '：' + (s.title || ''), s.url || null);
    row('種別', s.type || '');
    row('根拠の強さ', e.evidence_level + '：' + (KN.EVIDENCE[e.evidence_level] || ''));
    if (e.detail) row('補足', e.detail);
    row('確認日', e.last_checked || '未確認');
    if (e.notes) row('メモ', e.notes);
    $('#sheet').hidden = false;
  }
  function closeSheet() { $('#sheet').hidden = true; }

  // ---- マイ習慣 ----
  function today() { return KN.dateStr(new Date()); }
  function isDone(id) { var a = state.checks[today()]; return !!a && a.indexOf(id) >= 0; }
  function toggleDone(id) {
    var t = today(), a = state.checks[t] || [];
    var i = a.indexOf(id);
    if (i >= 0) a.splice(i, 1); else a.push(id);
    state.checks[t] = a; save('kn.checks', state.checks);
    renderMine();
    if (i < 0) { switchTab('talk'); play(KN.praise({ tone: state.tone })); }
  }
  function renderMine() {
    var ul = $('#mine-list'); ul.textContent = '';
    var ids = state.mine.filter(function (id) { return byId[id]; });
    if (!ids.length) {
      var li = document.createElement('li'); li.className = 'empty'; li.textContent = 'まだありません。おしゃべり画面で「＋ マイ習慣」を押すと入ります。';
      ul.appendChild(li); return;
    }
    ids.forEach(function (id) {
      var e = byId[id], li = document.createElement('li');
      var c = document.createElement('div'); c.className = 'claim'; c.textContent = e.claim;
      c.onclick = function () { showSource(e); };
      var m = document.createElement('div'); m.className = 'meta';
      var st = KN.streak(state.checks, id, new Date());
      var s = document.createElement('span'); s.className = 'grow'; s.textContent = st ? '🔥 ' + st + '日連続' : 'これから';
      var b = document.createElement('button'); b.className = isDone(id) ? 'done' : ''; b.textContent = isDone(id) ? '✓ 今日やった' : '今日やった';
      b.onclick = function () { toggleDone(id); };
      var x = document.createElement('button'); x.textContent = '外す'; x.setAttribute('aria-label', 'マイ習慣から外す');
      x.onclick = function () { state.mine = state.mine.filter(function (v) { return v !== id; }); save('kn.mine', state.mine); renderMine(); refreshButtons(); };
      m.appendChild(s); m.appendChild(b); m.appendChild(x);
      li.appendChild(c); li.appendChild(m); ul.appendChild(li);
    });
  }

  // ---- タブ・設定 ----
  function switchTab(name) {
    ['talk', 'mine', 'set'].forEach(function (t) { $('#tab-' + t).hidden = t !== name; });
    document.querySelectorAll('nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === name); });
    if (name === 'mine') renderMine();
  }

  function init() {
    document.querySelectorAll('nav button').forEach(function (b) { b.onclick = function () { switchTab(b.dataset.tab); }; });
    $('#btn-talk').onclick = function () { talk(false); };
    $('#kotori').onclick = function () { talk(true); };
    $('#noise').onclick = function () { talk(true); };
    $('#balloon').onclick = function () { state.last = Date.now(); skip(); };
    $('#btn-src').onclick = function () { if (state.current) showSource(state.current); };
    $('#btn-add').onclick = function () {
      var e = state.current; if (!e || state.mine.indexOf(e.id) >= 0) return;
      state.mine.push(e.id); save('kn.mine', state.mine); refreshButtons();
      play([{ who: 'kotori', text: 'マイ習慣に入れたよ！ 「マイ習慣」タブで毎日チェックできるよ。' }, { who: 'noise', text: '三日坊主でも、ゼロよりはええで。' }]);
    };
    $('#sheet-close').onclick = closeSheet; $('#sheet-bg').onclick = closeSheet;

    var sel = $('#set-tone'); sel.value = state.tone;
    sel.onchange = function () { state.tone = sel.value; save('kn.tone', state.tone); };
    var chk = $('#set-auto'); chk.checked = !!state.auto;
    chk.onchange = function () { state.auto = chk.checked; save('kn.auto', state.auto); };
    $('#db-info').textContent = '検証済み ' + verified.length + '件を使用（全' + entries.length + '件）／データ更新日 ' + (DB.updated || '不明');

    setInterval(function () {
      if (!state.auto || document.hidden || state.playing) return;
      if (Date.now() - state.last > 90000) talk(false);
    }, 15000);

    play(KN.greeting({ tone: state.tone, now: new Date() }));
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }
  init();
})();
