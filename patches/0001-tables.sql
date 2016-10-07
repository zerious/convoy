DROP TABLE IF EXISTS driver;
CREATE TABLE driver (
  id serial NOT NULL,
  capacity float NOT NULL,
  CONSTRAINT driver_id PRIMARY KEY (id)
);

DROP TABLE IF EXISTS shipment;
CREATE TABLE shipment (
  id serial NOT NULL,
  capacity float NOT NULL,
  accepted boolean NOT NULL,
  CONSTRAINT shipment_id PRIMARY KEY (id)
);

DROP TABLE IF EXISTS offer;
CREATE TABLE offer (
  id serial NOT NULL,
  driver_id serial NOT NULL,
  shipment_id serial NOT NULL,
  accepted boolean NOT NULL,
  CONSTRAINT offer_id PRIMARY KEY (id)
);
