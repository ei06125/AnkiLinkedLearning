output "main_ruleset_id" {
  description = "GitHub ruleset ID protecting main."
  value       = github_repository_ruleset.main.ruleset_id
}

output "tags_ruleset_id" {
  description = "GitHub ruleset ID protecting existing tags."
  value       = github_repository_ruleset.tags.ruleset_id
}

output "semantic_version_tags_ruleset_id" {
  description = "GitHub ruleset ID enforcing semantic version tag names."
  value       = github_repository_ruleset.semantic_version_tags.ruleset_id
}

output "conventional_branches_ruleset_id" {
  description = "GitHub ruleset ID enforcing conventional branch prefixes."
  value       = github_repository_ruleset.conventional_branches.ruleset_id
}
