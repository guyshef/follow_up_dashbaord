#!/bin/bash
cd "$(dirname "$0")"

PID_FILE="follow_up.pid"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "follow_up is already running (PID $(cat "$PID_FILE"))"
  exit 1
fi

PATH="$HOME/.nvm/versions/node/v20.20.1/bin:$PATH" PORT=3002 nohup node server.js > follow_up.log 2>&1 &
echo $! > "$PID_FILE"
echo "follow_up started on port 3002 (PID $!)"
