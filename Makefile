.PHONY: docker-build docker-run docker-down docker-rebuild


docker-run:
	docker-compose -f docs/docker-compose.yml up

docker-run-detached:
	docker-compose -f docs/docker-compose.yml up -d

docker-down:
	docker-compose -f docs/docker-compose.yml down -v

docker-build:
	docker-compose -f docs/docker-compose.yml build

docker-rebuild:
	docker compose -f docs/docker-compose.yml down -v
	docker compose -f docs/docker-compose.yml build --no-cache
	docker compose -f docs/docker-compose.yml up
