# Chat App

# install TLS Cert

# Step: 1

# Install mkcert tool - macOS; you can see the mkcert repo for details

sudo apt install mkcert

# Step: 2

# Install nss (only needed if you use Firefox)

sudo apt install nss

# Step: 3

# Setup mkcert on your machine (creates a CA)

mkcert -install

# Step: 4 (Final)

# at the project root directory run the following command

mkdir -p .cert && mkcert -key-file ./.cert/key.pem -cert-file ./.cert/cert.pem 'localhost'

# E2EE

source:https://www.npmjs.com/package/@chatereum/react-e2ee
npm i @chatereum/react-e2ee
