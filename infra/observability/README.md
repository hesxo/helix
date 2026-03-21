# Helix observability (Prometheus + Grafana)

Apply into the `helix` namespace (after core stack is running):

```bash
kubectl apply -f infra/observability/prometheus/
kubectl apply -f infra/observability/grafana/
kubectl get pods -n helix | grep -E 'prometheus|grafana'
```

## Prometheus

- Scrapes **`api-gateway:80`**, **`user-service:80`**, **`order-service:80`** at path `/metrics`.
- UI: port-forward then open <http://localhost:9090>

```bash
kubectl port-forward -n helix svc/prometheus 9090:9090
```

## Grafana

- Default admin user: **`admin`**
- Default password: **`helix`** (change for anything beyond local demo)
- Prometheus datasource is provisioned at **`http://prometheus:9090`** (in-cluster DNS).

```bash
kubectl port-forward -n helix svc/grafana 3000:3000
```

Open <http://localhost:3000>, sign in, then **Explore** or build dashboards using the Prometheus datasource.

## Example queries

- Request rate: `rate(helix_api_gateway_requests_total[1m])`
- Error rate: `rate(helix_api_gateway_requests_total{status_code=~"5.."}[1m])`
- p95 latency: `histogram_quantile(0.95, sum(rate(helix_api_gateway_request_duration_seconds_bucket[5m])) by (le))`

> **Note:** `container_*` and node cAdvisor metrics require a full kubelet/cAdvisor scrape config or a metrics stack that exposes them; this minimal Prometheus only scrapes the three app services.
