### Go

Here's some things I learned about go lang.

### Gracefully exiting HTTP server
I was recently intrigued by applications reacting correctly on [signals](https://en.wikipedia.org/wiki/Signal_(IPC)).

Here's an example [application](https://github.com/eshleebien/go-graceful-exit) that gracefully exits when received ```SIGINT``` and ```SIGTERM``` signals.

### Different ways to pass channels as arguments
The rule of thumb: Arrow shows if the data is going into (output) or going out of (input) channel. No arrow is general purpose channel.

```sh
chan <-          writing to channel (output channel)
<- chan          reading from channel (input channel)
chan             read from or write to channel (input/output channel)
```
`

Thanks to [smishra](https://stackoverflow.com/users/810687/smishra) for the [answer](https://stackoverflow.com/a/35759603/2591014) in StackOverflow.
