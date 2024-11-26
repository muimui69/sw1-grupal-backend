# Usamos la versión específica de Node.js
FROM node:22.11.0

# Instalamos pnpm globalmente
RUN npm install -g pnpm

# Instalamos herramientas de MongoDB para backups (mongodump y mongorestore)
RUN apt-get update && apt-get install -y mongodb-clients

# Definimos el directorio de trabajo en el contenedor
WORKDIR /app

# Copiamos el archivo .env al contenedor
COPY .env .env

# Copiamos los archivos esenciales para instalar dependencias primero
COPY package.json pnpm-lock.yaml ./

# Instalamos todas las dependencias, incluyendo el CLI de NestJS
RUN pnpm install --frozen-lockfile

# Copiamos el resto de los archivos al contenedor
COPY . .

# Compilamos el código TypeScript utilizando el CLI de NestJS
RUN pnpm exec nest build

# Removemos las dependencias de desarrollo para reducir el tamaño de la imagen
RUN pnpm prune --prod

# Exponemos el puerto en el que corre el backend
EXPOSE 3000

# Configuramos el usuario para ejecutar el contenedor de forma segura
USER node

# Comando de inicio del contenedor
CMD ["node", "dist/main"]
