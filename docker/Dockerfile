# Multi-stage build for CI Dokumentor CLI
# Production-grade Node.js Docker image with best practices for performance, security, and lightweight design

ARG NODE_VERSION=20.12.2

# Build stage - includes all dependencies and development tools
FROM node:${NODE_VERSION}-alpine AS builder

# Install pnpm for building
RUN corepack enable pnpm

# Create app directory and set permissions
WORKDIR /app

# Copy package manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/

# Install all dependencies (including dev dependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage - minimal runtime image
FROM node:${NODE_VERSION}-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ci-dokumentor -u 1001

# Set working directory
WORKDIR /app

# Copy only the built CLI and its dependencies from builder
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cli/dist ./packages/cli/dist
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/core/dist ./packages/core/dist
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/git/dist ./packages/repository/git/dist
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/github/dist ./packages/repository/github/dist
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cicd/github-actions/dist ./packages/cicd/github-actions/dist

# Copy runtime dependencies
COPY --from=builder --chown=ci-dokumentor:nodejs /app/node_modules ./node_modules

# Copy package.json files needed for module resolution
COPY --from=builder --chown=ci-dokumentor:nodejs /app/package.json ./
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cli/package.json ./packages/cli/
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/core/package.json ./packages/core/
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/git/package.json ./packages/repository/git/
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/repository/github/package.json ./packages/repository/github/
COPY --from=builder --chown=ci-dokumentor:nodejs /app/packages/cicd/github-actions/package.json ./packages/cicd/github-actions/

# Copy validation script for health checks
COPY --from=builder --chown=ci-dokumentor:nodejs /app/docker/validate-structure.js ./docker/

# Switch to non-root user
USER ci-dokumentor

# Set environment variables for production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--unhandled-rejections=strict"

# Expose no ports (CLI tool)
EXPOSE 0

# Health check to ensure the CLI structure is valid and can start
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node /app/docker/validate-structure.js || exit 1

# Default command is the CI Dokumentor CLI with help when no args provided
CMD ["node", "packages/cli/dist/bin/ci-dokumentor.js", "--help"]