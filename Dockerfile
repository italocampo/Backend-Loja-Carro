# Estágio 1: Instalar dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Estágio 2: Compilar o código TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install --only=dev # <<< ADICIONE ESTA LINHA
RUN npm install -g prisma
RUN npx prisma generate
RUN npm run build

# Estágio 3: Imagem final de produção
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json .

# O prisma client gerado na etapa de build espera o schema, por isso copiamos.
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]