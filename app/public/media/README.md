# 媒體檔放置說明

1. 依病例 id 建立資料夾，例如 `c07/`（對應 cases.csv 第 7 列，從 c01 起算）。
2. 放入 `.jpg` / `.png` / `.webp` / `.mp4` / `.mov` / `.webm` 等檔案。
3. 在 `manifest.json` 的對應 `files` 陣列寫上檔名，例如：

```json
"c07": { "folder": "c07", "files": ["dsa-pre.jpg", "deploy.mp4"] }
```

也可在 App 內對病例「拖放本機檔案」——僅當次瀏覽有效，不會寫進磁碟。
