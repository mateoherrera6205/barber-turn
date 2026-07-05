###############################################################################
# Stage 1 — Build
###############################################################################
FROM node:20-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl g++ make python3 \
    && rm -rf /var/lib/apt/lists/*

ENV HOME=/root
ENV METEOR_ALLOW_SUPERUSER=1
RUN curl https://install.meteor.com/ | sh
ENV PATH="/root/.meteor:${PATH}"

WORKDIR /app

# El repo raíz ES el proyecto Meteor, así que copiamos todo directamente
COPY . .

RUN meteor npm install
RUN meteor build --directory /build --server-only

###############################################################################
# Stage 2 — Runtime
###############################################################################
FROM node:22-bookworm

ENV NODE_ENV=production

WORKDIR /built_app

# Copiar el bundle compilado desde la etapa builder
COPY --from=builder /build/bundle /built_app

# Instalar dependencias de producción del bundle
RUN cd /built_app/programs/server && npm install --omit=dev

# Fix Meteor 3: necesita escribir en shrinkwrap.json en runtime
RUN chmod a+rw /built_app/programs/server/shrinkwrap.json || true

EXPOSE 3000

# El entrypoint del bundle de Meteor es main.js en la raíz del bundle.
# Antes lo arrancaba la imagen zodern/meteor; ahora hay que declararlo.
CMD ["node", "main.js"]
