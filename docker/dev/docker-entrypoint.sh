#!/bin/sh
# Exit immediately if a command exits with a non-zero status
set -e
echo "🚀 Starting Ionic server..."
ionic serve --host=0.0.0.0 --port=8100 --livereload-port=35729 --external -- --poll=200