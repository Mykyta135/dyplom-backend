# Stage 1: Build
# Use Node 22 to satisfy @darraghor/eslint-plugin-nestjs-typed
# backend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Copy dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --ignore-scripts

# Copy the compiled code
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Use the production-safe migration runner
CMD ["npm", "run", "start:prod"]