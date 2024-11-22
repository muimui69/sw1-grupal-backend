# Usamos la versión específica de Node.js
FROM node:22.11.0

# Instalamos pnpm globalmente
RUN npm install -g pnpm

# Definimos el directorio de trabajo en el contenedor
WORKDIR /app

# Copiamos los archivos esenciales para instalar dependencias
COPY pnpm-lock.yaml package.json ./

# Instalamos dependencias de producción
RUN pnpm install --prod

# Copiamos el resto de los archivos al contenedor
COPY . .

# Construimos la aplicación
RUN pnpm build

# Exponemos el puerto en el que corre el backend
EXPOSE 3000

# Comando de inicio del contenedor
CMD ["node", "dist/main"]
