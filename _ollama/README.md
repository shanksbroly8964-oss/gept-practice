# GEPT Ollama 本地派工 Harness

這套 harness 讓協調 Agent 在 **不依賴 OpenCode 自動改檔能力** 的前提下，改用本機 Ollama 模型協助 GEPT 專案。

## 檔案
- `run_ollama_task.py`：讀取指定檔案內容，組 prompt，呼叫 Windows Ollama CLI。
- `verify_gept.sh`：跑 GEPT 專案基本驗證（JS syntax / JSON / Firebase target）。

## 典型用法
```bash
python3 _ollama/run_ollama_task.py \
  --mode analysis_only \
  --task-file _ollama/tasks/smoke.md \
  --file js/app.js \
  --file js/auth.js \
  --output _ollama/output/smoke_analysis.md
```

```bash
bash _ollama/verify_gept.sh
```

## 原則
1. 先 analysis，再決定是否真的寫檔。
2. 大改動先切成小任務，避免一次塞太多檔案給本機模型。
3. 真正寫檔後，一定跑 `verify_gept.sh`。
4. 部署由 Hermes 協調，不交給本機模型自動執行。
