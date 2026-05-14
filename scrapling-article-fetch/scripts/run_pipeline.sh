#!/bin/bash
# run_pipeline.sh — 环境检查 wrapper
# 优先选 python3，其次 python，避免入口命令写死

set -e

PYTHON_CMD=""

for cmd in python3 python; do
    if command -v "$cmd" >/dev/null 2>&1; then
        PYTHON_CMD="$cmd"
        break
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo '{"python_found": false, "python_ok": false, "uv_found": false, "venv_available": false, "install_hint": "未检测到可用 Python。请安装 Python 3.10+"}'
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_CHECK="$SCRIPT_DIR/check_python_env.py"

"$PYTHON_CMD" "$ENV_CHECK"
