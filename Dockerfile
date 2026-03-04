FROM node:18-bullseye-slim AS builder

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Install frontend dependencies and build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build


FROM node:18-bullseye-slim

WORKDIR /app

ENV NODE_ENV=production
# Hugging Face Spaces will set PORT, default to 7860
ENV PORT=7860

# Backend
COPY backend/package*.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# Frontend build output
COPY --from=builder /app/frontend/dist ./frontend/dist

# Ensure uploads directory exists
RUN mkdir -p ./backend/uploads

WORKDIR /app/backend

EXPOSE 7860

CMD ["node", "server.js"]

