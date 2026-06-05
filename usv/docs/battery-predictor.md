# USV Battery Predictor

**By Jake Cushway**

## Overview
Predicts how long a USV can remain on the water by combining NOAA marine weather forecasts with historical power consumption data. Outputs a recommended return time and a battery forecast report.

## What It Does
- Parses NOAA marine forecast for wind speed, sea state, and solar conditions
- Models battery consumption against motor draw and solar intake
- Outputs a 14-day battery forecast and a recommended return time

**Example output:**
> "USV should return by Thursday 14:00 — estimated 23% battery remaining on arrival."

## Inputs

### Weather Forecast
Currently: copy-paste a NOAA marine forecast text block directly into the tool.

**Planned:** Direct API integration via NOAA Weather API or open-source weather API — coming soon.

**Example forecast input:**
```
PZZ820-250345
Point St. George to Point Arena between 60 NM and 150 NM offshore
734 AM PST Tue Feb 24 2026

TODAY
S to SW winds 10 to 20 kt, becoming SW 5 to 15 kt. Seas 9 to 12 ft.
TONIGHT
N to NW winds 5 to 15 kt. Seas 8 to 10 ft.
WED
N to NE winds 10 to 15 kt. Seas 6 to 8 ft.
...
```

## Output
- **Recommendation** — "USV should return at [time] on [day]"
- **Breakdown report** — predicted battery consumption per forecast period
- **Confidence level** — estimated reliability of the prediction

## How It Works

### Power Modeling
Battery consumption is modeled against two competing forces:
- **Motor draw** — increases with wind speed and sea state
- **Solar intake** — offsets draw based on forecast conditions and time of year

Time of year has a significant effect on results due to seasonal variation in solar input, weather patterns, and sea state.

### Model Structure (System Identification approach)
Multiple candidate functions are fit against historical deployment data and tested against held-out data. Candidate model structures include:
- Transfer functions
- Frequency response models
- Nonlinear ARX
- Hammerstein-Wiener

The best-fitting structure is selected based on validation performance.

## Known Limitations
- Training data is outdated — model accuracy degrades as conditions drift from the training set
- Seasonal effects (solar angle, typical sea state) are not yet fully weighted
- Should not be used as the sole basis for mission planning

## Current Status
- A basic power model exists inside the mission planning tool but is currently malfunctioning
- This predictor is intended as a more robust replacement using the dark grey box / system identification approach

## Planned Improvements
- Retrain on more recent NOAA deployment data
- Add seasonal/time-of-year weighting
- Replace copy-paste input with direct NOAA API or open-source weather API feed

## Links
- [GitHub — batteryPredictor (OOR-USV-tools)](https://github.com/jakecush1/OOR-USV-tools/tree/main/batteryPredictor)
- [NOAA Marine Forecast](https://www.weather.gov/mtr/MarineForecast)
- [NOAA Weather API](https://www.weather.gov/documentation/services-web-api)
