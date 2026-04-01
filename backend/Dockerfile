FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY src ./src
COPY prisma.config.ts ./

RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]
