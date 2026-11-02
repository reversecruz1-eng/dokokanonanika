// 台詞エンジン（画面に依存しない純粋なロジック）。ブラウザでも Node でも動く。
// 方針: 健康の事実は data/habits.json の claim だけを使う。ここでは口調と構成だけを作る。
// 台詞テンプレートには、健康に関する数字・事実を書かない（テストで検出）。
(function (root) {
  'use strict';

  var EVIDENCE = { A: '公的ガイドライン・国際機関', B: '研究者による著作・研究', C: '書籍・経験則', D: '雑学' };
  var TONE_NAMES = { gentle: 'やさしめ', normal: 'ふつう', snark: '毒舌' };
  // からかわず、やさしい口調に固定するカテゴリ
  var SENSITIVE = { mind: 1, alcohol: 1 };

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
  function isBook(src) { return /書籍|インタビュー|古典/.test((src && src.type) || ''); }
  function isClassic(src) { return /古典/.test((src && src.type) || ''); }

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

  // ---- 台詞テンプレート（ことり＝明るい／ノイズ＝関西弁寄りのツッコミ） ----
  var K_INTRO = {
    gentle: ['ねえねえ、{band}だし、ひとつだけ豆知識どう？', 'ちょっとだけ聞いてくれる？', '急がなくていいんだけど、ひとことだけ。',
      'ひと息ついて、小さな話をしてもいい？', '{band}のおともに、ちいさな豆知識だよ。'],
    normal: ['ねえねえ、{band}の豆知識だよ！', '聞いて聞いて〜！', '{band}だし、ひとつ言っていい？',
      'じゃじゃーん！ 豆知識のコーナーです！', 'ちょっとだけ寄り道しよ？ {band}の豆知識！', 'ねえ、知ってた？ いま話したくなっちゃった！'],
    snark: ['はいはい、{band}の定例報告です！', '聞いて聞いて〜！ ノイズは耳ふさいでもいいよ！', '{band}だし、ひとつ言っていい？ 拒否権はないけど！',
      'ことり特報〜！ ツッコミ担当は待機してね！', 'ぴんぽんぱんぽ〜ん、{band}のお知らせです！', 'ちょっとだけお説教……じゃなくて、お知らせです！']
  };
  var K_TIMELY = {
    gentle: ['{band}だね。ちょっとだけ気になったことがあって。', 'いまの時間に合う話があるんだ。', '{band}のいま、そっと伝えたい話があるよ。'],
    normal: ['もう{band}だよ？ そんな時間に合う話があるの！', '{band}だし、ぴったりの話があるよ！', '{band}といえば、この話！ 聞いてくれる？'],
    snark: ['{band}ですよ〜？ ぴったりの話、ありますよ〜？', 'この時間にそれ？ ってお話があります！', '{band}に起きてるあなたに、とっておきをどうぞ！']
  };
  var K_TRIVIA = {
    gentle: ['ちょっと物騒だけど、食の安全の豆知識だよ。', '毒の話、していい？ 怖がらせたいわけじゃないんだ。'],
    normal: ['毒の豆知識〜！ ちょっと物騒だけど、食の安全の話だよ！', '雑学コーナー！ 今日は命に関わるやつ！'],
    snark: ['毒の豆知識、いっちゃいます！ ノイズ、出番だよ！', '物騒な雑学の時間です！ メモの準備はいい？']
  };
  var N_REACT = {
    A: {
      gentle: ['ちゃんとした機関の話やで。頭の片隅に置いとき。', '出典は画面で見られるで。無理せんでええけどな。', '信頼できる筋の話や。気が向いたときでええで。'],
      normal: ['公的な筋の話や。わかっててもやらんのが人間やけどな。', 'ええ出典やで。ほな、今日の一個だけでもやってみ。', 'ガチの出どころや。ワシは信じてええと思う。'],
      snark: ['耳が痛いやろ。ワシらにも耳はあるけどな。', 'はいはい正論。正論は強いなぁ。', 'ぐうの音も出ぇへん正論や。出典まで付いとる。']
    },
    B: {
      gentle: ['研究者の本の話や。合うところだけ使えばええで。', 'こっちの確認はまだ途中やから、話半分で聞いとき。'],
      normal: ['研究者の本の話や。ただ、こっちの確認は途中やで。話半分で聞いとき。', '根拠は追える方やけど、全部鵜呑みはあかんで。'],
      snark: ['研究者の本やからってドヤらんと、確認は途中やで。話半分や。', '根拠は追える方や。……追えるだけで、まだ追いきってへんけどな。']
    },
    Cbook: {
      gentle: ['本の主張やから、合うところだけ拾えばええで。', '万人に効くとは限らんから、気楽にいこ。'],
      normal: ['これは本の主張や。鵜呑みにせんと、合うとこだけ拾い。', '本の話やから、万人に効くとは限らんで。'],
      snark: ['本の主張や。信者になるなよ、拾い食いくらいでええ。', '自己啓発棚あるあるやな。合うとこだけ盗み。']
    },
    Crule: {
      gentle: ['経験則寄りの話や。試してみて、合えば続けたらええで。', '根拠の強さは出典で見られるで。気楽にいこ。'],
      normal: ['経験則寄りの話や。根拠は強すぎへんから、話半分で試してみ。', '効くかどうかは人それぞれや。ほな、お試しやな。'],
      snark: ['経験則や。ガチの証拠とは別枠やで。', '試して合わんかったら、やめてええんやで。']
    },
    Cclassic: {
      gentle: ['昔の人の知恵や。今と合わんところは流してええで。'],
      normal: ['古典の知恵や。ただ、今の常識と合わんとこもあるで。'],
      snark: ['古典やからって全部正解ちゃうで。ご先祖さまも万能やない。']
    },
    D: {
      gentle: ['これは雑学やで。ネタとして聞いといてな。'],
      normal: ['雑学やからな、健康の判断には使うなよ。'],
      snark: ['雑学や。飲み会のネタ止まりやで。']
    }
  };
  var N_QUIP = {
    sleep: ['布団は逃げへんで、安心して入り。', 'ガチャより先に回すべきは、寝る時間やで。', '夜更かしのセーブデータは、翌朝に響くで。'],
    activity: ['まず立つとこからや。', '座りっぱなしは、画面の中の主人公だけにしとき。', '歩く、それだけで一歩目や。'],
    diet: ['食うなって話ちゃう、付き合い方の話や。', 'メシは敵ちゃう、味方にしよ。'],
    screen: ['目ぇ休めぇや。', '画面とにらめっこしても勝てへんで。'],
    'habit-skill': ['気合いより仕組みや。', '三日坊主も三日はやっとる。ええやん。', '続かんのは意志が弱いんやなくて、設計が悪いだけや。'],
    hygiene: ['地味やけど、ええ仕事するやつや。', '派手さゼロ、でも毎日効く系や。'],
    trivia: ['知らんで食うのが一番あかんやつや。', '知っとくだけで、備えにはなるで。', '雑学も、たまには人の役に立つんやな。'],
    alcohol: ['責めるつもりはないで。知っとくだけでええ。']
  };
  var K_REPLY = {
    gentle: ['うん、ゆっくり行こうね。', 'ノイズのそういうとこ、好きだよ。', 'ふふ、ありがとう。'],
    normal: ['ふふ、ノイズらしい〜！', 'それ、ほめてるの？ ほめてるよね？', 'さすがノイズ、ツッコミが早い！'],
    snark: ['ノイズ、今日も口が絶好調だね！', 'はいはい、ツンデレありがとう！', 'その辛口、あとで甘口にして返してね！']
  };
  var K_OUTRO = ['気が向いたら「マイ習慣」に入れてね。小さくで大丈夫だよ。', 'やってみる？ 下のボタンでマイ習慣に入れられるよ。',
    'ぜんぶやらなくていいよ。気になったところだけ、ね。', 'また別の話もあるから、気軽に呼んでね！'];
  var META = { noise: 'AI世代にまたこれか…ええんか？', kotori: 'えっ、わたしたち古い？ ……でも出番はあるよね！' };

  function buildDialogue(entry, ctx) {
    ctx = ctx || {};
    var rand = ctx.rand || Math.random, d = ctx.now || new Date();
    var tone = ctx.tone || 'normal';
    if (SENSITIVE[entry.category]) tone = 'gentle'; // メンタル・飲酒はからかわない
    var v = { band: band(d.getHours()) };
    var lines = [];

    var intro = entry.category === 'trivia' ? K_TRIVIA[tone] : (timely(entry, d) ? K_TIMELY[tone] : K_INTRO[tone]);
    lines.push({ who: 'kotori', text: fill(pick(intro, rand), v) });

    var src = entry.source || {};
    var lead = (isBook(src) && !isClassic(src)) ? shortOrg(src.org) + 'の本では、' : shortOrg(src.org) + 'によると、';
    lines.push({ who: 'kotori', text: lead + endMark(entry.claim) });

    var lvl = entry.evidence_level;
    var key = lvl === 'C' ? (isClassic(src) ? 'Cclassic' : isBook(src) ? 'Cbook' : 'Crule') : (N_REACT[lvl] ? lvl : 'Cbook');
    lines.push({ who: 'noise', text: pick(N_REACT[key][tone], rand) });

    if (rand() < 0.35) lines.push({ who: 'kotori', text: pick(K_REPLY[tone], rand) });

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

  var G_HELLO = {
    '朝': ['おはよう！', 'おはよ〜！ 今日もよろしくね！'],
    '昼': ['こんにちは！', 'やっほー！ お昼だね！'],
    '夜': ['こんばんは！', 'おつかれさま〜！ 夜だね！'],
    '夜更け': ['まだ起きてたんだね…！', 'こんな時間まで、おつかれさま…！'],
    '深夜': ['まだ起きてたんだね…！', 'わ、深夜だ…！ だいじょうぶ？']
  };
  var G_NOISE = {
    gentle: ['無理せんと、ゆっくりいこな。', '今日もぼちぼちでええで。'],
    normal: ['ほな、今日もぼちぼちやろか。', '来たか。ほな、ええ感じにやっとこ。'],
    snark: ['また来たんか。ほな、説教の時間やで。', '来たな。今日はどんな言い訳を聞かせてくれるんや？']
  };
  function greeting(ctx) {
    ctx = ctx || {};
    var rand = ctx.rand || Math.random, d = ctx.now || new Date(), tone = ctx.tone || 'normal';
    var b = band(d.getHours());
    return [
      { who: 'kotori', text: pick(G_HELLO[b], rand) + ' ここに住まわせてもらってます、ことりです！' },
      { who: 'noise', text: pick(G_NOISE[tone], rand) },
      { who: 'kotori', text: '「話す」を押すと、ちょっとした健康の豆知識を話すよ。' }
    ];
  }

  var P_NOISE = {
    gentle: ['よう頑張ったな。小さくても立派やで。', 'ええ調子や。その調子でぼちぼちな。'],
    normal: ['……やるやん。', 'ええやん、その調子や。', 'ちゃんとやるやつは強いで。'],
    snark: ['お、珍しい。明日は雨か？', '……ちょっとは見直したるわ。', '草。いや、ほめてる。ほめてるんやで。']
  };
  function praise(ctx) {
    ctx = ctx || {};
    var rand = ctx.rand || Math.random, tone = ctx.tone || 'normal';
    return [
      { who: 'kotori', text: pick(['やったね！ 小さくても一歩だよ！', 'すごいすごい！ 今日の一個、達成だね！'], rand) },
      { who: 'noise', text: pick(P_NOISE[tone], rand) }
    ];
  }

  var A_NOISE = {
    gentle: ['三日坊主でも、ゼロよりはええで。', '気が向いた日だけでええで。'],
    normal: ['三日坊主でも、ゼロよりはええで。', '続くかどうかは、置き場所次第や。'],
    snark: ['三日坊主の予約、入りました〜。', 'どうせ続かんとか言わへんで。たぶん。']
  };
  function added(ctx) {
    ctx = ctx || {};
    var rand = ctx.rand || Math.random, tone = ctx.tone || 'normal';
    return [
      { who: 'kotori', text: 'マイ習慣に入れたよ！ 「マイ習慣」タブで毎日チェックできるよ。' },
      { who: 'noise', text: pick(A_NOISE[tone], rand) }
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

  var CATEGORY_NAMES = { sleep: '睡眠', activity: '運動', diet: '食事', hygiene: '衛生', alcohol: '飲酒', screen: '画面・目',
    mind: 'こころ', 'habit-skill': '習慣術', trivia: '雑学' };

  var api = {
    EVIDENCE: EVIDENCE, TONE_NAMES: TONE_NAMES, CATEGORY_NAMES: CATEGORY_NAMES,
    dateStr: dateStr, band: band, timely: timely, pickEntry: pickEntry,
    buildDialogue: buildDialogue, greeting: greeting, praise: praise, added: added, streak: streak,
    shortOrg: shortOrg
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KN = api;
})(typeof window !== 'undefined' ? window : globalThis);
