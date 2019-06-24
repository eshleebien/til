## Secrets management using SOPS, chef and bash scripting

One of our serious challenges in moving our dev environment into minikube is the kubernetes secrets.

Problems:
- We don’t have an optimized way to create, update and deploy secrets.
- We use a legacy approach in our dev environment for application credentials.
- When developers need a new secret values, they must ask devops to update it for them :disappointed:

Goals:
- Automate the kubernetes secrets deployment.
- Allow developers to manage secrets on their own but with restrictions depending on the environment.
- Commit secrets so we can at least track changes and apply versioning.
- Simple solution

Here’s a possible solution using a custom chef resources and SOPS.

Here's a new cookbook
### Directory structure
```
chef_cookbook_folder/
  metadata.rb
  - recipes/
      {secret_names}.rb
      ...
  - templates/
      - {namespace: default}/
          {secret_names}.yaml.erb
          ...
  - secrets/
      secret_editor.sh
      secrets.{environment}.sops.json
      .gitignore
      .sops.yaml
  - resources/
      - sops.rb
  - providers/
      - sops.rb
```

The folders ```recipes```, ```providers```, ```resources``` and ```templates``` folder are pretty much standard in a cookbook file.

Each secrets must have a recipe stored in the recipes folder. The filename should be the same as the kubernetes secret name. These recipes would just call the ```sops``` custom resource located in ```resources``` folder with of course an action definition in ```providers``` folder.
Example recipes/secret_name.rb
```ruby
k8s_deploy_secret_sops "secret_name" do
  git_repo "git@github.com:username/your-secret-repository.git"
  template "secret_name"
  namespace node['k8s_deploy']['namespace']
end
```

In ```resources/sops.rb```
```ruby
actions :deploy
default_action :deploy

attribute :secret_name, kind_of: String, name_attribute: true
attribute :namespace, kind_of: String, default: 'default'
attribute :git_repo, kind_of: String
attribute :git_branch, kind_of: String, default: 'heads/master'
attribute :template, kind_of: String
attribute :template_vars, kind_of: Hash, default: {}
```

Here's what the ```providers``` pretty much look like.
```ruby
require 'json'
require 'base64'

action :deploy do
  namespace = new_resource.namespace
  secret_name = new_resource.secret_name
  version = Time.now.strftime('%Y%m%d%H%M%S').to_s
  template = new_resource.template
  template_vars = new_resource.template_vars
  git_repo = new_resource.git_repo
  git_branch = new_resource.git_branch
  secrets_path = __dir__ + '/../secrets'
  yaml_dir = "/tmp"
  secret_values = '{}'

  # Just copy the encrypted file from the ```secrets``` directory in a temporary directory
  file "/tmp/#{secret_name}.sops.json" do
    content ::File.open("#{secrets_path}/secrets.#{node['app_environment']}.sops.json").read
    action :create
  end

  # ruby block that does the decryption using sops then save its output into a ruby variable
  ruby_block "deploy" do
    block do
      extend Chef::Mixin::ShellOut
      secret_values = shell_out("sops --aws-profile=#{secrets_path}/.sops.yaml -d /tmp/#{secret_name}.sops.json")
      log secret_values.stderr
    end
  end

  # Generate a secret yaml file with a Base64 encoded unencrypted values and save it to /tmp folder
  template "#{yaml_dir}/#{secret_name}.yaml" do
    source "#{namespace}/#{template}.yaml.erb"
    sensitive true # very important
    variables lazy {
      {
        namespace: namespace,
        version: version,
        vars: JSON.parse(secret_values.stdout)[secret_name]
      }
    }
  end

  # kubectl apply the secret here
  execute "kubectl apply -n#{namespace} -f #{yaml_dir}/#{secret_name}.yaml" do
    user 'root'
    group 'root'
    command "kubectl apply -n#{namespace} -f #{yaml_dir}/#{secret_name}.yaml"
  end

  # delete the generated file from erb template
  file "#{yaml_dir}/#{secret_name}.yaml" do
    action: delete
  end
end
```

In summary the ```sops``` provider  does the ff.
1. Copy the file from secrets folder into a temporary directory.
2. Decrypt that file and output its content into stdout
3. Capture the stdout output and put it into a ruby variable then use it as template variables
4. Base64 encode the values inside the template.
5. Deploy the secret yaml file.

Here's how the secret json file looks like.
```json
{
	"secret_name": {
		"key": "ENC[AES256_GCM,data:zieSq9tPgSnhJhGOGpiN,iv:qOi4IUUz48e5yYjREzLfd42Emv1XqY9+bWhC/KF+d/Q=,tag:sUk+RTTGxdt0Fn7fgVCUZQ==,type:str]"
	},
	"sops": {
		"kms": [
			{
				"arn": "arn:aws:kms:us-east-1:XXXXXXXXXXX`:key/XXXXXXXXX-XXXX-XXXX-XXXX-45fc7e54e2eb",
				"created_at": "2019-06-24T07:12:59Z",
				"aws_profile": ""
			}
		],
		"gcp_kms": null,
		"azure_kv": null,
		"lastmodified": "2019-06-24T07:13:00Z",
		"pgp": null,
		"unencrypted_suffix": "_unencrypted",
		"version": "3.3.1"
	}
}
```

Unencrypted, it looks like this
```json
{
	"secret_name": {
		"key": "important-value"
	}
}
```

Now, how can an engineer edit the encrypted json files? Here comes the small editor script I made.

### Small editor script
This is a small editor script that decrypts the file, opens a vim and encrypt after editing.
```bash
#!/bin/bash -e
if [ $# -ne 1 ]; then
    CMDNAME=`basename $0`
    echo "Usage: $CMDNAME environment"
    exit 1
fi

ENVIRONMENT=$1
TMP_FILE="/tmp/editor-scrt-"`$(which date) "+%s"`".$ENVIRONMENT.sops.json"
OLD_CHKSUM=""
NEW_CHKSUM=""

chksum() {
  sha1sum $1 | awk '{print $1}'
}

decrypt() {
  sops -d ./secrets.$ENVIRONMENT.sops.json > $TMP_FILE || cleanup
  OLD_CHKSUM=`chksum $TMP_FILE`
}

open() {
  `$(which vim) -c "i" $TMP_FILE >> /dev/tty`
  NEW_CHKSUM=`chksum $TMP_FILE`
}

encrypt() {
  sops -e --aws-profile=./.sops.yaml -i $TMP_FILE || cleanup
}

cleanup() {
  rm -f $TMP_FILE
}

decrypt
open
encrypt
if [ $OLD_CHKSUM != $NEW_CHKSUM ]
then
  mv $TMP_FILE ./secrets.$ENVIRONMENT.sops.json
fi
cleanup
```
