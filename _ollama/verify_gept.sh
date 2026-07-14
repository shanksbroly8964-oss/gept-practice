#!/usr/bin/env bash
set -euo pipefail
cd /mnt/c/OpenCode/202606/gept-elementary-app

echo '== JS syntax check =='
for f in js/*.js; do
  node --check "$f"
done

echo '== JSON validation =='
python3 - <<'PY'
import json
from pathlib import Path
root = Path('/mnt/c/OpenCode/202606/gept-elementary-app/data')
count = 0
for p in sorted(root.glob('*.json')):
    with p.open('r', encoding='utf-8') as fh:
        json.load(fh)
    count += 1
print(f'validated_json_files={count}')
PY

echo '== Firebase target =='
python3 - <<'PY'
import json
from pathlib import Path
cfg = json.loads(Path('/mnt/c/OpenCode/202606/gept-elementary-app/firebase.json').read_text(encoding='utf-8'))
print('hosting_site=' + cfg['hosting']['site'])
print('hosting_public=' + cfg['hosting']['public'])
PY

echo 'VERIFY_OK'
