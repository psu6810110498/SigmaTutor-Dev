FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy entire repository so workspace packages are available
COPY . .

# Change to frontend app and install dependencies
WORKDIR /app/apps/frontend
RUN pnpm install

# Expose port
EXPOSE 3000

# Start development server
CMD ["pnpm", "dev"]
