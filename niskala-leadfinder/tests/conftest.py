import json
from pathlib import Path

import pytest

from leadfinder.config import load_config

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = Path(__file__).resolve().parent / "fixtures"


def load_fixture(name: str):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


@pytest.fixture
def cfg():
    return load_config(ROOT / "config.toml")


@pytest.fixture
def conn(tmp_path):
    from leadfinder import db

    c = db.connect(tmp_path / "leads.db")
    yield c
    c.close()
