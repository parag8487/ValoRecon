terraform {
  required_version = ">= 1.6.0"

  # Remote state, as a PARTIAL configuration: the type is declared here, and the bucket, key and region
  # are supplied at init time with `tofu init -backend-config=backend.hcl`. Local state means a
  # colleague's `apply` cannot see what yours created, and two concurrent applies corrupt each other.
  #
  # Swap `s3` for `gcs`, `azurerm` or any other supported backend — what matters is that state is not
  # sitting in one working copy.
  backend "s3" {}

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

variable "namespace" {
  description = "Namespace to deploy valorecon into."
  type        = string
  default     = "valorecon"
}

variable "image" {
  description = "Fully qualified image reference for valorecon."
  type        = string
  default     = "valorecon:0.1.0"
}

variable "replicas" {
  description = "Number of pod replicas."
  type        = number
  default     = 1
}

variable "container_port" {
  description = "Port the container listens on."
  type        = number
  default     = 8799
}

resource "kubernetes_namespace" "app" {
  metadata {
    name = var.namespace
  }
}

resource "kubernetes_deployment" "app" {
  metadata {
    name      = "valorecon"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        "app.kubernetes.io/name" = "valorecon"
      }
    }

    template {
      metadata {
        labels = {
          "app.kubernetes.io/name" = "valorecon"
        }
      }

      spec {
        security_context {
          run_as_non_root = true
          run_as_user     = 1001
        }

        container {
          name  = "valorecon"
          image = var.image

          port {
            container_port = var.container_port
          }

          security_context {
            allow_privilege_escalation = false
          }
        }
      }
    }
  }
}

output "namespace" {
  description = "Namespace valorecon was deployed into."
  value       = kubernetes_namespace.app.metadata[0].name
}
