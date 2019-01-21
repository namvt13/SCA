# SCM

Scalable real-time chat module, completes with private chat room, peer-to-peer chat and dynamically ultilizes CPU's resources across multiple machines.

Technologies used:

- Clustering support running on multiple processes (Use NGINX's reverse proxy system to scale across multiple machine).
- Chat history will be stored on Redis, room & user searching enabled by ElasticSearch.
- Data transmitting between server is gzipped and hashed for increased security.
- RabbitMQ's AMQP method will be used to ensure all messages are stored and prevent corruption.
- Option for using GraphQL (and the preferred Relay module on the front-end) for database interface.
- Option for support middleware module.
