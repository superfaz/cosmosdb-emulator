FROM node:20-alpine

# Create app directory
WORKDIR /app
ENV NODE_ENV=production

# Install app dependencies
COPY package.json ./
RUN npm install --omit=dev

# Bundle app
COPY ./dist .
COPY .certs/ .certs/

# Prepare data volume
RUN mkdir data
VOLUME [ "/app/data" ]

CMD [ "node", "index.js" ]

EXPOSE 8081
