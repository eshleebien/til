### Run chef recipes in travis CI ###

In Gengo we uses chef template resource to generate our kubernetes deployment yaml files.
There are certain scenarios of failed deployment due to failures in rendering the template.
We use TravisCI for our pull requests checks so why not use it to test the template first before merging the changes into our master branch.

The key here is to run ```chef-solo``` in the localhost so you need a solo config file that points all node, role, data_bag, cookbookk paths to correct folders.
That can be something like this ```solo-test.rb```

```ruby

base = File.expand_path('..', __FILE__)

nodes_path                File.join(base, '/../nodes')
role_path                 File.join(base, '/../roles')
data_bag_path             File.join(base, '/../data_bags')
encrypted_data_bag_secret File.join(base, '/../data_bag_key')
environment_path          File.join(base, '/../environments')

ssl_verify_mode           :verify_peer
solo_legacy_mode          true
log_level                 :error
enable_reporting          true

cookbook_path []
cookbook_path << File.join(base, '/../cookbooks')
```

In ```.travis.yml```,
```yml
dist: xenial
sudo: true
install:
  - "curl -L https://omnitruck.chef.io/install.sh | sudo bash -s -- -v 14.7.17"
script:
  - "chmod +x run_tests.sh"
  - "./run_tests.sh"
```

You can have something like this in your ```run_test.sh```

```bash
chef-solo -c ../path/to/your/solo-test.rb -E staging -o your-cookbooks::recipe || exit 1
```

#### Multiple chef recipes running in parallel ####
Sometimes you may want to run multiple chef recipes. That could be slow especially when running it in travis so you might want to execute them in parallel.
You can do this by specifying a ```--lockfile``` and some tricks

```bash
chef-solo --lockfile /tmp/chef-1.pid -c ../path/to/your/solo-test.rb -E staging -o your-cookbooks::recipe >> /tmp/chef.log 2>&1 || exit 1 &
chef-solo --lockfile /tmp/chef-2.pid -c ../path/to/your/solo-test.rb -E live -o your-cookbooks::recipe >> /tmp/chef.log 2>&1 || exit 1 &
chef-solo --lockfile /tmp/chef-3.pid -c ../path/to/your/solo-test.rb -E dev -o your-cookbooks::recipe >> /tmp/chef.log 2>&1 || exit 1 &
wait

has_errors = `grep -rn "ERROR" /tmp/chef.log`
if [ ! -z "$has_errors" ]; then
  echo -e "Error occured"
  cat /tmp/chef.log
  rm /tmp/chef.log
  exit 1
fi
```

The ```--lockfile``` allows chef to run in a separate lock file so it does not wait until the previous command is finished.
And as you know, adding ```&``` in your command will send the process at the background. So adding it allows us to run them in parallel.
However, we need to log the output from a file and we want to wait for all of them to finish.
Once it's done, we can just check the log file for errors.
