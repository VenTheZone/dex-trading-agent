# Stage 1: Builder
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install vite for preview command
RUN pnpm add -D vite

# Copy built application from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start the application
CMD ["pnpm", "preview", "--host", "0.0.0.0"]
