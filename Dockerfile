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
# CORREÇÃO 1: Usando o nome completo da flag, que é mais robusto
RUN npm install --only=development 
# CORREÇÃO 2: Removido 'npm install -g prisma', pois o npx já usa a versão do projeto
RUN npx prisma generate
RUN npm run build

# Estágio 3: Imagem final de produção
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# CORREÇÃO 3 (A MAIS IMPORTANTE): Copiando o cliente do Prisma gerado na etapa de build
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json .

ENV NODE_ENV=production
CMD ["node", "dist/server.js"]