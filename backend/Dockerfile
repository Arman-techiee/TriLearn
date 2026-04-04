FROM node:22-alpine

WORKDIR /app

ENV TZ=Asia/Kathmandu
ENV ATTENDANCE_TIMEZONE=Asia/Kathmandu

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY src ./src
COPY prisma.config.ts ./

RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]
