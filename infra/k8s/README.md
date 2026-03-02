## Kubernetes manifests

Base manifests live in `infra/k8s/base`. Environment overlays live in `infra/k8s/overlays`.

### Apply staging
`kubectl apply -k infra/k8s/overlays/staging`

### Apply production
`kubectl apply -k infra/k8s/overlays/production`

### Notes
- Update image tags in overlays or wire to GitOps.
- Replace placeholder secrets before apply.
- Ingress assumes nginx and cert-manager.

### Add-ons
- Install notes: `infra/k8s/INSTALL.md`
- External Secrets examples: `infra/k8s/addons/external-secrets/README.md`
- CronJobs: `infra/k8s/addons/cronjobs/retention.yaml`
