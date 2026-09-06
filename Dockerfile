FROM debian:bullseye

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

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
