FROM node:current-alpine

EXPOSE 8080

COPY . /iframely

WORKDIR /iframely

RUN apk add --no-cache git && \
    npm install -g forever && \
    npm install

ENTRYPOINT [ "/iframely/docker/entrypoint.sh" ]
