FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

EXPOSE 3000

# Run dev server (for production, consider: npm run build && npm run preview)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]