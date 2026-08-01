FROM node:22-bookworm

WORKDIR /app

RUN npm install -g @ionic/cli

COPY app/package*.json ./
RUN npm ci

COPY app/ .

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8100

ENTRYPOINT ["/docker-entrypoint.sh"]