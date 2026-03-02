## Terraform (AWS) scaffolding

This scaffolding assumes AWS as the primary hosting target.

### Structure
- `modules/` reusable building blocks (network, eks, data, edge, observability, secrets)
- `envs/staging` and `envs/production` environment roots

### Usage
1. Copy `envs/staging/terraform.tfvars.example` to `terraform.tfvars` and fill values.
2. Initialize and plan:
   - `terraform init`
   - `terraform plan`
3. Apply:
   - `terraform apply`

### Notes
- All secrets are created in AWS Secrets Manager with placeholder values.
- Replace placeholder values and rotate immediately after provisioning.
- EKS ingress expects AWS Load Balancer Controller and cert-manager.
