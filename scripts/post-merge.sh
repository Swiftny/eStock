#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @workspace/estock-core run db:setup:dev
