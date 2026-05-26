FROM node:20-slim

# Install Python and system libs needed by MediaPipe/OpenCV
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install --break-system-packages \
    mediapipe>=0.10.32 \
    opencv-python-headless>=4.10.0 \
    numpy>=1.26.0

WORKDIR /app

# Install Node deps (all, including dev for build)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Remove dev deps after build to slim the image
RUN npm prune --production

EXPOSE 5000

CMD ["npm", "run", "start"]
