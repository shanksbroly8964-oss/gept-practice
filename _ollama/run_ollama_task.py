#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
from pathlib import Path

WIN_OLLAMA = Path('/mnt/c/Users/shank/AppData/Local/Programs/Ollama/ollama.exe')
PROJECT_ROOT = Path('/mnt/c/OpenCode/202606/gept-elementary-app')

SYSTEM_PROMPT = '''你是資深前端工程師，正在協助維護一個 GEPT 國中英檢靜態網頁專案。
規則：
1. 只根據提供的檔案內容工作，不要假設你看得到其他檔案。
2. 如果要求是 analysis_only，請只輸出分析結果，不要假裝你已修改檔案。
3. 如果要求是 codegen，優先輸出完整檔案內容，並用清楚的 markdown code fence 包住。
4. 不要輸出與任務無關的長篇解釋。
5. 一律使用繁體中文（台灣用語），不得使用簡體字。
6. 若你不確定，不要編造已完成的修改或測試結果。
'''


def build_prompt(task: str, files: list[str], mode: str) -> str:
    chunks = [
        SYSTEM_PROMPT,
        f'模式：{mode}',
        '專案：GEPT 全民英檢初級工具（HTML/CSS/vanilla JS + data/*.json）',
        '任務：',
        task,
        '',
        '以下是你可參考的檔案內容：'
    ]
    for rel in files:
        path = (PROJECT_ROOT / rel).resolve()
        if not path.exists():
            raise FileNotFoundError(f'File not found: {rel}')
        text = path.read_text(encoding='utf-8')
        chunks.append(f'\n=== FILE: {rel} ===\n{text}\n=== END FILE ===\n')
    if mode == 'analysis_only':
        chunks.append('請輸出：\n1. 問題理解\n2. 建議修改檔案\n3. 風險\n4. 驗證方式\n不要輸出任何虛構已完成修改。')
    else:
        chunks.append('若要產生程式碼，請只輸出必要的完整檔案內容，並以 markdown code fence 標示檔名。')
    return '\n'.join(chunks)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='qwen2.5-coder:7b')
    ap.add_argument('--mode', choices=['analysis_only', 'codegen'], default='analysis_only')
    ap.add_argument('--task-file', required=True)
    ap.add_argument('--file', action='append', dest='files', default=[])
    ap.add_argument('--output')
    args = ap.parse_args()

    task = Path(args.task_file).read_text(encoding='utf-8')
    prompt = build_prompt(task, args.files, args.mode)
    cmd = [str(WIN_OLLAMA), 'run', args.model, prompt]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise SystemExit(proc.stderr or proc.stdout)
    output = re.sub(r'\x1b\[[0-9;?]*[A-Za-z]', '', proc.stdout).strip()
    if args.output:
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(output + '\n', encoding='utf-8')
    else:
        print(output)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
