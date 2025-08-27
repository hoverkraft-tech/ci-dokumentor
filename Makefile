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
	)

ci: ## Execute all formats and checks
	@pnpm run all
	$(MAKE) lint-fix
	$(MAKE) docker-build
	$(MAKE) docker-test

docker-build: ## Build Docker image
	@echo "🐳 Building CI Dokumentor Docker image..."
	@docker build -f docker/Dockerfile -t ci-dokumentor:latest .
	@echo "✅ Docker image built successfully!"

docker-test: docker-build ## Test Docker image functionality
	@echo "🧪 Testing Docker image..."
	@echo "Testing --help command:"
	@docker run --rm ci-dokumentor:latest --help
	@echo "Testing with volume mount:"
	@docker run --rm -v "$(CURDIR):/workspace" ci-dokumentor:latest --help
	@echo "✅ All tests passed!"
	@echo "📊 Image information:"
	@docker images ci-dokumentor:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

define run_linter
	DEFAULT_WORKSPACE="$(CURDIR)"; \
	LINTER_IMAGE="linter:latest"; \
	VOLUME="$$DEFAULT_WORKSPACE:$$DEFAULT_WORKSPACE"; \
	docker build --build-arg UID=$(shell id -u) --build-arg GID=$(shell id -g) --tag $$LINTER_IMAGE .; \
	docker run \
		-e DEFAULT_WORKSPACE="$$DEFAULT_WORKSPACE" \
		-e FILTER_REGEX_INCLUDE="$(filter-out $@,$(MAKECMDGOALS))" \
		-e IGNORE_GITIGNORED_FILES=true \
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