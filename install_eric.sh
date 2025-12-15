#!/bin/bash
# ERiC Installation Script for OCI VM
# Run this on your VM: bash install_eric.sh

set -e

echo "Installing ERiC on OCI VM..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y wget unzip openjdk-17-jdk

# Create ERiC directory
ERIC_DIR="/opt/eric"
sudo mkdir -p $ERIC_DIR
sudo chown ubuntu:ubuntu $ERIC_DIR

# Download ERiC (replace with actual download URL)
# Note: You need to provide the actual ERiC download URL
ERIC_URL="https://example.com/eric.zip"  # Replace with real URL
wget -O /tmp/eric.zip "$ERIC_URL"

# Extract ERiC
unzip /tmp/eric.zip -d $ERIC_DIR
rm /tmp/eric.zip

# Set permissions
sudo chown -R ubuntu:ubuntu $ERIC_DIR

# Create systemd service for ERiC
cat <<EOF | sudo tee /etc/systemd/system/eric.service
[Unit]
Description=ERiC Tax Software
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$ERIC_DIR
ExecStart=$ERIC_DIR/bin/eric-runner.sh  # Adjust path as needed
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable eric
sudo systemctl start eric

echo "ERiC installed and started. Check status with: sudo systemctl status eric"