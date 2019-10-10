Note: This is for etcd 2.2 version.

## Creating a backup
```bash
etcdctl backup --data-dir /etc/etcd/data --backup-dir=<your-backup-directory>
tar cvfz cluster-name-backup.tar.gz <your-backup-directory>
```

## Restoring a backup
The backup contains information about the previous members of the cluster so we need to force create a new cluster to use it.

```bash

$ tar xvfz cluster-name-backup.tar.gz <your-temporary-backup-directory>
$ etcd --data-dir <your-temporary-backup-directory> --force-new-cluster
```

after its loaded, kill the process and then move the backup to its permanent location

i.e assuming your etcd data collection is in ```/etc/etcd/data```

```bash
$ pkill etcd
$ mv /etc/etcd/data/member /etc/etcd/data/member.bak
$ mv <your-temporary-backup-directory> /etc/etcd/data/
$ service etcd start # to normally start your etcdcluster
```

Now even we have the correct configuration for our etcd service, the new cluster will remain a single node cluster
so we need to manually add member. But before that, we need to change the advertise peer URLs as the ```--force-new-cluster``` option has
set it to default.

```bash
$ etcdctl member list
<etcd-member-id>: name=node2 peerURLs=http://localhost:23802 clientURLs=http://127.0.0.1:23792
<etcd-member-id>: name=node3 peerURLs=http://localhost:23803 clientURLs=http://127.0.0.1:23793
<etcd-member-id>: name=node1 peerURLs=http://localhost:23801 clientURLs=http://127.0.0.1:23791

$ etcdctl member update <etcd-member-id> http://10.0.1.10:2380
Updated member with ID <etcd-member-id> in cluster
```

## Adding a member



### Reference
https://github.com/etcd-io/etcd/blob/master/Documentation/v2/admin_guide.md#restoring-a-backup
https://github.com/etcd-io/etcd/blob/master/Documentation/v2/runtime-configuration.md#update-a-member

