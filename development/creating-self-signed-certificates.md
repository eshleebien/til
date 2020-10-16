### Creating self-signed certificates
... and a CA that you can trust from your browser.

Warning!! this is intended for development purpose only

First, create a private key
```bash
$ openssl genrsa -des3 -out ca.key 2048
```

Then make a configuration `ca.cfg`
```cfg
RANDFILE = NV::HOME/.rnd
[ req ]
default_bits = 2048
default_keyfile = ca.key
distinguished_name = req_distinguished_name
prompt = no
[ req_distinguished_name ]
C = PH
ST = Metro
L = Manila
O = MyCompany
OU = Engineering
CN = MyCompany Development Certificate
emailAddress = dev@mycompany.com
```

Use the config and the private key to generate a public certificate authority
```
$ openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -config ca.cfg -out ca.crt
```

Now, you can use it to sign certificates

### Signing a self-signed certificates with CA

Create a private key
```bash
$ openssl genrsa -out mycompany.test.key 2048
```

Create a configuration `crt.cfg`
```cfg
RANDFILE = NV::HOME/.rnd
[ req ]
default_bits = 2048
default_keyfile = ca.key
distinguished_name = req_distinguished_name
prompt = no
[ req_distinguished_name ]
C = PH
ST = Metro
L = Manila
O = MyCompany
OU = Engineering
CN= *.mycompany.test
emailAddress = dev@mycompany.com
```

From the config and private key, create a certificate signing request `mycompany.test.csr`
```bash
$ openssl req -new -key mycompany.test.key -config crt.cfg -out mycompany.test.csr
```

You may create an ext file if you want alternate names `mycompany.test.ext`
```
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = *.mycompany.test
DNS.2 = mycompany.test
```

Then create a public key from private, ca public and private keys, configuration and ext file: `mycompany.test.crt`
```bash
$ openssl x509 -req -in mycompany.test.csr -CA ca.crt -CAkey ca.key -CAcreateserial \\n-out mycompany.test.crt -days 3650 -sha256 -extfile mycompany.test.ext
```

You can use the generated `mycompany.test.crt` and `mycompany.test.key` in your website. To make your browser trust it, trust the CA

### Trusting the CA (Ubuntu)
```bash
$ sudo cp ca.crt /usr/local/share/ca-certificates/mycompany-ca.crt
$ sudo chmod 644 /usr/local/share/ca-certificates/mycompany-ca.crt
$ sudo update-ca-certificates
# Refresh/Restart your browser
```

### Trusting the CA (MacOS)
1) Open your keychain
1) Import the `ca.crt` file by clicking file > Import Items
1) Locate the `MyCompany Development Certificate` certificate
1) Double click the certificate
1) In the certificate info, Click `Trust`
1) Select "Always Trust" in When using this certificate option
1) Refresh/Restart your browser
