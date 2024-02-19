> **Important note:**
> Microsoft provides its own emulator for Asure CosmosDB NoSQL, you can find more information on this page:
>
> https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-develop-emulator?pivots=api-nosql&tabs=docker-linux%2Cjavascript
>
> You should consider using this one as it is fully supported by Microsoft.

This emulator is created as a replacement for azure-cosmos-emulator on NoSQL to work around three issues:

1. The evaluation period mode.
2. The (undocumented) capability to store data.
3. The unstable image that requires restart from time-to-time.

Current restrictions for the project:

1. Works only with collections having a `id` property that is as well the partition of the collection.
2. Don't support attachments

## How to deploy

```bash
docker run --name cosmosdb-emulator -p 127.0.0.1:8081:8081 -d superfaz/cosmosdb-emulator:latest
```

## How-tos for developer

### Docker - Local build and run

```bash
docker build . --tag cosmosdb-emulator:latest
docker run --name cosmosdb-emulator -p 127.0.0.1:8081:8081 -d cosmosdb-emulator:latest
```

### Commands to create a new self-signed certificate

```bash
docker run --rm --volume "${PWD}:/app/.certs" finalgene/openssh openssl genrsa -out key.pem
docker run --rm -it --volume "${PWD}:/app/.certs" finalgene/openssh openssl req -new -key key.pem -out csr.pem
docker run --rm --volume "${PWD}:/app/.certs" finalgene/openssh openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
```
