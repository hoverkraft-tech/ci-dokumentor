# Multi-stage build for CI Dokumentor CLI
# Production-grade Node.js Docker image with best practices for performance, security, and lightweight design

# Build stage - includes all dependencies and development tools
FROM node:24-alpine AS builder

# Install pnpm for building
RUN corepack enable pnpm

# Create app directory and set permissions
WORKDIR /app

# Copy package manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all packages package.json files
COPY packages/core/package.json ./packages/core/
COPY packages/cli/package.json ./packages/cli/
COPY packages/repository/git/package.json ./packages/repository/git/
COPY packages/repository/github/package.json ./packages/repository/github/
COPY packages/cicd/github-actions/package.json ./packages/cicd/github-actions/

# Install all dependencies (including dev dependencies for building)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages, except docs
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm build --exclude=docs

# Removes unnecessary packages
# FIXME: The prune command does not support recursive execution on a monorepo currently. See https://pnpm.io/cli/prune.
RUN rm -fr /app/node_modules /app/**/node_modules
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-optional --prod --frozen-lockfile

# Production stage - minimal runtime image
FROM node:24-alpine AS production

# hadolint ignore=DL3018
RUN --mount=type=cache,id=apk-cache,target=/var/cache/apk \
    apk add --no-cache dumb-init git

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ci-dokumentor -u 1001

# Set working directory
WORKDIR /app

# Copy only the built CLI and its dependencies from builder
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cli/dist/bin/ci-dokumentor.js ./packages/cli/dist/bin/ci-dokumentor.js
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cli/node_modules ./packages/cli/node_modules

COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/core/dist/index.js ./packages/core/dist/index.js
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/core/node_modules ./packages/core/node_modules

COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/git/dist/index.js ./packages/repository/git/dist/index.js
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/git/node_modules ./packages/repository/git/node_modules

COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/github/dist/index.js ./packages/repository/github/dist/index.js
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/github/node_modules ./packages/repository/github/node_modules

COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cicd/github-actions/dist/index.js ./packages/cicd/github-actions/dist/index.js
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cicd/github-actions/node_modules ./packages/cicd/github-actions/node_modules

# Copy runtime dependencies
COPY --from=builder --chown=ci-dokumentor:nodejs /app/node_modules ./node_modules

# Copy package.json files needed for module resolution
COPY --from=builder --chown=ci-dokumentor:nodejs /app/package.json ./
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cli/package.json ./packages/cli/
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/core/package.json ./packages/core/
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/git/package.json ./packages/repository/git/
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/github/package.json ./packages/repository/github/
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cicd/github-actions/package.json ./packages/cicd/github-actions/

# Create executable from CLI
RUN ln -s /app/packages/cli/dist/bin/ci-dokumentor.js /usr/local/bin/ci-dokumentor && chmod +x /usr/local/bin/ci-dokumentor

# Create Docker entrypoint
COPY ./docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Switch to non-root user
USER ci-dokumentor

# Set environment variables for production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--unhandled-rejections=strict"

# Expose no ports (CLI tool)
EXPOSE 0

# Health check to ensure the CLI is functional
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/ci-dokumentor --version || exit 1

# Set entrypoint so users can use the image exactly as they would use the nodejs package
ENTRYPOINT ["dumb-init", "/usr/local/bin/entrypoint"]

WORKDIR /workspace
RUN git config --global --add safe.directory /workspace

# Default to help when no arguments provided
CMD ["--help"]