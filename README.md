# Convex Self-Hosted on AWS with SST

This project is an implementation to run Convex self-hosted in AWS using SST (Serverless Stack). It is based on the excellent work done by Sean Campbell:

- Blog: [Self-hosted Convex on AWS with SST](https://seanpaulcampbell.com/blog/self-hosted-convex-aws-sst)
- GitHub: [seanpaulcampbell.com/examples/convex-self-hosted](https://github.com/natac13/seanpaulcampbell.com/tree/main/examples/convex-self-hosted)


## Modifications

This implementation includes some modifications from the original work, including:

- Auto-generation of the admin key in the ECS service.
- Prefill of admin key in dashboard in local development.
- Test basic auth for non prod deployments.

## Prerequisites
 

## Getting Started

### Local development
When running locally, the first time there will be an error `SecretMissingError: Set a value for NEXT_PUBLIC_ADMIN_KEY with "sst secret set NEXT_PUBLIC_ADMIN_KEY <value>"`, check the Convex tab in the terminal where app was launched. The admin key will be printed there. Copy it and paste as the placeholder value of NEXT_PUBLIC_ADMIN_KEY secret.

Create a `.env.local` and add:

```
# Deployment used by `bun convex dev`
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<REPLACE_WITH_ADMIN_KEY>
```

### Deploying to AWS

Create a `.env.<ENV_NAME>` like `.env.dev` and add:

``` 
CONVEX_SELF_HOSTED_URL=<REPLACE_WITH_CONVEX_URL>
CONVEX_SELF_HOSTED_ADMIN_KEY=<REPLACE_WITH_ADMIN_KEY>
```

Push Convex changes using bun convex using: `bun convex deploy --env-file .env.<ENV_NAME>` example `bun convex deploy --env-file .env.dev`

![Screenshot](/asset/Screenshot1.png)
![Screenshot](/asset/Screenshot2.png)
![Screenshot](/asset/Screenshot3.png)
![Screenshot](/asset/Screenshot4.png)
