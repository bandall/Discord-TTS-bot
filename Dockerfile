FROM node:18.4.0

LABEL maintainer="jsm5315@ajou.ac.kr"

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

RUN npm install -g pm2 

RUN npm install copyfiles -g

COPY ./ ./

RUN npm run build

WORKDIR /home/node/app/Discord-TTS-bot

CMD ["node", "/home/node/app/build/app.js", "--name", "TTS Bot"]