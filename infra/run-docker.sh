#!/usr/bin/env bash
set -e

npx vite build --outDir infra/dist/www/

TAG=${TAG:=$(git rev-parse HEAD)}
echo "Building docker image, tagging $TAG"
IMAGE_NAME="europe-west3-docker.pkg.dev/healthy-saga-329513/sltech-briq/briq-builder:$TAG"

docker build infra/ -t "$IMAGE_NAME"
docker push "$IMAGE_NAME"
# Tag the image as 'latest' locally
docker tag "$IMAGE_NAME" briq-builder:latest
# Cleanup
docker image rm "$IMAGE_NAME"