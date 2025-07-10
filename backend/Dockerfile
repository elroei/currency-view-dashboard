# Dockerfile for PHP backend (Apache)
FROM php:7.4-apache

# Install msmtp for email sending
RUN apt-get update && apt-get install -y msmtp && rm -rf /var/lib/apt/lists/*
# Add msmtp config for Mailpit
RUN echo 'account default\nhost mailpit\nport 1025\nfrom noreply@example.com\ntls off\nauth off\nlogfile /tmp/msmtp.log' > /etc/msmtprc

# Enable mod_rewrite
RUN a2enmod rewrite

# Install PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Copy API and config
COPY api /var/www/html/api
COPY config.php /var/www/html/config.php
COPY .env /var/www/html/.env
COPY php.ini /usr/local/etc/php/php.ini

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
# Add entrypoint script to auto-import historical rates on container start
COPY import_exchange_rates.sh /import_exchange_rates.sh
RUN chmod +x /import_exchange_rates.sh
COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh
ENTRYPOINT ["/import_exchange_rates.sh"] 