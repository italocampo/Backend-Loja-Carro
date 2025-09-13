# Adiciona um argumento que pode ser usado para invalidar o cache
ARG CACHE_BUSTER=1

# Estágio 1: Build - Instala dependências, gera o Prisma e compila o código
FROM node:20-alpine AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia a lista de materiais (package.json)
COPY package.json package-lock.json ./

# --- CORREÇÃO ANTI-CACHE ---
# Usamos o CACHE_BUSTER aqui. Se ele mudar, o Docker é forçado a rodar esta linha de novo
RUN echo "Invalidando cache com CACHE_BUSTER=${CACHE_BUSTER}" && npm install

# Copia todo o resto do código fonte
COPY . .

# Gera o Prisma Client para o ambiente Linux
RUN npx prisma generate

# Compila o código TypeScript para JavaScript
RUN npm run build

# Estágio 2: Produção - Apenas o necessário para rodar
FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Primeiro, copia o package.json para que o 'npm prune' saiba o que fazer
COPY package.json .

# Agora, copia as dependências completas do estágio de build
COPY --from=build /app/node_modules ./node_modules

# Com o package.json no lugar, o prune vai funcionar corretamente
RUN npm prune --production

# Copia os arquivos compilados do estágio de build
COPY --from=build /app/dist ./dist

# Expõe a porta que a aplicação usa
EXPOSE 4000

# O comando para iniciar a aplicação
CMD ["npm", "run", "start"]
