## ArgoCD GitOps

### Install ArgoCD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Apply app definitions
Replace `CHANGE_ME_REPO_URL` and `CHANGE_ME_REVISION` in the manifests.

- `kubectl apply -n argocd -f infra/gitops/argocd/apps/staging.yaml`
- `kubectl apply -n argocd -f infra/gitops/argocd/apps/production.yaml`
