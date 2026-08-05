# Use a lightweight Node.js image
FROM node:22-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package files first (better layer caching)
COPY app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application source
COPY app/ .

# Expose the application port
EXPOSE 3001

# Start the application
CMD ["node", "server.js"]