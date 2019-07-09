## Signal handling in docker containers
Today I learned about sending signals in your application from a docker container.

### What happens on docker stop and docker kill?

The ```docker stop``` command stops a running container by sending a ```SIGTERM``` signal.
This allows the application inside to be notified and make a necessary action such as closing any open transactions or perform a cleanup.
The ```docker kill``` command however brutally stops running container by sending a ```SIGKILL``` signal.

In Kubernetes, when a pod initiates the terminating procedure, it does the ff.
1. Pod is considered dead and the API server removes it from the endpoint list of a service and from replication controllers.
2. Happens simulteanously with (1), preStop hook is executed.
3. The ```SIGTERM``` signal is sent to the pod and wait for a grace period of by default 30 seconds.
4. The ```SIGKILL``` is sent to the pod.

Read [this](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods) for more information about termination of pods

This appears like we don't need to do anything because we assume that our application inside a container gracefully exits.
We are wrong. I am wrong :D

### Ensuring your applications receives the signal

Let's start with the most simple way.

#### Your app as the main process (PID 1)

When your application is the main process, it can accept the signals directly.

Here's a smple python application with a signal handler for SIGINT and SIGTERM and we want to dockerize it.

```python
# source code
# shamelessly copied from
# https://stackoverflow.com/a/31464349/2591014

import signal
import time

class GracefulKiller:
  kill_now = False
  signals = {
    signal.SIGINT: 'SIGINT',
    signal.SIGTERM: 'SIGTERM'
  }

  def __init__(self):
    signal.signal(signal.SIGINT, self.exit_gracefully)
    signal.signal(signal.SIGTERM, self.exit_gracefully)

  def exit_gracefully(self, signum, frame):
    print("\nReceived {} signal".format(self.signals[signum]))
    print("Cleaning up resources. End of the program")
    self.kill_now = True

if __name__ == '__main__':
  killer = GracefulKiller()
  print("Running ...")
  while not killer.kill_now:
    time.sleep(1)
```

In our Dockerfile,
```
FROM python:3.7.3-alpine3.9
COPY ./signals.py ./signals.py
ENTRYPOINT ["python", "signals.py"]
```

Now build,
```bash
$ docker build . -t python-signals
```
Then run

```bash
$ docker run -it --rm --name="python-signals" python-signals
```

You should see ```Running ...``` message in stdout.
Open a new terminal and check if the ```python signals.py``` is in PID 1.
```bash
$ docker exec -it python-signals ps
```

The output should be like this.
```
PID   USER     TIME  COMMAND
    1 root      0:00 python signals.py
    6 root      0:00 ps
```
That means if you run a "docker stop" command, your application can receive the issued ```SIGTERM``` command and process it accordingly based on what you want to achieve.
```bash
docker stop python-signals
```
The output from the other terminal will be:
```bash
Received SIGTERM signal
End of the program
```

That's great!

#### Your app is initiated by a bash script
Often times a script is initiated from a bash script.

Problem with that, the application won't receive any signals and will be killed brutally.

Say you have a ```run.sh``` like this:
```bash
#!/bin/sh

ENVIRONMENT="staging"
OTHERAPPVAR=true
python signals.py

## or for example gunicorn with lots of different parameters
# gunicorn [OPTIONS] app:app
```

In Dockerfile, we'll gonna replace the entrypoint with ```run.sh```.
```bash
FROM python:3.7.3-alpine3.9
COPY ./signals.py ./signals.py
COPY ./run.sh ./run.sh
RUN chmod +x ./run.sh
ENTRYPOINT ["./run.sh"]
```

Build and then run the container.
Open a new container and run ```ps``` to check what process is in PID 1:
```bash
$ docker exec -it python-signals ps
PID   USER     TIME  COMMAND
    1 root      0:00 {run.sh} /bin/sh ./run.sh
    6 root      0:00 python signals.py
    7 root      0:00 ps
```

Our application is in a different process id now.
So let's see if by running "docker stop" our application will receive the ```SIGTERM``` signal.
```bash
$ docker stop python-signals
```

This time, there's no print message from the application. It was just brutally killed :(

Now, Let's go back to our run script and add ```exec```.

```bash
#!/bin/sh

ENVIRONMENT="staging"
OTHERAPPVAR=true
exec python signals.py
```

The ```exec``` command allows us to execute a command that completely replaces the current process.
In our first version of run.sh, the current process is the actual bash script. Therefore, it is the PID 1. It then created a child process for the python application.

This ```exec``` command replaces that current process making the python application to be the PID 1 instead.

Now build and run it then run ```ps```.
```bash
PID   USER     TIME  COMMAND
    1 root      0:00 python signals.py
   12 root      0:00 ps
```

Voila! Now our application should be able to handle the signal.

Thank you for reading!
