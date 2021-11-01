#!/usr/bin/env bash
set -e

#[ -z "$(git status --porcelain)" ] || echo "Git must be clean" && exit 1
#exit 0

export TAG=${TAG:=$(git rev-parse HEAD)}
infra/run-docker.sh
infra/render.sh
kubectl apply -f infra/dist/manifests.yaml --validate=true
