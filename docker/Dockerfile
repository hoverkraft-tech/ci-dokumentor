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

# Production stage - minimal runtime image
FROM node:24-alpine AS production

# Install git
# hadolint ignore=DL3018
RUN apk add --no-cache git

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ci-dokumentor -u 1001

# Set working directory
WORKDIR /app

# Copy only the built CLI and its dependencies from builder
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cli/dist ./packages/cli/dist
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cli/node_modules ./packages/cli/node_modules

COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/core/dist ./packages/core/dist
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/core/node_modules ./packages/core/node_modules

COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/git/dist ./packages/repository/git/dist
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/git/node_modules ./packages/repository/git/node_modules

COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/github/dist ./packages/repository/github/dist
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/github/node_modules ./packages/repository/github/node_modules

COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cicd/github-actions/dist ./packages/cicd/github-actions/dist
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
ENTRYPOINT ["/usr/local/bin/ci-dokumentor"]

WORKDIR /workspace
RUN git config --global --add safe.directory /workspace

# Default to help when no arguments provided
CMD ["--help"]