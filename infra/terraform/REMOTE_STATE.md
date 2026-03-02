## Terraform remote state (AWS S3 + DynamoDB)

Create a bucket and DynamoDB table for state locking.

### Example (run once)
```bash
aws s3api create-bucket --bucket autoqual-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket autoqual-terraform-state --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name autoqual-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### Backend block (example)
Add this to `infra/terraform/envs/*/main.tf` after creation:
```
terraform {
  backend "s3" {
    bucket         = "autoqual-terraform-state"
    key            = "autoqual/staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "autoqual-terraform-locks"
    encrypt        = true
  }
}
```
