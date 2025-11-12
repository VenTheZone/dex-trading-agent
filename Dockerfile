# Multi-stage build for production-ready Docker image
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
FROM base AS deps
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm and serve for production
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm add -g serve

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
