"""Project paths and config.toml loading."""

from __future__ import annotations

import tomllib
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config.toml"
DB_PATH = ROOT / "data" / "leads.db"
RAW_DIR = ROOT / "data" / "raw"
EXPORTS_DIR = ROOT / "exports"


def load_config(path: Path | None = None) -> dict[str, Any]:
    with open(path or CONFIG_PATH, "rb") as f:
        return tomllib.load(f)
