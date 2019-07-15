### Go

Here's some things I learned about go lang.

### Gracefully exiting HTTP server
I was recently intrigued by applications reacting correctly on [signals](https://en.wikipedia.org/wiki/Signal_(IPC)).

Here's an example [application](https://github.com/eshleebien/go-graceful-exit) that gracefully exits when received ```SIGINT``` and ```SIGTERM``` signals.

