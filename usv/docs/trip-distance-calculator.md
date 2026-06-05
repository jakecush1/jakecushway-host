# Trip Distance Calculator

## Overview
Calculates the total distance traveled by a USV over a given trip. Designed to produce a clean, reliable distance figure by reconciling two independent data sources.

## Data Sources
- **GPS** — onboard GPS position log
- **AIS (NAV)** — AIS navigation data stream

## How It Works
1. Ingests both data sources as separate inputs
2. Removes speed spikes — any reading exceeding a defined speed threshold (x nm) is flagged as erroneous and deleted
3. Averages the cleaned distance figures from both sources to produce a single output

## Purpose
Used for recording official trip distance. Reconciling GPS and AIS reduces the impact of sensor noise or dropouts from either source alone.

## Notes
- The spike threshold (x nm) should be tuned based on the USV's known max speed
- Output is the averaged distance in nautical miles
