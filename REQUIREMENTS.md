# SHIPMENT & OFFER SYSTEM JSON API

We'd like you to write **V0** of the Convoy API server.  Whenever a shipment is booked with Convoy, we need to find a driver who will accept the job.  To do so, when a new shipment is created, we will send job offers to drivers who we think will accept the job.

In **V0** of this API, we will need the capability to create drivers and shipments.  Then whenever a shipment is created, we will need to create offers for eligible drivers so that they can view available jobs and accept/reject them.

## Specs
Your implementation should be a REST HTTP server that communicates using the JSON data format with the following methods.

---
### `POST /driver`
Adds a new driver to the system.  We will assume all drivers have one truck and each driver has a maximum capacity (weight). Each shipment also has a required capacity and if a shipment's capacity exceeds a truck's maximum capacity, then we should not offer the job to that driver.

**Inputs**
* _capacity_: The capacity the driver's truck can carry.

**Outputs**
* _id_: A unique identifier for the new driver

#### Example Request
```http
POST /driver
Content-type: application/json

{
  "capacity": 42
}
```

#### Example Response
```http
HTTP/1.1 200 OK
Content-type: application/json

{
  "id": "driver-foo-bar-baz"
}
```

---
### `POST /shipment`
Creates a new shipment and creates offers to the top 10 eligible drivers.  A driver is eligible if they have a truck that can carry the required _capacity_ for the shipment.  To be fair to drivers, drivers should be sorted by how many offers that they have received in the past.  Drivers who have had less opportunity to accept jobs should be put to the top.

**Inputs**
* _capacity_: The capacity required for the shipment

**Outputs**
* _id_: A unique identifier for the new shipment  
* _offers_: An array of offers that was created for the shipment

#### Example Request
```http
POST /shipment
Content-type: application/json

{
  "capacity": 42
}
```

#### Example Response
```http
HTTP/1.1 200 OK
Content-type: application/json

{
  "id": "shipment-id-foo-bar",
  "offers": [
    {"offerId": "a string", "driverId": "a string"},
    {"offerId": "a string", "driverId": "a string"},
    ...
  ]
}
```

---
### `GET /shipment/<shipmentId>`
If no driver has accepted the shipment, returns all outstanding offers for the shipment.
If shipment has been accepted, returns the accepted offer.

#### Example Response
```http
HTTP/1.1 200 OK
Content-type: application/json

{
  "accepted": false,
  "offers": [
    {"offerId": "a string", "driverId": "a string"}
  ]
}
```

---
### `GET /driver/<driverId>`
Returns active offers for the driver.  **This list should not include offers that have been revoked because the shipment was accepted by another driver.**

#### Example Response
```http
HTTP/1.1 200 OK
Content-type: application/json

[
  {"offerId": "a string", "shipmentId": "a string"},
  {"offerId": "a string", "shipmentId": "a string"},
  ...
]
```

---
### `PUT /offer/<offerId>`
Accept or reject an offer.  If an offer is accepted, it should revoke all other offers for the same shipment.  If the offer is rejected, it should update the offer so that it no longer shows up as an active offer for the shipment and driver.

**Inputs**
* _status_: `ACCEPT` if the driver accepts the offer or `PASS` if the driver rejects the offer.

**Outputs**

None

#### Example Request
```http
PUT /offer/offerid42
Content-type: application/json

{
  "status": "PASS"
}
```

#### Example Response
```http
HTTP/1.1 200 OK
Content-type: application/json

{}
```


### Example Sequence of requests/responses
```
POST /driver { "capacity": 100 }
> { "id": "1" }

POST /driver { "capacity": 50 }
> { "id": "2" }

POST /shipment { "capacity": 50 }
> {
>   "id": "1",
>   "offers": [
>     { "offerId": "1", "driverId": "1" },
>     { "offerId": "2", "driverId": "2" }
>   ]
> }

GET /driver/1
> [
>   { "offerId": "1", "shipmentId": "1" }
> ]

GET /shipment/1
> {
>   "accepted": false,
>   "offers" : [
>     { "offerId": "1", driverId: "1" },
>     { "offerId": "2", driverId: "2" }
>   ]
> }


PUT /offer/1 { "status": "ACCEPT" }
> {}

```

---
### Notes

Those are all the required API endpoints.  Feel free to ask for clarifications if anything is not clear.

Your solution should be as professional as you would make it for a real, production system. Assume teams other than your own will be consuming this service.  Questions we will be trying to answer based off the solution:
* How will it be tested? (Please include any tests you have written)
* How will it handle real world input?
* How does it behave under concurrent load?
* Can the code be easily extended to become v1 of the convoy API?

#### Additional Questions
Please write a paragraph or two for each of the following questions.

* What persistence solution did you choose and why?
* What are some other ways you might score a driver?
* What do you think are the best features to implement? When and why?
* What would you add/change for a real-world v1 of this system?

Also, in your submission please include instructions on how to run your solution along with any external dependencies that are required.
