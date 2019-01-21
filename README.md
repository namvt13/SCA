# SRC

Scalable real-time chat app, completes with private chat room, peer-to-peer chat and dynamically ultilizes CPU's resources across multiple machines.

Technologies used:

- Clustering support running on multiple processes (PM2 option available).
- Chat history will be stored on Redis, room & user searching enabled by ElasticSearch (to be implemented).
- RabbitMQ's AMQP method will be used to ensure all messages are stored and prevent corruption.
- Using Consul to load-balancing and coordinate multiple chat and message saving processes, exposing only one proxy server to client.

## Getting started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See "Deployment" for notes on how to deploy the project on a live system.

### Prerequisites

Tested requirement (Best compatibility, you can use other platforms/applications if you wish):

```
- OS: Ubuntu 18.04
(Window & Mac OS can be used, too.
Paths are done using path.join(), so compatible should be good.
PM me for for any cross-platform related bugs.)

- Node.js: v8.15
- Editor: VSCode, lastest
- Chrome: Lastest
- Consul - distributed service mesh to connect, secure, and configure services across any runtime platform and public or private cloud ([Install](https://www.consul.io/docs/install/index.html))
- PM2 - Production-ready Node.js process manager (Optional, use can choose to use Cluster to generate processes, [Install](http://pm2.keymetrics.io/docs/usage/quick-start/#installation))
```

### Installing

- Clone the project
- Run either

```
yarn install
```

or

```
npm install
```

- Finally, at the base folder run

```
yarn/npm start
```

Default values:

- Cluster to create processes
- 2 process(es) for history server
- 2 process(es) for chat server
- Port 8080 for the proxy server
- Default interface: http://localhost:8080

Furthur config can be made using [config.json](server/config.json)

## Built with

- [Express](https://github.com/expressjs/express)
- [Socket.io](https://github.com/socketio/socket.io)
- [Consul](https://github.com/hashicorp/consul)
- [PM2](https://github.com/Unitech/pm2)
- [Redis](https://github.com/antirez/redis)
- [RabbitMQ](https://github.com/rabbitmq)

## Contributin

## Author

- **Me** - Original work

## License

This project is licenced under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
