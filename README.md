# fritzbox-dyndns-for-cloudflare

This Project is a express application inside a readily built Docker container, providing a simple DynDNS service by integrating with Cloudflare's API. It allows you to update the DNS records in your Cloudflare Dashboard for a given domain dynamically using FRITZ!Box routers DynDNS capability.

The container is primarily built for FRITZ!Box routers, but will also probably support any other router that has the ability to use a user-defined DynDNS with query parameters inside an Update URL.

## Docker Setup

You can run the Docker Image from ghcr.io using the following command:

```docker
docker run --name cloudflare-dyndns \
 -p 3080:3080  \
 ghcr.io/tueska/fritzbox-dyndns-for-cloudflare:main
```

## How it works

The container runs a Node application that listens for incoming requests and handles the update of DNS records via Cloudflares API using the provided query Parameters to following exposed endpoint:

- Method: GET, PATCH, PUT, POST
- Endpoint: /updateDNS
- Query Parameters:

  | Parameter | FRITZ!Box Placeholder  | Required | Explaination                                                               |
  | --------- | ---------------------- | -------- | -------------------------------------------------------------------------- |
  | token     | `<pass>` or `<passwd>` | yes      | Cloudflare API Token                                                       |
  | domain    | `<domain>`             | yes      | Domain you want to set                                                     |
  | ipaddr    | `<ipaddr>`             | yes      | IPv4 Address of your Router                                                |
  | ip6prefix | `<ip6lanprefix>`       | optional | IPv6 Prefix of your Router                                                 |
  | ip6intid  | `<ip6intid>`           | optional | IPv6 Interface ID of your Network device                                   |
  | username  | `<username>`           | optional | If provided name is `proxy` the DNS Record gets proxied through Cloudflare |

## Usage with FRITZ!Box Router

To use this container with a FRITZ!Box router, follow these steps:

1. Open the FRITZ!Box web interface and navigate to "Internet" > "Permit Access" > "DynDNS"
2. Check "Use DynDNS"
3. Select User-defined DynDNS Provider
4. Enter the following settings:
   1. Update URL: Enter the URL of the container, e.g. `http://<container-ip>:<container-port>/updateDNS?token=<pass>&domain=<domain>&ipaddr=<ipaddr>`
   2. Set a Domain name. Subdomains are supported
   3. Set an the Username to `proxy` if you want to proxy your traffic through Cloudflare
   4. Enter you API Token into Password
5. Press "Apply"

## Important Notes

- Ensure that your Cloudflare API token has sufficient permissions to update DNS records for the specified domain
- The container does not handle authentication for the `/updateDNS` endpoint.
