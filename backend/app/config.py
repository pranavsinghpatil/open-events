import os
from dotenv import load_dotenv

# Load variables from .env file (check repo root first, then fallback)
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Backend API configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))

# Bright Data Configuration
BRIGHT_DATA_API_KEY = os.getenv("BRIGHT_DATA_API_KEY", "")
BRIGHT_DATA_ZONE = os.getenv("BRIGHT_DATA_ZONE", "web_unlocker")

BRIGHT_DATA_FULLHYD_COLLECTOR = os.getenv("BRIGHT_DATA_FULLHYD_COLLECTOR", "c_mt4huvzfl8yupcmb6")
BRIGHT_DATA_HIGHAPE_COLLECTOR = os.getenv("BRIGHT_DATA_HIGHAPE_COLLECTOR", "c_mt4no7jl2hsz0xq1t")
BRIGHT_DATA_AROUNDU_COLLECTOR = os.getenv("BRIGHT_DATA_AROUNDU_COLLECTOR", "c_mt4nus5z1nhju2014n")

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "")
# Default fallback to local SQLite DB path
if not DATABASE_URL:
    db_dir = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(db_dir, "pipeline.db")
else:
    # If DATABASE_URL starts with sqlite:///, clean it to get the path
    if DATABASE_URL.startswith("sqlite:///"):
        DB_PATH = DATABASE_URL.replace("sqlite:///", "")
    else:
        DB_PATH = DATABASE_URL

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
