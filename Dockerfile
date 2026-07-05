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
FROM zodern/meteor

COPY --from=builder --chown=app:app /build/bundle /built_app

RUN cd /built_app/programs/server && npm install --omit=dev

# Fix Meteor 3: escribe en shrinkwrap.json en runtime
RUN chmod a+rw /built_app/programs/server/shrinkwrap.json || true

EXPOSE 3000
