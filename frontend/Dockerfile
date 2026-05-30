FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --quiet
COPY tsconfig.json ./
COPY next.config.js ./
COPY postcss.config.js ./
COPY app ./app
COPY lib ./lib
COPY public ./public
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
