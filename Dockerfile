FROM node:20-alpine

# Create app directory
WORKDIR /app
COPY . .

# Install app dependencies
RUN corepack enable
RUN yarn install

CMD [ "yarn", "start" ]

EXPOSE 8081
