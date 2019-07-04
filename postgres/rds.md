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

Otherwise, here's how I create db subnet group and security group in the new VPC using terraform

1. Create a subnet first. In this case I prefer a multi zone subnet.

```terraform
locals {
  az_names     = "${sort(data.aws_availability_zones.available.names)}"
}

# Create subnets
resource "aws_subnet" "db" {
  count                   = "${length(local.az_names)}"
  vpc_id                  = "${data.aws_vpc.rds_vpc.id}"
  cidr_block              = "${element(local.db_cidr_blocks, count.index)}"
  availability_zone       = "${element(local.az_names, count.index)}"
  map_public_ip_on_launch = false
  tags {
    "Name"              = "DB subnet ${element(split(",", local.az_letters_csv), count.index)}"
  }
}
```

2. Create a db subnet group and use the subnets you created. This is what the database instance will actually use.
```terraform
resource "aws_db_subnet_group" "db-master-subnet-group" {
  description = "Database subnet group for my cluster"
  name_prefix = "db"
  subnet_ids = ["${aws_subnet.db.*.id}"]
  tags {
    "Name" = "db-main"
  }
}
```

3. Of course, don't forget it to associate it in your route table
```terraform
resource "aws_route_table_association" "db-assoc" {
  count          = "${length(local.az_names)}"
  route_table_id = "${module.k8s.public_route_table_id}"
  subnet_id      = "${element(aws_subnet.db.*.id, count.index)}"
}
```

4. Create a security group
```terraform
resource "aws_security_group" "db-main" {
  name        = "db-main-${var.environment}"
  vpc_id      = "${aws_vpc.main_vpc.id}"
  description = "SG for DB"

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["${aws_vpc.main_vpc.cidr_block}"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags {
    Name = "allow_db"
  }
}
```
