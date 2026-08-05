# syntax=docker/dockerfile:1

# ---- Stage 1: install production dependencies only -------------------------
FROM node:22-alpine AS deps

WORKDIR /app

COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime --------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Fixed, non-root UID/GID so it matches the Kubernetes pod securityContext
RUN addgroup -g 10001 nodejs \
    && adduser -S -u 10001 -G nodejs nodeapp

# The base image ships npm, corepack, and Yarn plus their own dependency
# trees, none of which this container invokes at runtime (CMD calls node
# directly). Removing them cuts image size and eliminates CVEs in that
# tooling's bundled deps (e.g. tar, brace-expansion) that would otherwise
# show up in every vulnerability scan for tools this image doesn't use.
RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/corepack \
    /usr/local/bin/yarn \
    /usr/local/bin/yarnpkg \
    /opt/yarn-v*

COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --chown=nodeapp:nodejs app/package.json ./
COPY --chown=nodeapp:nodejs app/app.js app/server.js ./

USER nodeapp

EXPOSE 3001

# Runs as PID 1 with exec-form CMD, so it receives SIGTERM directly and the
# graceful-shutdown handler in server.js runs without needing an init process.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3001/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
