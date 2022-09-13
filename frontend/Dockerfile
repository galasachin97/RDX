FROM dev.diycam.com/diycam/node:14.19.3 AS builder

WORKDIR /app

COPY package.json ./

RUN npm install 

COPY . ./

RUN npm run build

FROM dev.diycam.com/diycam/rdx_nginx:alpine

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=builder /app/build .

COPY ./default.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]

