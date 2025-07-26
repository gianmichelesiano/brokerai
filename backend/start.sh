#!/bin/bash
cd /home/gio/dev-gm/brokerai/backend
source venv/bin/activate
# Load environment variables from .env
set -a && source .env && set +a
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
read -p "Press any key to continue..."