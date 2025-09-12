# Estágio 1: Build - Instala dependências, gera o Prisma e compila o código
FROM node:20-alpine AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia a lista de materiais (package.json)
COPY package.json package-lock.json ./

# Instala TODAS as dependências (incluindo as de desenvolvimento)
# Isso é necessário para rodar 'prisma generate' e 'tsc'
RUN npm install

# Copia todo o resto do código fonte
COPY . .

# Gera o Prisma Client para o ambiente Linux
# (O script postinstall não é mais necessário com este Dockerfile)
RUN npx prisma generate

# Compila o código TypeScript para JavaScript
RUN npm run build

# Estágio 2: Produção - Apenas o necessário para rodar
FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia as dependências de PRODUÇÃO do estágio de build
# O prune remove as dependências de desenvolvimento que não precisamos mais
COPY --from=build /app/node_modules ./node_modules
RUN npm prune --production

# Copia os arquivos compilados do estágio de build
COPY --from=build /app/dist ./dist

# Copia o package.json para o comando de start
COPY package.json .

# Expõe a porta que a aplicação usa
EXPOSE 4000

# O comando para iniciar a aplicação
CMD ["npm", "run", "start"]