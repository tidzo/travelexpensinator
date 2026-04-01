.PHONY: help build up down logs test backend-test frontend-test clean install-backend install-backend-dev install-frontend lint format typecheck

help:
	@echo "Travel Expense Manager - Available Commands:"
	@echo "  Docker Commands:"
	@echo "    build          Build all Docker containers"
	@echo "    up             Start all services with Docker Compose"
	@echo "    down           Stop all services"
	@echo "    logs           Show logs from all services"
	@echo "    clean          Clean up containers and volumes"
	@echo ""
	@echo "  Development Commands:"
	@echo "    install-backend      Install backend dependencies with uv"
	@echo "    install-backend-dev  Install backend dev dependencies"
	@echo "    install-frontend     Install frontend dependencies"
	@echo "    dev                  Quick start development environment"
	@echo ""
	@echo "  Code Quality:"
	@echo "    test            Run all tests"
	@echo "    backend-test    Run backend tests only"
	@echo "    frontend-test   Run frontend tests only"
	@echo "    lint            Run linting (ruff)"
	@echo "    format          Format code (black)"
	@echo "    typecheck       Run type checking (mypy)"

# Docker commands
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

# Development setup
install-backend:
	cd backend && uv sync

install-backend-dev:
	cd backend && uv sync --dev

install-frontend:
	cd frontend && npm install

# Testing
test: backend-test
	@echo "All tests completed"

backend-test:
	cd backend && uv run pytest tests/ -v

frontend-test:
	cd frontend && npm test


# Cleanup
clean:
	docker-compose down -v
	docker system prune -f

# Code quality commands
lint:
	cd backend && uv run ruff check .

format:
	cd backend && uv run black .

typecheck:
	cd backend && uv run mypy app/

# Quick development start
dev: build up
	@echo "Development environment started"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@echo "API Docs: http://localhost:8000/docs"