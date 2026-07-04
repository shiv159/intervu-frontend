# ── Stage 1: Build ─────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files first (caches npm install layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build for production
COPY . .
RUN npx ng build --configuration=production

# ── Stage 2: Serve with nginx ──────────────────────────────────────────
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built Angular app
COPY --from=build /app/dist/intervu/browser .

# Copy custom nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 8080

# At startup, replace BACKEND_URL_PLACEHOLDER with the actual backend URL,
# then start nginx. Cloud Run injects BACKEND_URL as an env var.
CMD ["/bin/sh", "-c", "sed -i \"s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL:-http://localhost:8080}|g\" /etc/nginx/templates/default.conf.template && cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
