### RDS
This is everything I learned about postgres running on RDS.


### Read replica on different VPC but same region
We recently had a scenario wherein we have a huge RDS cluster and we want to migrate it into same region but different VPC.
AWS supported that but not by using console by the time of this writing. You must also have a newer version of awscli. To do that,

Assuming there is already a db subnet group and security group in the new VPC,

```shell
$ aws --version # make sure it is 1.16 and up
  aws-cli/1.16.192 Python/3.7.3 Darwin/18.2.0 botocore/1.12.182
$ /aws rds create-db-instance-read-replica \
  --db-instance-identifier main-db \
  --source-db-instance-identifier [arn resource url of the source] \
  --db-subnet-group-name [subnet in a different VPC] \
  --vpc-security-group-ids [security group in a different VPC]
```
