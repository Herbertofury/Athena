terraform {
  required_version = ">= 1.12.0, < 2.0.0"
}
resource "terraform_data" "learning_note" {
  input = "A local-only learning example. No cloud resources."
}
output "note" {
  value = terraform_data.learning_note.output
}
