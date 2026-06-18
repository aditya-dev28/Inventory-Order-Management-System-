# --- Build stage ---
FROM node:20-alpine AS build

WORKDIR /app

ENV CI=true \
    NODE_OPTIONS=--openssl-legacy-provider

# Install deps
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile || yarn install

# Build
COPY . .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN yarn build

# --- Runtime stage (nginx) ---
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
