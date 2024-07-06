# 빌드 스테이지
FROM node:18.4.0 AS builder

LABEL maintainer="jsm5315@ajou.ac.kr"

# 애플리케이션 코드 복사 및 설치
WORKDIR /home/node/app
COPY ./ ./
RUN npm install
RUN npm install copyfiles -g
RUN npm run build

# 최종 스테이지
FROM node:18.4.0

# 빌드된 파일만 복사
COPY --from=builder /home/node/app /home/node/app

RUN npm install -g pm2

WORKDIR /home/node/app/Discord-TTS-bot

ENTRYPOINT ["pm2-runtime", "/home/node/app/build/app.js", "--name", "Music Bot"]
