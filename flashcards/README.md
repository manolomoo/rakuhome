# 字旅手帳

純 HTML / CSS / JS 的靜態單字卡網站，可直接部署到 GitHub Pages。以艾賓浩斯間隔複習法背誦外語單字，內建西文、英文、日文三組原創入門詞庫，母語介面為繁體中文。

## 快速使用

1. 直接用瀏覽器開啟 `index.html`，或部署到 GitHub Pages 後開啟網址。
2. 首次使用：到底部導覽「卡庫」→「＋ 新增單字」→「匯入詞庫」，一鍵加入西文／英文／日文任一入門詞庫。
3. 回首頁按「開始複習」進行翻卡背誦；空白鍵翻面，左右鍵或按鈕自評「記得／不熟」。
4. 到「驗收」分頁做選擇題、拼字或聽音選字測驗；答錯的題目會自動收進「錯題本」。
5. 到「設定」調整每日目標、深淺色、音效、拼字寬鬆比對，或匯出／匯入 JSON 備份。

所有資料只存在使用者瀏覽器的 `localStorage`，不會上傳到任何伺服器，重新整理頁面後進度不會消失。

## 檔案結構

```
flashcards/
  index.html            單頁應用（所有畫面皆在此，以 data-view 切換）
  css/styles.css        視覺樣式（旅人手帳／墨印／暖紙感主題）
  js/app.js             主程式：路由、複習、驗收、卡片庫、設定邏輯
  js/srs.js             艾賓浩斯間隔複習排程演算法
  js/storage.js         localStorage 存取層
  js/tts.js             Web Speech API 發音工具（無語音支援時優雅降級）
  js/data/packs.js      內建詞庫（西文／英文／日文入門，原創內容）
  manifest.webmanifest  PWA 設定
  sw.js                 極簡 Service Worker（僅快取站內靜態檔案）
  icon.svg              App 圖示
```

## localStorage Key

所有資料皆以 `zilv-` 為前綴，避免與站上其他頁面衝突：

| Key | 內容 |
| --- | --- |
| `zilv-cards` | 所有單字卡（含內建詞庫匯入後的卡片與自訂卡片） |
| `zilv-settings` | 每日目標、學習語言、深淺色、音效、拼字寬鬆比對、詞庫篩選 |
| `zilv-progress` | 經驗值、連續天數、成就徽章、累計複習／答對次數 |
| `zilv-mistakes` | 錯題本（驗收模式答錯、尚未答對的卡片 id） |
| `zilv-installed-packs` | 已匯入過的內建詞庫 id 清單 |

在「設定」頁可一鍵匯出／匯入上述資料的 JSON 備份，或重設進度／完全重設。

## 艾賓浩斯排程說明

間隔天數依序為 1 → 3 → 7 → 14 → 30 天。自評「記得」前進一階；自評「不熟」後退兩階（最低回到第 0 階），讓間隔明顯縮短。到達 30 天階視為「已記熟」。排程邏輯見 `js/srs.js`。

## 技術說明

- 不使用 npm / 打包工具 / 前端框架，全部是原生 HTML、CSS、JavaScript，以 `<script>` 標籤依序載入。
- 不呼叫任何外部 AI API；發音使用瀏覽器內建 Web Speech API（`speechSynthesis`），不支援的裝置會自動降級為文字顯示。
- 字型使用 Google Fonts（Noto Serif TC / Noto Sans TC / DM Mono），其餘資源皆為站內檔案。
- 內建詞庫、文案、視覺設計均為原創編寫，僅參考「單字卡＋間隔複習」這類 App 的功能概念。
