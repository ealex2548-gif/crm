# node:20-slim (Debian) em vez de node:20-alpine: o motor do Prisma
# (linux-musl) precisa de libssl 1.1, que as versões recentes do Alpine
# não trazem mais por padrão — causa crash em loop ("PrismaClientInitializationError").
# Debian slim evita esse problema de raiz.
FROM node:20-slim

WORKDIR /app

# node:20-slim não vem com openssl — sem ele, o `prisma generate` detecta
# a versão errada do motor (debian-openssl-1.1.x) e o app crasha ao subir,
# porque em runtime só existe libssl 3.0. Instalar antes do generate resolve.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["npm", "start"]
