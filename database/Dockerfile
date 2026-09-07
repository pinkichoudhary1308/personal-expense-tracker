FROM mysql:8.0

COPY expense_tracker_users.sql /docker-entrypoint-initdb.d/01_users.sql
COPY expense_tracker_transactions.sql /docker-entrypoint-initdb.d/02_transactions.sql

EXPOSE 3306