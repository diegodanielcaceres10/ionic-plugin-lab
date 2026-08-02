#!/bin/sh
# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Ionic dev server..."

# --host=0.0.0.0        : bind to all interfaces so the server is reachable
#                          from outside the container (not just localhost)
# --port=8100            : dev server port (mapped to the host via docker-compose)
# --livereload-port=35729: separate port for the live-reload websocket connection
# --external             : allows connections from other devices/hosts, not just
#                          the machine running the container
# -- --poll=200           : passed through to the underlying Angular builder;
#                          forces polling-based file watching (every 200ms)
#                          instead of native fs events, which don't propagate
#                          reliably through the Windows -> WSL2 bind mount
ionic serve --host=0.0.0.0 --port=8100 --livereload-port=35729 --external -- --poll=200