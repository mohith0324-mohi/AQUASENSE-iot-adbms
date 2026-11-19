# ==========================================================
# AquaSense - Database Configuration
# ==========================================================
# Set AQUASENSE_DB_PASSWORD in the environment for local MySQL access.
# ==========================================================

import os

DB_CONFIG = {
    "host": os.getenv("AQUASENSE_DB_HOST", "localhost"),
    "user": os.getenv("AQUASENSE_DB_USER", "root"),
    "password": os.getenv("AQUASENSE_DB_PASSWORD", ""),
    "database": os.getenv("AQUASENSE_DB_NAME", "aquasense"),
}