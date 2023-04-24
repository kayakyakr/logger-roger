![banner](https://user-images.githubusercontent.com/2719615/174460475-fc653e81-47a9-4515-a973-2a7650782e6d.png)

```
npx create-remix --template k1sul1/prog-stack
```

_psst, if you open this README after running the command above, you get commands that you can just copy-paste! Just get a markdown preview plugin for your editor and you're good to go!_

[Motivation behind the stack](https://www.youtube.com/watch?v=ZNIV2H-jmfM)

I like Hasura more than I like Prisma. There, I said it. While Remix has killed almost every client side api call, I like having a GraphQL API and the option to talk to it from the browser. And everything else that Hasura offers, including... migrations that work. Dysfunctional migrations are what drove me away from Prisma.

This stack **does not** talk to Hasura from the browser, but you could make it do that if you wanted to, pretty easily.

One of the differences between Prisma & Hasura, other than the fact that comparing them is a total apples & oranges comparison, is that there is no schema file that you maintain manually with Hasura. With Hasura, you manage the db schema through `hasura console`, and write something like this:

```ts
export type User = {
  uuid: string;
  fname: string;
  lname: string;
  email: string;
  role: number;
  status: number;
  meta: JSON | null;
};

export async function getUserByEmail(email: User["email"]) {
  const { users } = await gqlReq<{ users: User[] }>(
    gql`
      query getUserByEmail($email: String) {
        users(where: { email: { _eq: $email } }) {
          uuid
          fname
          lname
          email
          role
          status
          meta
        }
      }
    `,
    { email }
  );

  if (!users.length) {
    return null;
  }

  return users[0];
}
```

## What's in the stack

Almost everything that [the Blues stack](https://github.com/remix-run/blues-stack) had when this stack was forked from it on 2022-06-17, and a tad more. You know if the repository has been kept up to date with the upstream, if this repository is ahead of blues-stack. Changes to blues are usually pretty minor so you can just manually copypaste them if I haven't had the time of synchronizing.

- [Hasura](https://hasura.io/)
- [Multi-region Fly app deployment](https://fly.io/docs/reference/scaling/) with [Docker](https://www.docker.com/)
- [Multi-region Fly PostgreSQL Cluster](https://fly.io/docs/getting-started/multi-region-databases/)
- Healthcheck endpoint for [Fly backups region fallbacks](https://fly.io/docs/reference/configuration/#services-http_checks)
- ~~[GitHub Actions](https://github.com/features/actions) for deploy on merge to production and staging environments~~ It's there, but it doesn't consider the existence of Hasura at the moment. It's probably simple to setup but I don't have time at the time of writing. If you do set it up, please create a pull request! I'm quite happy with running `fly deploy`.
- Email/Password Authentication with [cookie-based sessions](https://remix.run/docs/en/v1/api/remix#createcookiesessionstorage)
- Styling with [Tailwind](https://tailwindcss.com/)
- End-to-end testing with [Cypress](https://cypress.io)
- Local third party request mocking with [MSW](https://mswjs.io)
- Unit testing with [Vitest](https://vitest.dev) and [Testing Library](https://testing-library.com)
- Code formatting with [Prettier](https://prettier.io)
- Linting with [ESLint](https://eslint.org)
- Static Types with [TypeScript](https://typescriptlang.org)

Not a fan of bits of the stack? Fork it, change it, and use `npx create-remix --template your/repo`! Make it your own.

### What's missing from Blues?

- I took out tiny-invariant, it's an useless dependency that makes your life harder than need be.
- Prisma, obviously.
- Some tests didn't want to play along, so I commented them out and left fixing them as an exercise to the reader. I'll be scrapping them all in every project, so I'm not too fond on the idea of spending more time on something that I'll remove.

## How about that other stuff that you added?

- Simple but effective form validation cuts the loc count of actions drastically. Just call validateAndParseForm and forget about it.
- [Authentication & Authorization](./auth-explained.md)

## Development

- Install [Hasura CLI](https://hasura.io/docs/latest/graphql/core/hasura-cli/install-hasura-cli/). It's available on npm.
-
- This step only applies if you've opted out of having the CLI install dependencies for you:

  ```sh
  npx remix init
  ```

- Start [Docker services](https://www.docker.com/get-started):

If you'd prefer not to use Docker locally, you can just point the local application to the Hasura instance you will deploy a bit later.

You should really at least glance at [./hasura/README.md](hasura/README.md) before proceeding.

And take a look at the config file you're going to be running, just for your own sake. If you're running Linux, you have to make a few minor changes, that I've already made for you. Just add and remove some # characters from the docker-compose.yml.

```sh
cd hasura
docker compose up # it's going to take a while to get started.
# Open another terminal so you can see if something goes wrong
# WAIT for db and hasura to be up before proceeding
hasura seed # To populate the database
hasura console # To open up the console / db client.
```

You can also talk to the production instance with `hasura console` using --endpoint.

> **Note:** Ensure that Docker has finished and your container is running before proceeding.

> **Additional note:** This stack is setup a bit differently than Blues. Remix is one Fly application, Hasura is another.
> The database is attached to Hasura. If you wanted to, you could connect to the database from Remix, but then you'd be better of using Prisma in the first place.

- Run the first build:

  ```sh
  npm run build
  ```

- Start dev server:

  ```sh
  npm run dev
  ```

This starts your app in development mode, rebuilding assets on file changes. Open it, and try creating an account, or logging in with `rachel@remix.run` using the password `racheliscool`.

If that doesn't work and you see something like `An unexpected error occurred: webhook authentication request failed` instead, ensure that you've configured docker correctly. I might accidentally change the default config options to Linux when working on the repo (did that twice already), as I work on Linux.

### Relevant code:

This is a pretty simple note-taking app, but it's a good example of how you can build a full stack app with Hasura and Remix. The main functionality is creating users, logging in and out, and creating and deleting notes.

In addition to that, foundations for row level permissions have been laid. Users that hold the role UserRole.user can only view and delete their own notes, but administrators can see and delete others notes. You can manage the permissions from `hasura console` or through the configuration files.

![hasura console permission editor](https://user-images.githubusercontent.com/2719615/174500480-dbe5f54e-adb7-4ecf-bc2f-3244f475e9bd.png)

- creating users, and logging in and out [./app/models/user.server.ts](./app/models/user.server.ts)
- user sessions, and verifying them [./app/session.server.ts](app/utils/session.server.ts)
- creating, and deleting notes [./app/models/note.server.ts](./app/models/note.server.ts)

## Deployment

If you don't care about GH actions, you can just run `fly deploy` in this and `hasura` directory to deploy your project after the initial setup. Even if you don't use GH actions, the information still applies to you.

This Remix Stack comes with two GitHub Actions that handle automatically deploying your app to production and staging environments.

Prior to your first deployment, you'll need to do a few things:

- [Install Fly](https://fly.io/docs/getting-started/installing-flyctl/)

- Sign up and log in to Fly

  ```sh
  fly auth signup
  ```

  > **Note:** If you have more than one Fly account, ensure that you are signed into the same account in the Fly CLI as you are in the browser. In your terminal, run `fly auth whoami` and ensure the email matches the Fly account signed into the browser.

- Create two apps on Fly, one for staging and one for production:

  ```sh
  fly create logger-roger-1825
  fly create logger-roger-1825-staging
  ```

  > **Note:** Once you've successfully created an app, double-check the `fly.toml` file to ensure that the `app` key is the name of the production app you created. This Stack [automatically appends a unique suffix at init](https://github.com/remix-run/blues-stack/blob/4c2f1af416b539187beb8126dd16f6bc38f47639/remix.init/index.js#L29) which may not match the apps you created on Fly. You will likely see [404 errors in your Github Actions CI logs](https://community.fly.io/t/404-failure-with-deployment-with-remix-blues-stack/4526/3) if you have this mismatch.

- Initialize Git.

  ```sh
  git init
  ```

- Create a new [GitHub Repository](https://repo.new), and then add it as the remote for your project. **Do not push your app yet!**

  ```sh
  git remote add origin <ORIGIN_URL>
  ```

- Add a `FLY_API_TOKEN` to your GitHub repo. To do this, go to your user settings on Fly and create a new [token](https://web.fly.io/user/personal_access_tokens/new), then add it to [your repo secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) with the name `FLY_API_TOKEN`.

- Add a `SESSION_SECRET` to your fly app secrets, to do this you can run the following commands:

  ```sh
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app logger-roger-1825
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app logger-roger-1825-staging
  ```

  > **Note:** When creating the staging secret, you may get a warning from the Fly CLI that looks like this:
  >
  > ```
  > WARN app flag 'logger-roger-1825-staging' does not match app name in config file 'logger-roger-1825'
  > ```
  >
  > This simply means that the current directory contains a config that references the production app we created in the first step. Ignore this warning and proceed to create the secret.

  If you don't have openssl installed, you can also use [1password](https://1password.com/password-generator/) to generate a random secret, just replace `$(openssl rand -hex 32)` with the generated secret.

Now that everything is set up you can commit and push your changes to your repo. Every commit to your `main` branch will trigger a deployment to your production environment, and every commit to your `dev` branch will trigger a deployment to your staging environment.

If you run into any issues deploying to Fly, make sure you've followed all of the steps above and if you have, then post as many details about your deployment (including your app name) to [the Fly support community](https://community.fly.io). They're normally pretty responsive over there and hopefully can help resolve any of your deployment issues and questions.

### Multi-region deploys

Once you have your site and database running in a single region, you can add more regions by following [Fly's Scaling](https://fly.io/docs/reference/scaling/) and [Multi-region PostgreSQL](https://fly.io/docs/getting-started/multi-region-databases/) docs.

Make certain to set a `PRIMARY_REGION` environment variable for your app. You can use `[env]` config in the `fly.toml` to set that to the region you want to use as the primary region for both your app and database.

#### Testing your app in other regions

Install the [ModHeader](https://modheader.com/) browser extension (or something similar) and use it to load your app with the header `fly-prefer-region` set to the region name you would like to test.

You can check the `x-fly-region` header on the response to know which region your request was handled by.

## GitHub Actions

We use GitHub Actions for continuous integration and deployment. Anything that gets into the `main` branch will be deployed to production after running tests/build/etc. Anything in the `dev` branch will be deployed to staging.

## Testing

### Cypress

We use Cypress for our End-to-End tests in this project. You'll find those in the `cypress` directory. As you make changes, add to an existing file or create a new file in the `cypress/e2e` directory to test your changes.

We use [`@testing-library/cypress`](https://testing-library.com/cypress) for selecting elements on the page semantically.

To run these tests in development, run `npm run test:e2e:dev` which will start the dev server for the app as well as the Cypress client. Make sure the database is running in docker as described above.

We have a utility for testing authenticated features without having to go through the login flow:

```ts
cy.login();
// you are now logged in as a new user
```

We also have a utility to auto-delete the user at the end of your test. Just make sure to add this in each test file:

```ts
afterEach(() => {
  cy.cleanupUser();
});
```

That way, we can keep your local db clean and keep your tests isolated from one another.

### Vitest

For lower level tests of utilities and individual components, we use `vitest`. We have DOM-specific assertion helpers via [`@testing-library/jest-dom`](https://testing-library.com/jest-dom).

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `npm run typecheck`.

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) to get auto-formatting on save. There's also a `npm run format` script you can run to format all files in the project.
