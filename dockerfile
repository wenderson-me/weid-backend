FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose API port
EXPOSE 5000

# Start in development mode by default
CMD ["npm", "run", "dev"]