FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy entire repository so workspace packages are available
COPY . .

# Install dependencies at the workspace root
RUN pnpm install

# Change to frontend app
WORKDIR /app/apps/frontend

# Expose port
EXPOSE 3000

# Start development server
CMD ["pnpm", "dev"]
