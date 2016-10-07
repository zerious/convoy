INSERT INTO driver (capacity)
VALUES (50), (55), (60), (65), (70), (75), (80), (85), (90), (95);

INSERT INTO shipment (capacity, accepted)
VALUES (20, true), (25, false), (30, true), (35, false), (40, true);

INSERT INTO offer (shipment_id, driver_id, accepted)
VALUES
  (1, 1, true),
  (2, 1, false), (2, 2, false), (2, 3, false), (2, 4, false), (2, 5, false),
  (2, 6, false), (2, 7, false), (2, 8, false), (2, 9, false), (2, 10, false),
  (3, 2, true),
  (4, 1, false), (4, 2, false), (4, 3, false), (4, 4, false), (4, 5, false),
  (4, 6, false), (4, 7, false), (4, 8, false), (4, 9, false), (4, 10, false),
  (5, 3, true);
