FROM node:24-bookworm

# Install Chromium and ChromeDriver for Selenium integration tests
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome binary path for Selenium (Chromium is Chrome-compatible)
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Set database URL for SQLite
ENV DATABASE_URL="file:./dev.db"

# Enable Corepack for Yarn
RUN corepack enable

WORKDIR /app

# Copy package files and prisma schema for postinstall
COPY package.json yarn.lock .yarnrc.yml ./
COPY prisma prisma
COPY prisma.config.ts ./

# Install dependencies (runs postinstall which generates Prisma client)
RUN yarn install --immutable

# Copy remaining source code
COPY . .

# Run database migrations
RUN yarn db:migrate

# Default command
CMD ["yarn", "dev"]
