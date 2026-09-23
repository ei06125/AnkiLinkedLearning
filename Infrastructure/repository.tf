resource "github_repository" "settings" {
  name = var.repository_name

  allow_auto_merge       = true
  allow_merge_commit     = false
  allow_rebase_merge     = true
  allow_squash_merge     = true
  allow_update_branch    = true
  delete_branch_on_merge = true
  has_issues             = true
  has_projects           = true
  has_wiki               = true

  lifecycle {
    prevent_destroy = true
  }
}

import {
  to = github_repository.settings
  id = "AnkiLinkedLearning"
}
