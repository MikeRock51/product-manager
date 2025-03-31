FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./
COPY .env.example /.env

RUN yarn

# Copy application source code
COPY . .

# Build TypeScript code
RUN yarn build

# Expose port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["yarn", "start"]