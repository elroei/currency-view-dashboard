# Dockerfile for React frontend
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build
 
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 