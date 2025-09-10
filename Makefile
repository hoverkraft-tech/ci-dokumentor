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
	@pnpm i
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
	@echo "Testing generate --dry-run command:"
	$(MAKE) docker-run -- "generate --dry-run --source action.yml --repository git"
	@echo "✅ All tests passed!"
	@echo "📊 Image information:"
	@docker images ci-dokumentor:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

docker-shell: docker-build ## Open a shell in the Docker image
	@echo "🐳 Opening shell in CI Dokumentor Docker image..."	
	@docker run --rm -it -v "$(CURDIR):/workspace" --user $(shell id -u):$(shell id -g) --entrypoint /bin/sh ci-dokumentor:latest

docker-run: ## Run a command in the Docker container
	@docker run --rm -v "$(CURDIR):/workspace" --user $(shell id -u):$(shell id -g) ci-dokumentor:latest $(filter-out $@,$(MAKECMDGOALS))

docs-generate: ## Generate documentation
	@GITHUB_TOKEN=$(shell gh auth token) node packages/cli/dist/bin/ci-dokumentor.js gen --source action.yml \
		--include-sections badges,contributing,license,generated \
		--extra-badges '[{ "label": "Total Downloads", "url": "https://img.shields.io/npm/dm/@ci-dokumentor/cli", "linkUrl": "https://www.npmjs.com/package/@ci-dokumentor/cli" },{ "label": "Coverage Status", "url": "https://codecov.io/gh/hoverkraft-tech/ci-dokumentor/branch/main/graph/badge.svg", "linkUrl": "https://codecov.io/gh/hoverkraft-tech/ci-dokumentor" },{ "label": "Continuous Integration", "url": "https://github.com/hoverkraft-tech/ci-dokumentor/actions/workflows/main-ci.yml/badge.svg", "linkUrl": "https://github.com/hoverkraft-tech/ci-dokumentor/actions/workflows/main-ci.yml" }]'

	@GITHUB_TOKEN=$(shell gh auth token) node packages/cli/dist/bin/ci-dokumentor.js gen --source action.yml \
		--destination packages/docs/content/integrations/github-action.md \
		--include-sections usage,inputs,outputs,secrets

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