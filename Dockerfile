FROM node:20-bullseye AS node-source

FROM debian:bullseye

# Copy pre-built Node.js 20 and npm from official Debian-based Node image
COPY --from=node-source /usr/local/bin /usr/local/bin
COPY --from=node-source /usr/local/lib /usr/local/lib
COPY --from=node-source /usr/local/include /usr/local/include
COPY --from=node-source /usr/local/share /usr/local/share

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm ci

COPY shared shared
COPY frontend frontend
COPY backend backend
COPY data data

RUN npm test && npm run build

ENV PORT=8080
EXPOSE 8080
CMD ["node", "backend/dist/index.cjs"]
