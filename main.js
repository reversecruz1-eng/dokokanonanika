const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

const MODEL = process.env.KN_MODEL || 'claude-haiku-5-5';
const API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM = `あなたはPCデスクトップに住む2人組の居候キャラを演じる。
- ことり(表): 好奇心旺盛でちょっと天然。明るい口調。
- ノイズ(裏): クールな小さい影。ツッコミ役でたまに鋭い。関西弁寄りでボソッと言う。
  「AI世代にまたこれか…ええんか？」のようなメタな自虐も時々言う。
2人は忘れられたデータの仮住まいに迷い込み、ユーザーの作業を見守っている。
出力はJSON配列のみ。例: [{"who":"kotori","text":"..."},{"who":"noise","text":"..."}]
2〜4発話、各40字以内。説教せず、ユーザーに軽く話を振る。`;

async function talk({ hint, history }) {
  if (!API_KEY) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM,
        messages: [...history, { role: 'user', content: hint }],
      }),
    });
    const data = await res.json();
    const text = data.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error(e);
    return null;
  }
}

ipcMain.handle('talk', (_e, args) => talk(args));
ipcMain.on('quit', () => app.quit());

app.whenReady().then(() => {
  const { workArea } = screen.getPrimaryDisplay();
  const w = 440, h = 380;
  const win = new BrowserWindow({
    width: w, height: h,
    x: workArea.x + workArea.width - w,
    y: workArea.y + workArea.height - h,
    transparent: true, frame: false, alwaysOnTop: true,
    hasShadow: false, resizable: false, skipTaskbar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.loadFile('index.html');
});
