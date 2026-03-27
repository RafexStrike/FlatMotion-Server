#!/bin/bash

echo "Installing Manim System Dependencies..."
sudo apt update
sudo apt install -y build-essential python3-dev libcairo2-dev libpango1.0-dev ffmpeg texlive texlive-latex-extra python3-pip python3-venv

echo "Creating a Virtual Environment for Manim..."
python3 -m venv .venv

echo "Activating Environment and installing Manim..."
source .venv/bin/activate
pip install manim

echo "Done! Manim is installed."
echo "CRITICAL: You must restart your backend server with the virtual environment active so it can find manim."
echo "Run this: source .venv/bin/activate && npm run dev"
