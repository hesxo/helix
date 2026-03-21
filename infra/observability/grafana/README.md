# Grafana (Helix)

## Apply / refresh

```bash
kubectl apply -f infra/observability/grafana/
kubectl rollout restart deployment/grafana -n helix
kubectl rollout status deployment/grafana -n helix
```

## Datasource URLs (critical)

Grafana runs **inside the cluster**. Data sources must use **Kubernetes DNS**, not your laptop:

| Datasource  | Correct URL              | Wrong (causes “Failed to fetch”) |
|------------|---------------------------|----------------------------------|
| Prometheus | `http://prometheus:9090`  | `http://localhost:9090`          |
| Loki       | `http://loki:3100`        | `http://localhost:3100`          |
| Tempo      | `http://tempo:3200`       | `http://localhost:3200`          |

`configmap-datasources.yaml` provisions Prometheus and Loki with the **correct** URLs. If panels show **“Failed to fetch”** (not “No data”), re-apply this ConfigMap, restart Grafana, then **Connections → Data sources → Save & test**.

Check what the cluster has:

```bash
kubectl get configmap grafana-datasources -n helix -o yaml | rg 'url:'
```

## Loki datasource

Provisioned at `http://loki:3100`. Do not add a second Loki entry aimed at `localhost` from the UI.

## Helix Overview dashboard

`helix-overview` includes:

1. **Helix Live Logs (api-gateway 404)** — `{namespace="helix", container="api-gateway"} |= "route not found"`
2. **Helix api-gateway (all logs)** — confirms Promtail/Loki wiring if panel (1) is empty (generate traffic / widen time range).

After changing dashboards, restart Grafana so provisioning reloads.
