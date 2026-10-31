// 台詞エンジン（画面に依存しない純粋なロジック）。ブラウザでも Node でも動く。
// 方針: 健康の事実は data/habits.json の claim だけを使う。ここでは口調と構成だけを作る。
(function (root) {
  'use strict';

  var EVIDENCE = { A: '公的ガイドライン・国際機関', B: '研究者による著作・研究', C: '書籍・経験則', D: '雑学' };
  var TONE_NAMES = { gentle: 'やさしめ', normal: 'ふつう', snark: '毒舌' };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dateStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function band(h) { return h < 5 ? '深夜' : h < 11 ? '朝' : h < 17 ? '昼' : h < 22 ? '夜' : '夜更け'; }
  function toMin(s) { var p = s.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function nowMin(d) { return d.getHours() * 60 + d.getMinutes(); }
  function inWindow(m, a, b) { var x = toMin(a), y = toMin(b); return x <= y ? (m >= x && m < y) : (m >= x || m < y); }
  function isNight(d) { return inWindow(nowMin(d), '23:00', '05:00'); }

  // 今の時刻がこの項目の発動条件に合うか（段階②では時計と夜間のみ。使用状況は段階③）
  function timely(e, d) {
    var t = e.trigger || {};
    if (t.signal === 'clock' && t.after && t.before) return inWindow(nowMin(d), t.after, t.before);
    if (t.signal === 'app_usage_night') return isNight(d);
    return false;
  }

  function pick(arr, rand) { return arr[Math.floor(rand() * arr.length) % arr.length]; }
  function fill(s, v) { return s.replace(/\{(\w+)\}/g, function (_, k) { return v[k] !== undefined ? v[k] : ''; }); }
  function shortOrg(org) { return String(org).replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim(); }
  function endMark(s) { return /[。！？!?]$/.test(s) ? s : s + '。'; }
  function isBook(src) { return /書籍|インタビュー/.test(src.type || ''); }

  // draft は絶対に選ばない（verified のみ）
  function pickEntry(entries, ctx) {
    ctx = ctx || {};
    var rand = ctx.rand || Math.random, recent = ctx.recent || [], d = ctx.now || new Date();
    var pool = entries.filter(function (e) { return e.status === 'verified'; });
    if (ctx.category) {
      var f = pool.filter(function (e) { return e.category === ctx.category; });
      if (f.length) pool = f;
    }
    if (!pool.length) return null;
    var w = pool.map(function (e) {
      var s = 1;
      if (timely(e, d)) s += 6;
      if (recent.indexOf(e.id) >= 0) s *= 0.05;
      return s;
    });
    var sum = w.reduce(function (a, b) { return a + b; }, 0);
    var r = rand() * sum;
    for (var i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  var K_INTRO = {
    gentle: ['ねえねえ、{band}だし、ひとつだけ豆知識どう？', 'ちょっとだけ聞いてくれる？', '急がなくていいんだけど、ひとことだけ。'],
    normal: ['ねえねえ、{band}の豆知識だよ！', '聞いて聞いて〜！', '{band}だし、ひとつ言っていい？'],
    snark: ['はいはい、{band}の定例報告です！', '聞いて聞いて〜！ ノイズは耳ふさいでもいいよ！', '{band}だし、ひとつ言っていい？']
  };
  var K_TIMELY = {
    gentle: ['{band}だね。ちょっとだけ気になったことがあって。', 'いまの時間に合う話があるんだ。'],
    normal: ['もう{band}だよ？ そんな時間に合う話があるの！', '{band}だし、ぴったりの話があるよ！'],
    snark: ['{band}ですよ〜？ ぴったりの話、ありますよ〜？', 'この時間にそれ？ ってお話があります！']
  };
  var N_REACT = {
    A: {
      gentle: ['ちゃんとした機関の話やで。頭の片隅に置いとき。', '出典は画面で見られるで。無理せんでええけどな。'],
      normal: ['公的な筋の話や。わかっててもやらんのが人間やけどな。', 'ええ出典やで。ほな、今日の1個だけでもやってみ。'],
      snark: ['耳が痛いやろ。ワシらに耳はあるけどな。', 'はいはい正論。正論は強いなぁ。']
    },
    B: {
      gentle: ['研究者の本の話や。合うところだけ使えばええで。', 'こっちの確認はまだ途中やから、話半分で聞いとき。'],
      normal: ['研究者の本の話や。ただ、こっちの確認は途中やで。話半分で聞いとき。', '根拠は追える方やけど、全部鵜呑みはあかんで。'],
      snark: ['研究者の本やからってドヤらんと、確認は途中やで。話半分や。', '根拠は追える方や。……追えるだけで、まだ追いきってへんけどな。']
    },
    C: {
      gentle: ['本の主張やから、合うところだけ拾えばええで。', '万人に効くとは限らんから、気楽にいこ。'],
      normal: ['これは本の主張や。鵜呑みにせんと、合うとこだけ拾い。', '本の話やから、万人に効くとは限らんで。'],
      snark: ['本の主張や。信者になるなよ、拾い食いくらいでええ。', '自己啓発棚あるあるやな。合うとこだけ盗み。']
    },
    D: {
      gentle: ['これは雑学やで。ネタとして聞いといてな。'],
      normal: ['雑学やからな、健康の判断には使うなよ。'],
      snark: ['雑学や。飲み会のネタ止まりやで。']
    }
  };
  var N_QUIP = {
    sleep: ['布団は逃げへんで、安心して入り。'],
    activity: ['まず立つとこからや。'],
    diet: ['食うなって話ちゃう、付き合い方の話や。'],
    screen: ['目ぇ休めぇや。'],
    'habit-skill': ['気合いより仕組みや。'],
    hygiene: ['地味やけど効くやつや。']
  };
  var K_OUTRO = ['気が向いたら「マイ習慣」に入れてね。小さくで大丈夫だよ。', 'やってみる？ 下のボタンでマイ習慣に入れられるよ。'];
  var META = { noise: 'AI世代にまたこれか…ええんか？', kotori: 'えっ、わたしたち古い？ ……でも出番はあるよね！' };

  function buildDialogue(entry, ctx) {
    ctx = ctx || {};
    var rand = ctx.rand || Math.random, d = ctx.now || new Date();
    var tone = ctx.tone || 'normal';
    if (entry.category === 'mind') tone = 'gentle'; // メンタル系はからかわない
    var v = { band: band(d.getHours()) };
    var lines = [];

    var intro = timely(entry, d) ? K_TIMELY[tone] : K_INTRO[tone];
    lines.push({ who: 'kotori', text: fill(pick(intro, rand), v) });

    var src = entry.source || {};
    var lead = isBook(src) ? shortOrg(src.org) + 'の本では、' : shortOrg(src.org) + 'によると、';
    lines.push({ who: 'kotori', text: lead + endMark(entry.claim) });

    var lvl = N_REACT[entry.evidence_level] ? entry.evidence_level : 'C';
    lines.push({ who: 'noise', text: pick(N_REACT[lvl][tone], rand) });

    var quips = N_QUIP[entry.category];
    var qp = tone === 'gentle' ? 0.25 : 0.45;
    if (quips && rand() < qp) lines.push({ who: 'noise', text: pick(quips, rand) });

    var mp = tone === 'snark' ? 0.3 : tone === 'normal' ? 0.12 : 0;
    if (rand() < mp) {
      lines.push({ who: 'noise', text: META.noise });
      lines.push({ who: 'kotori', text: META.kotori });
    }

    lines.push({ who: 'kotori', text: pick(K_OUTRO, rand) });
    return { entry: entry, tone: tone, lines: lines };
  }

  function greeting(ctx) {
    ctx = ctx || {};
    var rand = ctx.rand || Math.random, d = ctx.now || new Date(), tone = ctx.tone || 'normal';
    var b = band(d.getHours());
    var hello = b === '朝' ? 'おはよう！' : b === '昼' ? 'こんにちは！' : b === '夜' ? 'こんばんは！' : 'まだ起きてたんだね…！';
    var noise = {
      gentle: ['無理せんと、ゆっくりいこな。'],
      normal: ['ほな、今日もぼちぼちやろか。'],
      snark: ['また来たんか。ほな、説教の時間やで。']
    }[tone];
    return [
      { who: 'kotori', text: hello + 'ここに住まわせてもらってます、ことりです！' },
      { who: 'noise', text: pick(noise, rand) },
      { who: 'kotori', text: '「話す」を押すと、ちょっとした健康の豆知識を話すよ。' }
    ];
  }

  function praise(ctx) {
    ctx = ctx || {};
    var rand = ctx.rand || Math.random, tone = ctx.tone || 'normal';
    var n = {
      gentle: ['よう頑張ったな。小さくても立派やで。'],
      normal: ['……やるやん。', 'ええやん、その調子や。'],
      snark: ['お、珍しい。明日は雨か？', '……ちょっとは見直したるわ。']
    }[tone];
    return [
      { who: 'kotori', text: 'やったね！ 小さくても一歩だよ！' },
      { who: 'noise', text: pick(n, rand) }
    ];
  }

  // 連続日数。今日が未チェックなら昨日までを数える
  function streak(checks, id, today) {
    var d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var has = function (dt) { var a = checks[dateStr(dt)]; return !!a && a.indexOf(id) >= 0; };
    var n = 0;
    if (!has(d)) d.setDate(d.getDate() - 1);
    while (has(d)) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  var api = {
    EVIDENCE: EVIDENCE, TONE_NAMES: TONE_NAMES,
    dateStr: dateStr, band: band, timely: timely, pickEntry: pickEntry,
    buildDialogue: buildDialogue, greeting: greeting, praise: praise, streak: streak,
    shortOrg: shortOrg
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KN = api;
})(typeof window !== 'undefined' ? window : globalThis);
