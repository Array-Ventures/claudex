FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build args for Vite (baked in at build time)
ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build the production app
RUN npm run build

EXPOSE 3000

# Serve with Vite preview (or use nginx for real production)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]