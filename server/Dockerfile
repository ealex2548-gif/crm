# node:20-slim (Debian) em vez de node:20-alpine: o motor do Prisma
# (linux-musl) precisa de libssl 1.1, que as versões recentes do Alpine
# não trazem mais por padrão — causa crash em loop ("PrismaClientInitializationError").
# Debian slim evita esse problema de raiz.
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["npm", "start"]
