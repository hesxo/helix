# Grafana (Helix)

## Apply / refresh

```bash
kubectl apply -f infra/observability/grafana/
kubectl rollout restart deployment/grafana -n helix
```

## Loki datasource

`configmap-datasources.yaml` provisions **Loki** at `http://loki:3100` (in-cluster). Use this datasource in panels — a manually added datasource pointing at `localhost` will fail from inside the Grafana pod.

## Helix Overview dashboard

`helix-overview` includes:

1. **Helix Live Logs (api-gateway 404)** — `{namespace="helix", container="api-gateway"} |= "route not found"`
2. **Helix api-gateway (all logs)** — confirms Promtail/Loki wiring if panel (1) is empty (generate traffic / widen time range).

After changing dashboards, restart Grafana so provisioning reloads.
