output "prometheus_service_name" {
  description = "Prometheus service name"
  value       = helm_release.prometheus_operator.name
}

output "grafana_service_name" {
  description = "Grafana service name"
  value       = helm_release.prometheus_operator.name
}

output "alertmanager_service_name" {
  description = "Alertmanager service name"
  value       = helm_release.prometheus_operator.name
}

output "loki_service_name" {
  description = "Loki service name"
  value       = helm_release.loki.name
}

output "tempo_service_name" {
  description = "Tempo service name"
  value       = helm_release.tempo.name
}
