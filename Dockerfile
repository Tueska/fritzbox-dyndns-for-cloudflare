FROM node:alpine

# Set working directory
WORKDIR /usr/app

COPY ./ ./

# Install dependencies
RUN npm install

# Default command
CMD ["npm", "start"]