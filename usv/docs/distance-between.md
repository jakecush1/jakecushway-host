# Distance Between

## Overview
Compares two CSV location files to calculate the real-time or logged distance between a USV and its support boat.

## Dependencies
- Requires **SaasMaster** — the support boat holds the SaasMaster unit, which provides its location data

## Inputs
- CSV 1 — USV position log
- CSV 2 — Support boat (SaasMaster) position log

## Output
Distance between the two vessels at each logged timestamp.

## Use Cases
- **EH (Energy Harvesting) testing** — verify the USV is operating at the correct range
- **Radar testing** — confirm positional data against radar returns
- **Acoustic testing** — ensure the USV is within the required distance window for valid acoustic measurements

## Purpose
Provides a ground-truth distance record during field testing. Useful for post-mission validation of any test where vessel separation is a key variable.
