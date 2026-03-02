## Local-only deployment runbook

This repo includes infrastructure scaffolding only. These commands are examples and
should be run **only after** you replace all `CHANGE_ME` values.

### Prereqs
- Terraform >= 1.6
- AWS CLI configured with an admin profile
- kubectl + kustomize
- Helm

### Terraform (staging)
1. Copy the tfvars file:
   - `cp infra/terraform/envs/staging/terraform.tfvars.example infra/terraform/envs/staging/terraform.tfvars`
2. Edit `terraform.tfvars` and replace all `CHANGE_ME`.
3. Initialize and apply:
   - `cd infra/terraform/envs/staging`
   - `terraform init`
   - `terraform plan -out tfplan`
   - `terraform apply tfplan`

### Terraform (production)
1. Copy the tfvars file:
   - `cp infra/terraform/envs/production/terraform.tfvars.example infra/terraform/envs/production/terraform.tfvars`
2. Edit `terraform.tfvars` and replace all `CHANGE_ME`.
3. Initialize and apply:
   - `cd infra/terraform/envs/production`
   - `terraform init`
   - `terraform plan -out tfplan`
   - `terraform apply tfplan`

### Install ingress controller + cert-manager
See `infra/k8s/INSTALL.md` for the Helm commands.

### Apply Kubernetes manifests
- Staging: `kubectl apply -k infra/k8s/overlays/staging`
- Production: `kubectl apply -k infra/k8s/overlays/production`

### Prisma migrations
Run the migration job after the API is deployed:
- `kubectl -n sensehub-production create -f infra/k8s/base/prisma-migrate-job.yaml`
