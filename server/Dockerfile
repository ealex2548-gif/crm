FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["npm", "start"]
