FROM nginx:alpine

# Copy static assets
COPY index.html /usr/share/nginx/html/index.html

# Copy custom Nginx config if needed (optional for simple static)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 inside container
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
