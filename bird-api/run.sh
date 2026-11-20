#!/usr/bin/env bash
# Starts uvicorn (:8000) and a Cloudflare quick tunnel, detached. Logs in logs/.
cd "$(dirname "$0")"
mkdir -p logs
setsid nohup .venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000 > logs/uvicorn.log 2>&1 &
echo $! > logs/uvicorn.pid
setsid nohup "$HOME/.local/bin/cloudflared" tunnel --no-autoupdate --url http://localhost:8000 > logs/tunnel.log 2>&1 &
echo $! > logs/tunnel.pid
for i in $(seq 30); do
  u=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' logs/tunnel.log | head -1)
  [ -n "$u" ] && { echo "$u" | tee logs/tunnel.url; exit 0; }
  sleep 1
done
echo "tunnel URL not found; see logs/tunnel.log" >&2; exit 1
