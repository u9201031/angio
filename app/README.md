# Angio Notes

神經介入學習筆記查詢 app：搜尋病例與教學 pearls，並檢視圖片／影片。

## 啟動

```bash
cd app
npm install
npm run dev
```

瀏覽器開啟終端機顯示的本機網址（通常是 `http://localhost:5173`）。

## 資料來源

- `public/angio_index/`：病例 CSV 與分類 Markdown（由專案根目錄 `angio_index/` 複製）
- `public/media/`：圖片與影片

## 加入媒體

1. 建立資料夾 `public/media/c07/`（`c07` = cases.csv 第 7 列）
2. 放入 `.jpg` / `.png` / `.mp4` / `.mov` 等
3. 在 `public/media/manifest.json` 寫上檔名

也可在病例詳情頁直接拖放本機檔案（僅當次瀏覽有效）。
