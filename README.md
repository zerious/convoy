# Convoy Shipment & Offer System API

## Overview

I implemented a simple Node.js-based API that connects to a PostgreSQL DB. The
data model is basic, designed only to address the requirements for now. I used
the `http` module directly rather than using `express`. This will minimize the
amount of CPU & memory needed so that the web service can handle many
concurrent requests with very low latency. Any performance issues would
probably be due to PostgreSQL.

The code is fairly thoroughly tested:
```
======== Coverage summary ========
Statements   : 94.3% ( 248/263 )
Branches     : 74.19% ( 69/93 )
Functions    : 98.15% ( 53/54 )
Lines        : 94.3% ( 248/263 )
```

## Setup

1. Clone this repo.
```bash
git clone https://github.com/zerious/convoy-api.git
```

2. Install Node.js (if you haven't already).

  On OSX:
  ```bash
  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 4.6.0
  nvm use 4.6.0
  ```

  On other platforms:
  TODO

3. Install dependencies.
  ```bash
  npm install
  ```

4. Create a postgres database on localhost called "convoy" owned by a user
called "convoy" with password "password". Alternatively, you can create and use
any database you want by setting environment variables for `$PGHOST`,
`$PGDATABASE`, `$PGUSER` and `$PGPASSWORD`.

5. Run the database patch script, which will create tables and populate data.
  ```bash
  npm run patch
  ```

  *Note:* This is a "patch" script in name only. It does not yet patch
  incrementally, so each time you run it, old data is removed. If this system
  were being hardened for production, the `DROP TABLE` commands would absolutely
  need to be removed.

6. Run the service.
  ```bash
  npm start
  ```

## Testing
By default, tests are run with [Exam](https://github.com/lighterio/exam), but
they can also be run with [Mocha](https://mochajs.org).

```bash
# Run tests with Exam.
npm test

# Run tests with Exam, and watch for changes.
npm run test-watch

# Run tests with Mocha.
npm run mocha
```

## Coverage
Test coverage can be calculated with [Istanbul] via Exam.

```bash
# Run tests with Exam.
npm test

# Open the coverage report (if the `open` command is supported, as in OSX).
npm run report
```

## Linting
This project uses [Standard JS](http://standardjs.com/) style, so it can be
linted using `standard`. If the CLI returns no output, then everything is fine.
```bash
npm run lint
```

## Q & A

**What persistence solution did you choose and why?**<br>
I chose to use PostgreSQL because I'm told that's what Convoy is already using.
This was my first time using PG since working for we7 in 2009, but it was like
riding a bike. It was fun to figure out how to use it with Node.js. I decided
to go with raw SQL rather than using an ORM in order to minimize the number of
layers of abstraction and optimize for performance. I have used `sequelize`
before, and it might be worth looking into it, with due diligence surrounding
performance and memory usage.

**What are some other ways you might score a driver?**<br>
Drivers won't be sending POST requests to a JSON API, so marketing channels and
mobile/desktop UIs will be necessary for reaching out to drivers and signing
them up. For the most part, this API can be used by those UIs. However the POST
route for setting up drivers could be modified to accept multiple drivers so
that a trucking company could add their entire fleet to Convoy with a single
file upload.

**What do you think are the best features to implement? When and why?**

*Flesh out the data model*<br>
The data model behind the real-world problem is far more complex than in this
homework exercise. It would probably make sense to complete most items in this
list prior starting UI work, so that we can prevent the overhead of creating
mock data inside UIs or a mock service.
* Drivers don't have capacity. Trucks do. Also, a driver might not always use
  the same truck. There should be **carrier**, **vehicle** and **driver**
  entities which are all separate.
* Offers need prices, because money is what it's all about. :)
* Shipments need descriptions and flags for things like hazardous material.
* Locations are extremely important pieces of information for the problem of
  matching drivers to shipments.
* Driver stats and shipper stats will be essential to the process of figuring
  out which drivers to send offers to and how much they're willing to be paid.

*Mobile UI, then Web UI*<br>
The UIs for accessing this data will be extremely important to the effort to
acquire customers and suppliers and keep them happy. There should be apps for
web & mobile, with clear, consistent, minimal UX. The MVP doesn't need to be
web and mobile, and since truckers are mobile, it makes sense to build an app
for phones first.

*Algorithms*<br>
Once there is a mobile UI, the process of matching shipments to drivers and
making offers must be improved using a combination of inputs:
* Current distance between truck (or truck's destination) and shipment.
* Current distance between driver and truck (if the driver has a phone and the
  truck has a device with a mobile data connection).
* Distance between shipment destination and the truck's home base.
* Whether the truck or driver appears to be in transit (possibly carrying a
  non-Convoy shipment).
* Time of day, Day of week, etc.
* Driver's recent utilization rate and time since last shipment or time to
  current destination (i.e. estimated fatigue, eagerness and availability).
* Difference between truck capacity and shipping weight.
* Shipping distance.
* Price per lb and/or price per mile that the shipper is willing to pay.
* Whether the driver or carrier has driven for the shipper before (potentially
  with rating information).
* Driver's rates of accepting or passing based as a function of the above
  parameters.
* Shipper's timing requirements, or Convoy-wide goals (e.g. 90th percentile
  offer acceptance time)

**What would you add/change for a real-world v1 of this system?**<br>
* Database indexes (besides primary keys) to prevent latency as we scale.
* It would be a good idea (and SOX compliant) to keep a DB of historical data
  so that if we stick with the practice of deleting an offer from the working
  DB when a driver decides to "PASS", we'll have a record of it for audit and
  ML model training purposes in the future.
* At the moment, only "/base.json" has configuration options in it. The
  "/production.json" file will need overrides for (e.g.) file or service-based
  logging rather than just logging to console.
* The service will need error monitoring for production stability.
* UIs will be a necessity for getting everything out to customers & suppliers.
