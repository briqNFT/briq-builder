#!/usr/bin/env bash
set -e

MODE=$([ "${K8S_ENV}" = "test" ] && echo "staging" || echo "production")

npx vite build --outDir infra/dist/www/ -m $MODE
npx vite build --outDir infra/dist/server/ --ssr server/main.ts -m $MODE

NAME="briq-builder"
TAG=${TAG:=$(git rev-parse HEAD)}
echo "Building docker image, tagging $TAG"
IMAGE_NAME="europe-west3-docker.pkg.dev/healthy-saga-329513/sltech-briq/$NAME:$TAG"

docker build --platform linux/amd64 infra/ -f infra/Dockerfile_nginx -t "$IMAGE_NAME"
docker push "$IMAGE_NAME"
# Tag the image as 'latest' locally
docker tag "$IMAGE_NAME" "$NAME:latest"
# Cleanup
docker image rm "$IMAGE_NAME"


NAME="briq-builder-node"
TAG=${TAG:=$(git rev-parse HEAD)}
echo "Building docker image, tagging $TAG"
IMAGE_NAME="europe-west3-docker.pkg.dev/healthy-saga-329513/sltech-briq/$NAME:$TAG"

docker build --platform linux/amd64 . -f infra/Dockerfile_node  -t "$IMAGE_NAME"
docker push "$IMAGE_NAME"
# Tag the image as 'latest' locally
docker tag "$IMAGE_NAME" "$NAME:latest"
# Cleanup
docker image rm "$IMAGE_NAME"
