# Estágio 1: Build - Instala dependências, gera o Prisma e compila o código
FROM node:20-slim AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia a lista de materiais (package.json)
COPY package.json package-lock.json ./

# Instala TODAS as dependências (incluindo as de desenvolvimento)
RUN npm install

# Copia todo o resto do código fonte
COPY . .

# Gera o Prisma Client para o ambiente Linux
RUN npx prisma generate

# Compila o código TypeScript para JavaScript
RUN npm run build

# Estágio 2: Produção - Apenas o necessário para rodar
FROM node:20-slim

# Define o diretório de trabalho
WORKDIR /app

# Instala os certificados raíz necessários para a verificação SSL/TLS
# (Usa apt-get em vez de apk, pois a base é Debian)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

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

