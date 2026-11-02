// 立ち絵（仮）。オリジナルのSVG。後で本番の画像（透過PNG/SVG）に差し替えられるように、
// 画面側は KNCHAR.kotori() / KNCHAR.noise() が返すマークアップだけに依存している。
(function (root) {
  'use strict';

  // ことり：ハチミツ色の髪とアホ毛（羽根）。服は #kotori[data-outfit="maid|butler"] で切り替える
  function kotori() {
    return '' +
'<svg viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ことり">' +
' <ellipse cx="60" cy="163" rx="30" ry="4" fill="#000" opacity=".15"/>' +
' <path d="M26 66 C22 20 98 20 94 66 L97 104 C86 112 34 112 23 104 Z" fill="#d99a3b"/>' +
' <ellipse cx="51" cy="150" rx="8" ry="11" fill="#fbdcc4"/><ellipse cx="69" cy="150" rx="8" ry="11" fill="#fbdcc4"/>' +
' <ellipse cx="50" cy="160" rx="10" ry="4.5" fill="#4a3426"/><ellipse cx="70" cy="160" rx="10" ry="4.5" fill="#4a3426"/>' +
// メイド
' <g class="maid">' +
'  <path d="M38 100 L82 100 L96 152 L24 152 Z" fill="#5a3d2b"/>' +
'  <path d="M47 102 L73 102 L80 150 L40 150 Z" fill="#fffaf0"/>' +
'  <path d="M24 152 L96 152 L94 146 L26 146 Z" fill="#fffaf0" opacity=".9"/>' +
'  <ellipse cx="33" cy="116" rx="6" ry="12" fill="#5a3d2b" transform="rotate(14 33 116)"/>' +
'  <ellipse cx="87" cy="116" rx="6" ry="12" fill="#5a3d2b" transform="rotate(-14 87 116)"/>' +
'  <circle cx="30" cy="127" r="4.5" fill="#fbdcc4"/><circle cx="90" cy="127" r="4.5" fill="#fbdcc4"/>' +
'  <path d="M50 100 L60 109 L70 100 Z" fill="#fffaf0"/>' +
'  <path d="M60 106 L50 101 L50 112 Z M60 106 L70 101 L70 112 Z" fill="#e8a21c"/><circle cx="60" cy="106" r="3" fill="#f2c14a"/>' +
' </g>' +
// 執事
' <g class="butler">' +
'  <path d="M36 100 L84 100 L90 148 L30 148 Z" fill="#3d3128"/>' +
'  <path d="M30 148 L40 142 L46 158 Z M90 148 L80 142 L74 158 Z" fill="#3d3128"/>' +
'  <path d="M50 100 L60 132 L70 100 Z" fill="#fffaf0"/>' +
'  <path d="M52 112 L60 132 L68 112 L60 108 Z" fill="#8a5a3a"/>' +
'  <ellipse cx="32" cy="116" rx="6" ry="12" fill="#3d3128" transform="rotate(14 32 116)"/>' +
'  <ellipse cx="88" cy="116" rx="6" ry="12" fill="#3d3128" transform="rotate(-14 88 116)"/>' +
'  <circle cx="29" cy="127" r="4.5" fill="#fffaf0"/><circle cx="91" cy="127" r="4.5" fill="#fffaf0"/>' +
'  <path d="M60 106 L50 101 L50 111 Z M60 106 L70 101 L70 111 Z" fill="#c0392b"/><circle cx="60" cy="106" r="2.6" fill="#a02e22"/>' +
' </g>' +
// 頭
' <circle cx="60" cy="66" r="31" fill="#ffe3cc"/>' +
' <path d="M28 68 C26 36 94 36 92 68 C84 54 74 50 63 58 C54 50 38 54 28 68 Z" fill="#d99a3b"/>' +
' <path d="M28 68 C30 80 33 90 38 96 C34 84 33 76 34 70 Z M92 68 C90 80 87 90 82 96 C86 84 87 76 86 70 Z" fill="#c4842a"/>' +
' <path d="M56 41 C52 26 66 16 78 21 C72 25 66 31 64 42 Z" fill="#e8b04e"/><path d="M60 40 C62 30 68 25 74 22" stroke="#c4842a" stroke-width="1.4" fill="none"/>' +
' <g class="maid"><path d="M33 56 C43 36 77 36 87 56" stroke="#fffaf0" stroke-width="6" fill="none" stroke-linecap="round"/>' +
'  <circle cx="82" cy="47" r="5" fill="#e8a21c"/><circle cx="82" cy="47" r="2" fill="#f2c14a"/></g>' +
' <ellipse cx="49" cy="70" rx="3.6" ry="5.2" fill="#3b2a1e"/><ellipse cx="71" cy="70" rx="3.6" ry="5.2" fill="#3b2a1e"/>' +
' <circle cx="50.2" cy="68" r="1.4" fill="#fff"/><circle cx="72.2" cy="68" r="1.4" fill="#fff"/>' +
' <ellipse cx="41" cy="80" rx="5.5" ry="3" fill="#ff9fa0" opacity=".6"/><ellipse cx="79" cy="80" rx="5.5" ry="3" fill="#ff9fa0" opacity=".6"/>' +
' <path class="mclosed" d="M55 82 Q60 87 65 82" stroke="#3b2a1e" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
' <ellipse class="mopen" cx="60" cy="84" rx="3.6" ry="3.4" fill="#a04a4a"/>' +
'</svg>';
  }

  // ノイズ：黒猫。体のところどころに「ノイズ」（色ずれの線）が走る
  function noise() {
    return '' +
'<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ノイズ">' +
' <ellipse cx="60" cy="116" rx="32" ry="3.5" fill="#000" opacity=".18"/>' +
' <path d="M90 98 C114 92 116 62 100 56" stroke="#1f1f28" stroke-width="8" fill="none" stroke-linecap="round"/>' +
' <ellipse cx="60" cy="90" rx="30" ry="24" fill="#1f1f28"/>' +
' <ellipse cx="46" cy="110" rx="9" ry="5" fill="#2b2b38"/><ellipse cx="74" cy="110" rx="9" ry="5" fill="#2b2b38"/>' +
' <path d="M28 44 L32 12 L54 30 Z M92 44 L88 12 L66 30 Z" fill="#1f1f28"/>' +
' <path d="M34 36 L35 21 L47 31 Z M86 36 L85 21 L73 31 Z" fill="#5a3550"/>' +
' <ellipse cx="60" cy="56" rx="35" ry="28" fill="#1f1f28"/>' +
' <ellipse cx="46" cy="55" rx="7.5" ry="8.5" fill="#f5d142"/><ellipse cx="74" cy="55" rx="7.5" ry="8.5" fill="#4ee3e0"/>' +
' <ellipse cx="46" cy="55" rx="1.9" ry="6.6" fill="#111"/><ellipse cx="74" cy="55" rx="1.9" ry="6.6" fill="#111"/>' +
' <circle cx="48.4" cy="51.5" r="1.5" fill="#fff"/><circle cx="76.4" cy="51.5" r="1.5" fill="#fff"/>' +
' <path d="M57 65 L63 65 L60 69 Z" fill="#d98aa3"/>' +
' <path class="mclosed" d="M53 71 Q56.5 75 60 70 Q63.5 75 67 71" stroke="#8a8a98" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
' <ellipse class="mopen" cx="60" cy="74" rx="3.6" ry="3.8" fill="#7a3a4a"/>' +
' <g stroke="#9a9aa8" stroke-width="1" stroke-linecap="round"><path d="M38 68 L20 64 M38 71 L20 74 M82 68 L100 64 M82 71 L100 74"/></g>' +
' <rect class="gl1" x="20" y="84" width="30" height="3" fill="#4ee3e0" opacity=".75"/>' +
' <rect class="gl2" x="68" y="38" width="32" height="2.4" fill="#ff4fa3" opacity=".65"/>' +
' <rect class="gl3" x="44" y="100" width="26" height="3" fill="#fff" opacity=".25"/>' +
'</svg>';
  }

  root.KNCHAR = { kotori: kotori, noise: noise };
})(typeof window !== 'undefined' ? window : globalThis);
