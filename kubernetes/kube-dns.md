### Distributing your DNS queries to different DNS servers ###


In AWS VPC, when ```enableDnsHostnames``` and ```enableDnsSupport``` are both set to true, ec2 instances will get an Amazon-provided nameserver in their ```/etc/resolv.conf```.
That might not be enough depending on the traffic. Also, each EC2 instance limits the number of packets that can be sent to the Amazon-provided DNS server to a maximum of 1024 packets per seconds per network interface. [#Ref](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-dns.html).

So distributing DNS queries to different DNS servers including your private hosted zones can be a great help. We can do this by configuring dnsmasq in kube-dns.

KubeDNS has 3 containers
- dnsmasq - a DNS forwarder. It acts as a frontend and a cache for the kube-dns container.
- kube-dns - DNS server that resolves internal kubernetes dns requests.
- sidecar - performs health check.

Put these args in dnsmasq container
```
    spec:
      containers:
      - args:
        - -v=2
        - -logtostderr
        - -configDir=/etc/k8s/dns/dnsmasq-nanny
        - -restartDnsmasq=true
        - --
        - -k
        - --cache-size=10000
        - --dns-forward-max=150
        - --no-negcache
        - --log-facility=-
        - --log-queries
        - --server=/cluster.local/127.0.0.1#10053
        - --server=/in-addr.arpa/127.0.0.1#10053
        - --server=/in6.arpa/127.0.0.1#10053
        - --server=/internal.yourdomain.com/172.30.0.2
        - --server=8.8.8.8
        - --server=8.8.4.4
        - --server=169.254.169.253
        - -R
        - --address=/org.cluster.local/org.svc.cluster.local/org.default.svc.cluster.local/com.cluster.local/com.svc.cluster.local/com.default.svc.cluster.local/net.cluster.local/net.svc.cluster.local/net.default.svc.cluster.local/svc.svc.cluster.local/local.vpc/
```
```

```--server=/cluster.local/127.0.0.1#10053``` is one of the default configuration in dnsmasq. This means that all request that has .cluster.local suffix, will go to kube-dns container listening in port 10053.
```--server=/internal.yourdomain.com/172.30.0.2``` if you have a private hosted zone associated in your VPC you want to resolve within your kubernetes cluster. Make sure the ```172.30.0.2``` corresponds to AWS-provided DNS server.
```--server=8.8.8.8``` and ```--server=8.8.4.4``` send the rest to google's public dns servers.
```--server=169.254.169.253``` send some also to aws' public dns server.
```--address=//``` are never forwarded. Read more [here](http://www.thekelleys.org.uk/dnsmasq/docs/dnsmasq-man.html).
