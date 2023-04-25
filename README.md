# TODO:
Dockerize
Fill out this readme

# Endpoints

`GET /` - Primary UX. Lists an upaged list of all values currently in the DB. Render time is approximately 2ms/

`POST /` - Fetch another set of logs from loggerator. This seems to process in the range of 1-2k rows per second.

`GET /logs` - JSON logs endpoint

`GET /streaming` - Same as UX but streams from graphql. There are two types of subscription we could use: live
query, which will return the full result set each time the data changes, and streaming which returns values added
to the database after we open the subscription. We'll be using a live query here because the result set is not ordered.

# Libraries Used

### Remix Prog Stack

Remix template (save some time on setup) that uses a hasura (graphql postgres) database backend to emulate
an api serving graphql

### graphql-ws

Pulling handling the subscription for our streaming page.

# Running the app

### Launch Docker Composer

`npm run docker`
`npm run init`

### Launch loggerator

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
