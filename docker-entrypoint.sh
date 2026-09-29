#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/typeorm/cli.js -d dist/common/database/data-source.js migration:run

echo "Starting API..."
exec node dist/main
