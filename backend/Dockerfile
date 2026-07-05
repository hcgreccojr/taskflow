# --- deps ---
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl python3 make g++
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# --- build ---
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl python3 make g++
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
