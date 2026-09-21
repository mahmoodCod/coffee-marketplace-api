# ---------------------------------------------------------------------------
# Convenience targets for Docker workflows
# ---------------------------------------------------------------------------
# Usage:
#   make docker-up
#   make docker-down
#   make docker-prod
# ---------------------------------------------------------------------------

COMPOSE       ?= docker compose
ENV_FILE      ?= .env.docker
COMPOSE_FILE  ?= docker-compose.yml
PROD_FILE     ?= docker-compose.prod.yml

.PHONY: docker-env docker-up docker-down docker-logs docker-ps docker-rebuild docker-prod docker-prod-down

docker-env:
	@test -f $(ENV_FILE) || cp .env.docker.example $(ENV_FILE)
	@echo "Using env file: $(ENV_FILE)"

docker-up: docker-env
	$(COMPOSE) --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up --build -d
	@echo ""
	@echo "API:     http://localhost:3000"
	@echo "Swagger: http://localhost:3000/api/docs"
	@echo "Health:  http://localhost:3000/health"

docker-down:
	$(COMPOSE) --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down

docker-logs:
	$(COMPOSE) --env-file $(ENV_FILE) -f $(COMPOSE_FILE) logs -f api

docker-ps:
	$(COMPOSE) --env-file $(ENV_FILE) -f $(COMPOSE_FILE) ps

docker-rebuild: docker-env
	$(COMPOSE) --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up --build --force-recreate -d

docker-prod: docker-env
	$(COMPOSE) --env-file $(ENV_FILE) -f $(COMPOSE_FILE) -f $(PROD_FILE) up --build -d
	@echo ""
	@echo "Nginx:   http://localhost:80"
	@echo "Swagger: http://localhost/api/docs"
	@echo "Health:  http://localhost/health"

docker-prod-down:
	$(COMPOSE) --env-file $(ENV_FILE) -f $(COMPOSE_FILE) -f $(PROD_FILE) down
