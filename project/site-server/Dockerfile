FROM node:20-alpine
WORKDIR /app

# Копируем shared, так как бэкенд зависит от него через file:../shared
COPY shared /shared

# Копируем конфиги
COPY site-server/package*.json ./
COPY site-server/tsconfig.json ./
COPY site-server/nodemon.json ./

RUN npm install

COPY site-server/ .

EXPOSE 3000

CMD ["npx", "nodemon"]
