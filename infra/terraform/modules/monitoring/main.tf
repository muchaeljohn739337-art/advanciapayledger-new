terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }
}

provider "aws" {
  region = var.region
}

data "aws_eks_cluster" "cluster" {
  name = var.cluster_name
}

data "aws_eks_cluster_auth" "cluster_auth" {
  name = var.cluster_name
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster_auth.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster_auth.token
  }
}

resource "helm_release" "prometheus_operator" {
  name       = "kube-prometheus-stack"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = "observability"
  version    = "51.8.0"

  create_namespace = true

  set {
    name  = "prometheusOperator.enabled"
    value = "true"
  }

  set {
    name  = "prometheusOperator.createCustomResource"
    value = "true"
  }

  set {
    name  = "prometheus.enabled"
    value = "true"
  }

  set {
    name  = "prometheus.service.type"
    value = "ClusterIP"
  }

  set {
    name  = "prometheus.serviceMonitorSelectorNilUsesHelmValues"
    value = "false"
  }

  set {
    name  = "prometheus.serviceMonitorSelectorMatchLabels"
    value = yamlencode({
      release = "kube-prometheus-stack"
    })
  }

  set {
    name  = "prometheus.retention"
    value = "30d"
  }

  set {
    name  = "prometheus.storageSpec.volumeClaimTemplate.spec.storageClassName"
    value = var.storage_class_name
  }

  set {
    name  = "prometheus.storageSpec.volumeClaimTemplate.spec.resources.requests.storage"
    value = "50Gi"
  }

  set {
    name  = "prometheus.resources.requests.memory"
    value = "2Gi"
  }

  set {
    name  = "prometheus.resources.requests.cpu"
    value = "1000m"
  }

  set {
    name  = "prometheus.resources.limits.memory"
    value = "4Gi"
  }

  set {
    name  = "prometheus.resources.limits.cpu"
    value = "2000m"
  }

  set {
    name  = "grafana.enabled"
    value = "true"
  }

  set {
    name  = "grafana.service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "grafana.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-type"
    value = "nlb"
  }

  set {
    name  = "grafana.adminPassword"
    value = var.grafana_admin_password
  }

  set {
    name  = "grafana.persistence.enabled"
    value = "true"
  }

  set {
    name  = "grafana.persistence.storageClassName"
    value = var.storage_class_name
  }

  set {
    name  = "grafana.persistence.size"
    value = "10Gi"
  }

  set {
    name  = "grafana.sidecar.datasources.enabled"
    value = "true"
  }

  set {
    name  = "grafana.sidecar.dashboards.enabled"
    value = "true"
  }

  set {
    name  = "grafana.sidecar.dashboards.searchNamespace"
    value = "ALL"
  }

  set {
    name  = "alertmanager.enabled"
    value = "true"
  }

  set {
    name  = "alertmanager.service.type"
    value = "ClusterIP"
  }

  set {
    name  = "alertmanager.persistence.enabled"
    value = "true"
  }

  set {
    name  = "alertmanager.persistence.storageClassName"
    value = var.storage_class_name
  }

  set {
    name  = "alertmanager.persistence.size"
    value = "2Gi"
  }

  set {
    name  = "nodeExporter.enabled"
    value = "true"
  }

  set {
    name  = "kubeStateMetrics.enabled"
    value = "true"
  }

  set {
    name  = "kubelet.enabled"
    value = "true"
  }

  set {
    name  = "defaultRules.enabled"
    value = "true"
  }

  set {
    name  = "defaultRules.rules.etcd"
    value = "false"
  }

  set {
    name  = "defaultRules.rules.kubeScheduler"
    value = "false"
  }

  set {
    name  = "defaultRules.rules.kubeControllerManager"
    value = "false"
  }
}

resource "helm_release" "loki" {
  name       = "loki"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki"
  namespace  = "observability"
  version    = "4.8.0"

  create_namespace = true

  set {
    name  = "loki.storage.type"
    value = "filesystem"
  }

  set {
    name  = "loki.storage.filesystem.chunks_directory"
    value = "/loki/chunks"
  }

  set {
    name  = "loki.storage.filesystem.rules_directory"
    value = "/loki/rules"
  }

  set {
    name  = "loki.persistence.enabled"
    value = "true"
  }

  set {
    name  = "loki.persistence.storageClassName"
    value = var.storage_class_name
  }

  set {
    name  = "loki.persistence.size"
    value = "20Gi"
  }

  set {
    name  = "loki.resources.requests.memory"
    value = "1Gi"
  }

  set {
    name  = "loki.resources.requests.cpu"
    value = "500m"
  }

  set {
    name  = "loki.resources.limits.memory"
    value = "2Gi"
  }

  set {
    name  = "loki.resources.limits.cpu"
    value = "1000m"
  }
}

resource "helm_release" "promtail" {
  name       = "promtail"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "promtail"
  namespace  = "observability"
  version    = "6.15.3"

  create_namespace = true

  set {
    name  = "config.clients[0].url"
    value = "http://loki.observability.svc.cluster.local:3100/loki/api/v1/push"
  }

  set {
    name  = "resources.requests.memory"
    value = "256Mi"
  }

  set {
    name  = "resources.requests.cpu"
    value = "100m"
  }

  set {
    name  = "resources.limits.memory"
    value = "512Mi"
  }

  set {
    name  = "resources.limits.cpu"
    value = "200m"
  }
}

resource "helm_release" "tempo" {
  name       = "tempo"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "tempo"
  namespace  = "observability"
  version    = "1.3.1"

  create_namespace = true

  set {
    name  = "tempo.storage.trace.backend"
    value = "local"
  }

  set {
    name  = "tempo.storage.trace.local.path"
    value = "/var/tempo/traces"
  }

  set {
    name  = "tempo.persistence.enabled"
    value = "true"
  }

  set {
    name  = "tempo.persistence.storageClassName"
    value = var.storage_class_name
  }

  set {
    name  = "tempo.persistence.size"
    value = "10Gi"
  }

  set {
    name  = "tempo.resources.requests.memory"
    value = "512Mi"
  }

  set {
    name  = "tempo.resources.requests.cpu"
    value = "250m"
  }

  set {
    name  = "tempo.resources.limits.memory"
    value = "1Gi"
  }

  set {
    name  = "tempo.resources.limits.cpu"
    value = "500m"
  }
}

resource "kubernetes_config_map" "grafana_dashboards" {
  metadata {
    name      = "advancia-dashboards"
    namespace = "observability"
    labels = {
      grafana_dashboard = "1"
    }
  }

  data = {
    "advancia-overview.json" = file("${path.module}/dashboards/advancia-overview.json")
    "advancia-services.json" = file("${path.module}/dashboards/advancia-services.json")
    "advancia-infrastructure.json" = file("${path.module}/dashboards/advancia-infrastructure.json")
  }
}

resource "kubernetes_secret" "alertmanager_config" {
  metadata {
    name      = "alertmanager-config"
    namespace = "observability"
  }

  data = {
    "alertmanager.yml" = yamlencode({
      global = {
        smtp_smarthost = var.smtp_host
        smtp_from      = var.smtp_from
      }
      route = {
        group_by        = ["alertname", "job"]
        group_wait      = "30s"
        group_interval  = "5m"
        repeat_interval = "12h"
        receiver        = "default"
        routes = [
          {
            match = {
              severity = "critical"
            }
            receiver = "critical-alerts"
          },
          {
            match = {
              severity = "warning"
            }
            receiver = "warning-alerts"
          }
        ]
      }
      receivers = [
        {
          name = "default"
          email_configs = [
            {
              to = var.default_email
              subject = "[Advancia] {{ .GroupLabels.alertname }} - {{ .Status }}"
              body = templatefile("${path.module}/templates/alert-email.tmpl", {
                . = .
              })
            }
          ]
        },
        {
          name = "critical-alerts"
          email_configs = [
            {
              to = var.critical_email
              subject = "[CRITICAL] Advancia Alert: {{ .GroupLabels.alertname }}"
              body = templatefile("${path.module}/templates/critical-alert-email.tmpl", {
                . = .
              })
            }
          ]
        },
        {
          name = "warning-alerts"
          email_configs = [
            {
              to = var.warning_email
              subject = "[WARNING] Advancia Alert: {{ .GroupLabels.alertname }}"
              body = templatefile("${path.module}/templates/warning-alert-email.tmpl", {
                . = .
              })
            }
          ]
        }
      ]
    })
  }

  depends_on = [helm_release.prometheus_operator]
}
