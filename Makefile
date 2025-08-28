.PHONY: help

help: ## Display help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

lint: ## Execute linting
	$(call run_linter,)

lint-fix: ## Execute linting and fix
	$(call run_linter, \
		-e FIX_JSON_PRETTIER=true \
		-e FIX_JAVASCRIPT_PRETTIER=true \
		-e FIX_YAML_PRETTIER=true \
		-e FIX_MARKDOWN=true \
		-e FIX_MARKDOWN_PRETTIER=true \
		-e FIX_NATURAL_LANGUAGE=true \
		-e FIX_CSS_PRETTIER=true \
		-e FIX_SHELL_SHFMT=true \
	)

build:
	@pnpm run build
	$(MAKE) docker-build

test:
	@pnpm run test
	$(MAKE) docker-test

ci: ## Execute all formats and checks
	@pnpm run all
	$(MAKE) lint-fix
	$(MAKE) docker-test

docker-build: ## Build Docker image
	@echo "🐳 Building CI Dokumentor Docker image..."
	@docker build -f docker/Dockerfile -t ci-dokumentor:latest .
	@echo "✅ Docker image built successfully!"

docker-test: docker-build ## Test Docker image functionality
	@echo "🧪 Testing Docker image..."
	@echo "Testing --help command:"
	$(MAKE) docker-run -- --help
	@echo "Testing generate --help command:"
	$(MAKE) docker-run -- generate --help
	@echo "✅ All tests passed!"
	@echo "📊 Image information:"
	@docker images ci-dokumentor:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

docker-shell: docker-build ## Open a shell in the Docker image
	@echo "🐳 Opening shell in CI Dokumentor Docker image..."	
	@docker run --rm -it -v "$(CURDIR):/workspace" --user $(shell id -u):$(shell id -g) --entrypoint /bin/sh ci-dokumentor:latest

docker-run: ## Run a command in the Docker container
	@docker run --rm -v "$(CURDIR):/workspace" --user $(shell id -u):$(shell id -g) ci-dokumentor:latest $(1)

define run_linter
	DEFAULT_WORKSPACE="$(CURDIR)"; \
	LINTER_IMAGE="linter:latest"; \
	VOLUME="$$DEFAULT_WORKSPACE:$$DEFAULT_WORKSPACE"; \
	docker build --build-arg UID=$(shell id -u) --build-arg GID=$(shell id -g) --tag $$LINTER_IMAGE .; \
	docker run \
		-e DEFAULT_WORKSPACE="$$DEFAULT_WORKSPACE" \
		-e FILTER_REGEX_INCLUDE="$(filter-out $@,$(MAKECMDGOALS))" \
		-e IGNORE_GITIGNORED_FILES=true \
        -e VALIDATE_JSCPD=false \
        -e VALIDATE_TYPESCRIPT_ES=false \
        -e VALIDATE_TYPESCRIPT_PRETTIER=false \
        -e VALIDATE_JAVASCRIPT_ES=false \
        -e VALIDATE_TSX=false \
		$(1) \
		-v $$VOLUME \
		--rm \
		$$LINTER_IMAGE
endef

#############################
# Argument fix workaround
#############################
%:
	@: