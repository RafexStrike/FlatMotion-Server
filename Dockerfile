# server/Dockerfile
# Dockerfile to build and run the backend server in a container.
# This setup includes system dependencies like Python 3, Manim, FFmpeg, and LaTeX
# which are required for generating the 2D animations using the AI pipeline.

FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Update system and install required system dependencies:
# - python3, pip: For Manim execution
# - ffmpeg: Required by Manim to render videos
# - texlive, texlive-latex-extra: Required by Manim to render MathTex
# - libcairo2-dev, libpango1.0-dev: Required by Manim (cairo backend)
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    ffmpeg \
    texlive \
    texlive-latex-extra \
    libcairo2-dev \
    libpango1.0-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (v20)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install build tools required for Python packages (like pycairo)
RUN pip3 install --upgrade pip setuptools wheel meson ninja

# Install Manim Community Edition via pip
RUN pip3 install --default-timeout=1000 manim

# Set working directory
WORKDIR /app

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build step
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Build the TypeScript project
RUN npm run build

# Expose the port (Render sets the PORT environment variable dynamically)
ENV PORT=5000
EXPOSE 5000

# Start the server using the compiled JavaScript
CMD ["npm", "start"]
