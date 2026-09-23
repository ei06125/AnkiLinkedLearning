terraform {
  required_version = ">= 1.5, < 2.0"

  cloud {
    organization = "ei06125-tf-org"

    workspaces {
      name = "AnkiLinkedLearning"
    }
  }

  required_providers {
    github = {
      source  = "integrations/github"
      version = "6.13.0"
    }
  }
}

provider "github" {
  owner = var.github_owner
}
