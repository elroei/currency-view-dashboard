# Dockerfile for PHP backend (Apache)
FROM php:7.4-apache

# Enable mod_rewrite
RUN a2enmod rewrite

# Install PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Copy API and config
COPY api /var/www/html/api
COPY config.php /var/www/html/config.php
COPY .env /var/www/html/.env

# Set working directory
WORKDIR /var/www/html

# Expose port 80
EXPOSE 80

# Set recommended Apache settings
RUN echo "<Directory /var/www/html/api>\n    AllowOverride All\n    Require all granted\n</Directory>" > /etc/apache2/conf-available/api.conf && \
    a2enconf api

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Copy init.sql for DB initialization (used by docker-compose)
COPY init.sql /docker-entrypoint-initdb.d/ 