FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (express, cors, helmet, morgan)
RUN npm ci --only=production && npm cache clean --force

# Copy simple server
COPY server.js ./

# Expose port (Cloud Run uses PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start simple server
CMD ["node", "server.js"]
