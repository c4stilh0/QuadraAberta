# ==============================================================================
# ETAPA 1: BUILD DO FRONTEND (VITE + REACT)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# String vazia ("") usa o mesmo domínio via proxy reverso do Nginx (/api, /uploads)
ARG VITE_API_URL=""
ARG VITE_ENABLE_DEMO_LOGIN="false"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_DEMO_LOGIN=$VITE_ENABLE_DEMO_LOGIN

RUN npm run build

# ==============================================================================
# ETAPA 2: SERVIDOR ESTÁTICO + PROXY REVERSO (NGINX)
# ==============================================================================
FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
