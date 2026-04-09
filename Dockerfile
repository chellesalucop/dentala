FROM node:20-alpine AS frontend-build

# Set working directory for frontend build
WORKDIR /app/frontend

# Copy frontend package files
COPY dentala-frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY dentala-frontend/ ./

# Build frontend
RUN npm run build

# Backend stage
FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git unzip libpq-dev curl

# Install PostgreSQL extension
RUN docker-php-ext-install pdo pdo_pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy backend files
COPY dentala-backend/ ./

# Copy frontend build to public directory
COPY --from=frontend-build /app/frontend/dist ./public

# Install Laravel dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache
RUN chmod -R 775 /app/storage /app/bootstrap/cache

# Create the storage link for images
RUN php artisan storage:link

# Expose port
EXPOSE 10000

# Start either web server or queue worker based on environment variable
CMD sh -c "if [ \"\$SERVICE_TYPE\" = \"worker\" ]; then php artisan optimize:clear && php artisan queue:work --sleep=3 --tries=3 --timeout=60 --memory=128; else php artisan optimize:clear && php artisan serve --host=0.0.0.0 --port=10000; fi"

