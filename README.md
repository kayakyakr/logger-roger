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

Loggerator returns somethingn that is read as http/0.9 by node's fetch method. This is because there is no 
protocol header being returned in the call. For this reason, I had to user curl as a child_process and pipe
the output into a stream. This gradually slows down over the course of the run. We wind up with an average
speed of 2k logs/sec. Shorter runs can hit almost 20k logs/sec.

If I was building a production system, I would probably explore alternatives that could read directly from
the loggerator, batch the response, and keep going without being a bottleneck.

Rendering takes about 20 seconds to build the /logs.json on near 1 million records. In use, as an api, I would
enforce a max response size and implement paging. This is fairly straightforward with graphql limit/offset.

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
