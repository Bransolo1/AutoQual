## Kubernetes add-ons install notes

These commands assume you have access to the cluster and Helm installed.

### AWS Load Balancer Controller (EKS)
```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace kube-system \
  --set clusterName=autoqual \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### cert-manager
```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

### External Secrets Operator
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace
```
