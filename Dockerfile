FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y curl

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
