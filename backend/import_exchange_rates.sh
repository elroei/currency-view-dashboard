#!/bin/sh
set -e
START_DATE=$(date -d "-5 years" +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)
for CUR in USD EUR GBP; do
  echo "Importing $CUR to ILS from $START_DATE to $END_DATE..."
  php /var/www/html/reset_exchange_rates.php $START_DATE $END_DATE $CUR || true
done
# Start Apache in foreground
exec apache2-foreground 