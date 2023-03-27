FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install

FROM browserless/chrome as base
WORKDIR /app
COPY --from=builder ./app ./
CMD [ "npm", "run", "start:wechat:web" ]
