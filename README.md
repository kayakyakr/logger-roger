# Endpoints

`GET /` - Primary UX with manual Fetch from Loggerator. Lists an upaged list of all values currently in the DB.
Render time is approximately 2ms/log.

`POST /` - Fetch another set of logs from loggerator. This seems to process in the range of 1-2k rows per second.

`GET /logs` - JSON logs endpoint

`GET /streaming` - Same as UX but streams from graphql. There are two types of subscription we could use: live
query, which will return the full result set each time the data changes, and streaming which returns values added
to the database after we open the subscription. We'll be using a live query here because values are not inserted in
their eventual query order.

# Major Libraries Used

### Remix Prog Stack

Remix template (save some time on setup) that uses a hasura (graphql postgres) database backend to emulate
an api serving graphql

### graphql-ws

Pulling handling the subscription for our streaming page.

# Running the app

### Prereqs

`npm i -g hasura`

### Launch Docker Composer

`npm run docker` or if you want to see logs `docker compose up`

After startup (it takes less than a minute, but longer than instant)

`npm run init`

### Launch loggerator

`docker run -p 8080:8080 gcr.io/hiring-278615/loggerator --count 10`

count is optional, default generates 800,000 lines. I've found some instability with a count > 10k between
curl, loggerator, and my logging metrics.

### Visit index

Loggerator load is manually triggered to provide more control over the # of records loaded. Visit
[http://localhost:3000](http://localhost:3000) and press the button to load in records. If you call `/logs`
at that point, the records will be present. If you refresh the index page, you'll also see a rendering of the
log values.

Visiting [http://localhost:3000/streaming](http://localhost:3000/streaming) will get you to a page that loads
the new logs automatically after they are created.

### Hasura Console

You might load up a mess of records and find that the unfiltered

# Testing

`npm run test`

This is a watcher with vitest so will rerun when updated. Implemented testing for the loggerator fetch.

# Notes

Update: understanding that loggerator is a tcp server, I was able to use raw net.Socket to connect and read. Read
speed is substantially faster.

# Database

Hasura provides a configurable graphql layer over Postgres. The DB has one table, logs, with the following columns:

- id (pk),
- IP,
- user (hash indexed),
- date (btree indexed for sorting),
- method,
- path,
- protocol (indexed),
- status (aka code, indexed),
- size
