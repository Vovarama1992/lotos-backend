# Use the official Node.js image as the base image.
FROM node:18 AS build

# Create and change to the app directory.
WORKDIR /usr/src/app

# Install production dependencies.
COPY package*.json ./
RUN npm install --only=production

# Copy the application code.
COPY . .

# Build the application.
RUN npm run build

# Set the environment variable to specify the port the app runs on.
ENV PORT=3000

# Expose the port the app runs on.
EXPOSE 3000

# Start the application.
CMD ["npm", "run", "start:prod"]