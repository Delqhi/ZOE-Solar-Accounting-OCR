#!/bin/bash
# Deploy Submission Backend to OCI VM
# Run this on your VM: bash deploy_backend.sh

set -e

echo "Deploying Submission Backend..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    sudo apt update
    sudo apt install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu
fi

# Create backend directory
BACKEND_DIR="/home/ubuntu/submission-backend"
mkdir -p $BACKEND_DIR

# Copy backend files (you need to upload them first)
# Assuming you have uploaded the submission-backend folder
# If not, scp it: scp -i .oci_ssh_keys/aura-call-vm-key -r submission-backend ubuntu@92.5.30.252:/home/ubuntu/

cd $BACKEND_DIR

# Install dependencies
npm install

# Build Docker image
sudo docker build -t submission-backend .

# Create docker-compose.yml
cat <<EOF > docker-compose.yml
version: '3.8'
services:
  submission-backend:
    image: submission-backend
    ports:
      - "8080:8080"
    environment:
      - CORS_ALLOW_ORIGIN=*
      - SUBMISSION_API_KEY=your-api-key-here  # Set your API key
    volumes:
      - ./eric:/opt/eric:ro  # Mount ERiC if needed
    restart: unless-stopped
EOF

# Start the backend
sudo docker compose up -d

echo "Backend deployed. Check with: sudo docker ps"
echo "Health check: curl http://localhost:8080/health"