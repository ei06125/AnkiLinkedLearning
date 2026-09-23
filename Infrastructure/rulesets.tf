resource "github_repository_ruleset" "main" {
  name        = "Protect main"
  repository  = var.repository_name
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["refs/heads/main"]
      exclude = []
    }
  }

  rules {
    deletion                = true
    non_fast_forward        = true
    required_linear_history = true

    pull_request {
      required_approving_review_count   = var.required_approvals
      dismiss_stale_reviews_on_push     = true
      required_review_thread_resolution = true
      allowed_merge_methods             = ["squash", "rebase"]
    }

    required_status_checks {
      strict_required_status_checks_policy = true

      required_check {
        context        = "verify"
        integration_id = 15368
      }

      required_check {
        context        = "secrets"
        integration_id = 15368
      }

      required_check {
        context        = "Approved label"
        integration_id = 15368
      }
    }
  }
}

resource "github_repository_ruleset" "tags" {
  name        = "Protect tags"
  repository  = var.repository_name
  target      = "tag"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["~ALL"]
      exclude = []
    }
  }

  rules {
    update           = true
    deletion         = true
    non_fast_forward = true
  }
}
