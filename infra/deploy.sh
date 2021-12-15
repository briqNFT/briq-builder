#!/usr/bin/env bash
set -e

#[ -z "$(git status --porcelain)" ] || echo "Git must be clean" && exit 1
#exit 0

export TAG=${TAG:=$(git rev-parse HEAD)}
export K8S_ENV=${K8S_ENV:="test"}

infra/run-docker.sh
infra/render.sh
kubectl apply -f infra/dist/manifests-${K8S_ENV}.yaml --validate=true
