.PHONY: setup run seed

PYTHON := python
VENV := venv
PIP := $(VENV)/Scripts/pip
PYTHON_VENV := $(VENV)/Scripts/python

setup:
	$(PYTHON) -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@echo.
	@echo Setup concluido! Execute "make run" para iniciar o servidor.

run:
	$(PYTHON_VENV) -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

seed:
	$(PYTHON_VENV) seed.py
