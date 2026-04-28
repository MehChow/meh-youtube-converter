FROM node:22-alpine

WORKDIR /app

# System deps: ffmpeg + yt-dlp from Alpine packages.
RUN apk add --no-cache ffmpeg yt-dlp ca-certificates \
  && addgroup -S app && adduser -S -G app app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000

USER app
EXPOSE 3000

CMD ["node", "src/index.js"]

