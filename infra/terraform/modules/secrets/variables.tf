variable "name" {
  type = string
}

variable "database_secret_json" {
  type      = string
  sensitive = true
}

variable "app_secret_json" {
  type      = string
  sensitive = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
