FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy entire repository so workspace packages are available
COPY . .

# Change to backend app and install dependencies
WORKDIR /app/apps/backend
RUN pnpm install

# Expose port
EXPOSE 4000

# Start development server
CMD ["pnpm", "dev"]
