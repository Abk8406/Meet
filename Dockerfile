# Stage 1: Build Angular App
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Remove default nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf
# Copy built files
COPY --from=builder /app/dist/Burger_Queen/browser /usr/share/nginx/html
# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]