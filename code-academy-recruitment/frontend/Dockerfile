# 简化的前端 Dockerfile，避免用户权限问题

# Build stage
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG REACT_APP_API_URL
ARG REACT_APP_ALLOWED_EMAIL_DOMAIN

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ALLOWED_EMAIL_DOMAIN=$REACT_APP_ALLOWED_EMAIL_DOMAIN

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM --platform=$TARGETPLATFORM nginx:alpine

# Copy custom nginx config (simplified, no brotli)
COPY nginx-simple.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx (run as root, nginx will drop privileges automatically)
CMD ["nginx", "-g", "daemon off;"]