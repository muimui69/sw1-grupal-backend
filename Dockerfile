# Usamos la versión específica de Node.js
FROM node:22.11.0

# Instalamos wget y otras herramientas necesarias
RUN apt-get update && apt-get install -y wget gnupg

# Agregamos la clave pública de MongoDB para asegurarnos de que podemos usar el repositorio oficial
RUN wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

# Agregamos el repositorio de MongoDB
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/6.0 main" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Actualizamos los repositorios
RUN apt-get update

# Instalamos las herramientas de MongoDB (mongodb-database-tools)
RUN apt-get install -y mongodb-database-tools

# Instalamos pnpm globalmente
RUN npm install -g pnpm

# Definimos el directorio de trabajo en el contenedor
WORKDIR /app

# Copiamos el archivo .env al contenedor
COPY .env .env

# Copiamos los archivos esenciales para instalar dependencias primero
COPY package.json pnpn-lock.yaml ./ 

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
