FROM postgres:17-alpine
COPY 01-restore.sh 02-schema-patch.sql /docker-entrypoint-initdb.d/
RUN sed -i 's/\r$//' /docker-entrypoint-initdb.d/01-restore.sh \
    && chmod +x /docker-entrypoint-initdb.d/01-restore.sh
