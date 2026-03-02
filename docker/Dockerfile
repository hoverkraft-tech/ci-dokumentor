# Multi-stage build: build & pack then install globally in a minimal runtime image
FROM node:25-alpine AS builder

# Use pnpm for fast installs and reproducible builds
RUN corepack enable pnpm

WORKDIR /build

# Copy package manager files and package manifests needed for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/cicd/github-actions/package.json ./packages/cicd/github-actions/
COPY packages/cicd/gitlab-ci/package.json ./packages/cicd/gitlab-ci/
COPY packages/cli/package.json ./packages/cli/
COPY packages/core/package.json ./packages/core/
COPY packages/docs/package.json ./packages/docs/
COPY packages/repository/git/package.json ./packages/repository/git/
COPY packages/repository/github/package.json ./packages/repository/github/
COPY packages/repository/gitlab/package.json ./packages/repository/gitlab/

# Install all deps (including dev) for building
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source and build configs
COPY ./packages ./packages
COPY ./nx.json ./tsconfig.base.json ./tsconfig.json ./vite.shared.ts ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm build --exclude=docs --verbose

# Pack the CLI package to a single tarball for an efficient, cache-friendly install
WORKDIR /build/packages/cli
RUN mkdir -p /pack && \
    # npm pack produces a single .tgz we can move to /pack
    npm pack --pack-destination /pack

# Final runtime image: minimal, with the CLI installed globally
FROM node:25-alpine AS production

# Install minimal runtime deps
# hadolint ignore=DL3018
RUN apk add --no-cache dumb-init git

# Create non-root user for runtime
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ci-dokumentor -u 1001 -G nodejs -h /home/ci-dokumentor && \
    mkdir -p /home/ci-dokumentor

WORKDIR /home/ci-dokumentor

# Copy packed CLI tarball from builder and install it globally
COPY --from=builder /pack/*.tgz /tmp/ci-dokumentor.tgz
RUN npm set progress=false && \
    npm i -g /tmp/ci-dokumentor.tgz --no-audit --no-fund && \
    rm -rf /tmp/ci-dokumentor.tgz /root/.npm/_cacache /var/cache/apk/*

# Copy entrypoint script
COPY ./docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Run as non-root for better security
USER ci-dokumentor

# Production environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--unhandled-rejections=strict"

# No ports (CLI only)
EXPOSE 0

# Healthcheck: ensure the globally-installed binary is healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/ci-dokumentor --version || exit 1

ENTRYPOINT ["dumb-init", "/usr/local/bin/entrypoint"]

WORKDIR /workspace
RUN git config --global --add safe.directory /workspace

# Default to help when no args provided
CMD ["--help"]