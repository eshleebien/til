### Generating kubectl config client certificates ###

Generate a kubectl client certificates for ~/.kube/config
This only works on kubernetes deployed using KOPS

1. Download the ```kops``` generated CA certificate and signing key from S3
* ```s3://kops-state-store/{your_cluster_fqdn}/pki/private/ca/*.key```
* ```s3://kops-state-store/{your_cluster_fqdn}/pki/private/ca/*.crt```

2. Generate client key: ```openssl genrsa -out client-key.pem 2048```
3. Generate a CSR without prompt with subject: CN (Common Name) {your_cluster_fqdn}:

```
openssl req -new \
-key client-key.pem \
-out client-csr.pem \
-subj "/CN={your_cluster_fqdn}"
```

4. Generate a client certificate:
```
openssl x509 -req \
-in client-csr.pem \
-CA ~/Downloads/*.crt \
-CAkey ~/Downloads/*.key \
-CAcreateserial \
-out client-crt.pem \
-days 10000
```

5. Base64 encode the client key, client certificate and CA ceritifcate and populate in your ~/.kube/config
6. the password for admin username can be found in ```/srv/kubernetes/basic_auth.csv```

```
apiVersion: v1
clusters:
- cluster:
    insecure-skip-tls-verify: true
    server: {your_cluster_entrypoint}
  name: {your_cluster_fqdn}
contexts:
- context:
    cluster: {your_cluster_fqdn}
    user: {your_cluster_fqdn}
  name: {your_cluster_fqdn}
current-context: {your_cluster_fqdn}
kind: Config
preferences: {}
users:
- name: {your_cluster_fqdn}
  user:
    client-certificate-data: {base64-encoded-client-certificate}
    client-key-data: {base64-encoded-client-key}
    password: {admin-password}
    username: admin
- name: {your_cluster_fqdn}-basic-auth
  user:
    password: {admin-password}
    username: admin
```
