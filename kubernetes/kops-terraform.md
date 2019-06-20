## KOPS and Terraform

Current state: Experimenting

These are the concepts I want to achieve in using kops and terraform.

### Possible directory structure
```
katana
  - modules/
      - ...different modules...
  - {environment}/
      - main.tf
      - kubernetes/
          - override.tf
          - user_data_overrides/
```

```sh
# Create VPC (optional)
terraform apply --target=module.k8svpc

# kops create cluster command that will generate kubernetes.tf
terraform apply --target=module.kops_generator.create_cluster

# If you want to add more nodes
terraform apply --target=module.kops_generator.create_ig

# applies the generated kubernetes.tf
terraform apply --target=module.k8s
```


Inside ```kops_generator``` module is a null resource that runs this
```bash
kops create cluster \
  --cloud=aws \
  --dns private \
  --authorization RBAC \
  --networking flannel \
  --zones="us-east-1a,us-east-1b,us-east-1c,us-east-1d,us-east-1e" \
  --master-zones="us-east-1a,us-east-1b,us-east-1c" \
  --node-count=3 \
  --master-size=t2.medium \
  --node-size=t2.xlarge \
  --api-loadbalancer-type=public \
  --image=${var.ami_id} \
  --kubernetes-version ${var.kubernetes_version} \
  --vpc=${var.vpc_id} \
  --target=terraform \
  --state=${var.kops_state}
  --out ${file("${path.module}/kubernetes/")} \
  ${var.cluster_name}
```

The generated ```kubernetes.tf``` isn't configurable enough. There are instances that we want to add a custom ```user_data``` into our nodes/master.
To do that, we can use terraform [override](https://www.terraform.io/docs/configuration-0-11/override.html).

kops would append in all its resource name the cluster-name in snake-case format. Something like this.
```terraform
# in kubernetes.tf
resource "aws_autoscaling_group" "master-us-east-1a-masters-your-cluster-name" {
  ...
}
```

To create an override, we use a json or a .tf format
```
# override.tf.json
{
    "resource": {
        "aws_launch_configuration": {
            "master-us-east-1a-masters-your-cluster-name": {
                "user_data": "your-custom-userdata_with_original-user-data",
            }
        }
    }
}

# or override.tf
resource "aws_autoscaling_group" "master-us-east-1a-masters-your-cluster-name" {
  user_data = "your-custom-userdata_with_original-user-data"
}
```

The idea is to create an override file from probably a template when we run the create cluster command.
