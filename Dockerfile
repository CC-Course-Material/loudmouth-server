FROM node:12.16.1-alpine3.9

RUN mkdir /home/node/app/ && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

USER node

RUN npm install --only=production && npm cache clean --force --loglevel=error

COPY --chown=node:node . ./

EXPOSE 3000

CMD [ "npm", "run", "start"]