#!/usr/bin/env bash
# Deploys this repo to a local Minikube cluster for manual testing.
#
# GitHub Actions runners can't reach a Minikube instance running on your
# machine, so this is a local-only counterpart to the CI "Deploy to
# Kubernetes" job (.github/workflows/ci.yaml), not something CI calls.
#
# It builds the image straight into Minikube's own Docker daemon (so no
# registry push is needed for local testing) and overrides imagePullPolicy
# to IfNotPresent for this deploy only -- the committed manifest keeps
# "Always", which is correct once a real image is pushed to a registry.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAMESPACE="devsecops"
DEPLOYMENT="enterprise-devsecops"
CONTAINER="enterprise-devsecops"
LOCAL_IMAGE="enterprise-devsecops-pipeline:local"

for cmd in minikube kubectl docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required but not found on PATH." >&2
    exit 1
  fi
done

if ! minikube status >/dev/null 2>&1; then
  echo "==> Starting Minikube..."
  minikube start
fi

echo "==> Building image into Minikube's Docker daemon..."
eval "$(minikube -p minikube docker-env)"
docker build -f "$REPO_ROOT/docker/Dockerfile" -t "$LOCAL_IMAGE" "$REPO_ROOT"

echo "==> Applying manifests (namespace first, so dependent resources don't fail)..."
kubectl apply -f "$REPO_ROOT/kubernetes/namespace.yaml"
kubectl apply -f "$REPO_ROOT/kubernetes/"

echo "==> Pointing the Deployment at the locally-built image..."
kubectl set image "deployment/$DEPLOYMENT" "$CONTAINER=$LOCAL_IMAGE" -n "$NAMESPACE"
kubectl patch "deployment/$DEPLOYMENT" -n "$NAMESPACE" --type=json -p \
  "[{\"op\":\"replace\",\"path\":\"/spec/template/spec/containers/0/imagePullPolicy\",\"value\":\"IfNotPresent\"}]"

echo "==> Waiting for rollout..."
kubectl rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE" --timeout=180s

cat <<EOF

==> Deployed. To reach the app:

  kubectl port-forward -n $NAMESPACE svc/enterprise-devsecops-service 8080:80

  then: curl http://localhost:8080/health

To use the Ingress instead:
  minikube addons enable ingress
  echo "\$(minikube ip) devsecops.local" | sudo tee -a /etc/hosts
  curl http://devsecops.local/health

To watch autoscaling (requires the metrics-server addon):
  minikube addons enable metrics-server
  kubectl get hpa -n $NAMESPACE --watch
EOF
