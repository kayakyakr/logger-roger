# Endpoints

GET / - Primary UX
POST / - Fetch another set of logs from loggerator
GET /logs - JSON logs endpoint
GET /streaming - Same as UX but streams from graphql

# Libraries Used

### Remix Prog Stack

Remix template (save some time on setup) that uses a hasura (graphql postgres) database backend to emulate
an api serving graphql

# Running the app

### Launch Hasura

- PG has to be fully up before Hasura can start. If console cannot connect, kick over hasura.

### Launch App

### Launch log creations

# Testing

`npm r test`

# Database

143.133.122.190 - shawncarr [02/Jul/2000 07:01:19 +0000] "PUT /bookmarks/281 HTTP/1.0" 403 494
id, IP, user, date, method, path, protocol, status, size
