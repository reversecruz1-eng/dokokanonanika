# ことり＆ノイズ (仮)
## 起動
    npm install
    # APIキーがあればLLM会話、なければ固定セリフ
    export ANTHROPIC_API_KEY=sk-ant-...      # Windows: setx / $env:ANTHROPIC_API_KEY
    npm start
- 「💬 話す」で話しかける / キャラをドラッグで移動 / × で終了
- 一定間隔でランダムトーク
- モデル変更: KN_MODEL 環境変数
