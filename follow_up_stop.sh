#!/bin/bash
cd "$(dirname "$0")"

PID_FILE="follow_up.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "No PID file found — is follow_up running?"
  exit 1
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  rm "$PID_FILE"
  echo "follow_up stopped (PID $PID)"
else
  echo "Process $PID not found — removing stale PID file"
  rm "$PID_FILE"
  exit 1
fi
