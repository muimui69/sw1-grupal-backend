FROM node:22.11.0

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el package.json y el package-lock.json para instalar las dependencias
COPY package*.json ./

# Instala las dependencias de producción
RUN npm install --omit=dev

# Copia el resto de los archivos del proyecto al contenedor
COPY . .

# Construye la aplicación NestJS
RUN npm run build

# Expone el puerto que usa la aplicación
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "dist/main"]
