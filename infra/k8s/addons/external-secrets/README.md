## External Secrets Operator example

These examples assume AWS Secrets Manager. Replace `CHANGE_ME` values.

Apply after installing the External Secrets Operator:
- `kubectl apply -f infra/k8s/addons/external-secrets/secretstore.yaml`
- `kubectl apply -f infra/k8s/addons/external-secrets/externalsecret.yaml`
