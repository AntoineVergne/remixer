FROM node:22-alpine
WORKDIR /app
COPY services/ai-gateway/server.mjs ./server.mjs
COPY services/ai-gateway/use-cases.mjs ./use-cases.mjs
EXPOSE 3000
CMD ["node", "server.mjs"]
