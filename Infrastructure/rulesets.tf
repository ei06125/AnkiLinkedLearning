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

resource "github_repository_ruleset" "semantic_version_tags" {
  name        = "Enforce semantic version tags"
  repository  = var.repository_name
  target      = "tag"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["~ALL"]
      exclude = ["refs/tags/v[0-9]*.[0-9]*.[0-9]*"]
    }
  }

  rules {
    creation = true
  }
}

resource "github_repository_ruleset" "conventional_branches" {
  name        = "Enforce conventional branch prefixes"
  repository  = var.repository_name
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["~ALL"]
      exclude = [
        "refs/heads/main",
        "refs/heads/master",
        "refs/heads/develop",
        "refs/heads/dev",
        "refs/heads/feature/*",
        "refs/heads/feat/*",
        "refs/heads/bugfix/*",
        "refs/heads/fix/*",
        "refs/heads/hotfix/*",
        "refs/heads/release/*",
        "refs/heads/chore/*",
        "refs/heads/ai/*",
        "refs/heads/claude/*",
        "refs/heads/codex/*",
        "refs/heads/copilot/*",
        "refs/heads/cursor/*",
        "refs/heads/dependabot/**/*",
      ]
    }
  }

  rules {
    creation = true
  }
}
