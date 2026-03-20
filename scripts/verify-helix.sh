#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-helix}"
API_BASE="${2:-http://localhost:8090}"
FRONTEND_BASE="${3:-http://localhost:4173}"

echo "==> Checking rollout status"
kubectl rollout status deployment/api-gateway -n "$NAMESPACE"
kubectl rollout status deployment/user-service -n "$NAMESPACE"
kubectl rollout status deployment/order-service -n "$NAMESPACE"
kubectl rollout status deployment/frontend -n "$NAMESPACE"

echo "==> Checking pod state"
kubectl get pods -n "$NAMESPACE"

echo "==> Smoke testing gateway and services"
curl -fsS "$API_BASE/"
curl -fsS "$API_BASE/health"
curl -fsS "$API_BASE/api/users/1"
curl -fsS "$API_BASE/api/orders/1"

echo
echo "==> Smoke testing frontend"
curl -fsSI "$FRONTEND_BASE"

echo
echo "Verification passed"
