# front-board-game/Dockerfile
FROM node:20-alpine
WORKDIR /app/front-board-game

COPY shared /app/shared
COPY front-board-game/package*.json ./

RUN npm install

COPY front-board-game/ .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]