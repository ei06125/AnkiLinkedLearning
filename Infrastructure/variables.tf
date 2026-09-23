variable "github_owner" {
  description = "GitHub account that owns the repository."
  type        = string
  default     = "ei06125"
}

variable "repository_name" {
  description = "Existing repository to protect; Terraform does not create or own it."
  type        = string
  default     = "AnkiLinkedLearning"
}

variable "required_approvals" {
  description = "Independent PR approvals required. Zero supports a solo maintainer."
  type        = number
  default     = 0

  validation {
    condition     = var.required_approvals >= 0 && var.required_approvals <= 6 && floor(var.required_approvals) == var.required_approvals
    error_message = "required_approvals must be an integer between 0 and 6."
  }
}
