#!/usr/bin/env python3
"""
USV Battery Model Refitter
Reads all deployment folders, computes 12h net kWh windows from voltage drops,
fits linear regression against avg wind speed, and prints new JS coefficients.
"""

import os, re, glob
import numpy as np
import pandas as pd

BASE = os.path.dirname(os.path.abspath(__file__))
CAP_KWH = 17.56

# Voltage lookup table: index = battery % (0-100), value = voltage
PCT_TO_V = [
    19.72,20.36,20.84,21.23,21.54,21.83,22.09,22.34,22.60,22.85,
    23.08,23.29,23.48,23.65,23.85,23.97,24.04,24.10,24.15,24.21,
    24.28,24.38,24.47,24.56,24.65,24.74,24.82,24.89,24.95,25.02,
    25.09,25.16,25.23,25.29,25.35,25.40,25.45,25.50,25.56,25.61,
    25.67,25.73,25.79,25.85,25.92,25.98,26.05,26.11,26.18,26.24,
    26.31,26.37,26.43,26.50,26.56,26.62,26.69,26.76,26.83,26.92,
    27.00,27.08,27.15,27.21,27.26,27.32,27.37,27.43,27.48,27.55,
    27.61,27.68,27.76,27.83,27.91,27.99,28.07,28.14,28.21,28.28,
    28.34,28.38,28.42,28.44,28.46,28.48,28.50,28.52,28.54,28.56,
    28.58,28.61,28.65,28.69,28.75,28.81,28.90,29.01,29.15,29.32,29.57
]
V_ARR = np.array(PCT_TO_V)

def v_to_kwh(v):
    """Convert battery voltage to kWh remaining."""
    v = np.clip(float(v), V_ARR[0], V_ARR[-1])
    pct = np.interp(v, V_ARR, np.arange(101))
    return pct / 100.0 * CAP_KWH

def parse_val(s):
    """Parse '1.17 Wh', '-42.5 Wh', '364 mWh', '8.5 kn', '28.7 V' -> float in base unit (Wh or kn or V)."""
    if pd.isna(s):
        return np.nan
    s = str(s).strip()
    m = re.match(r'([+-]?\d+\.?\d*(?:e[+-]?\d+)?)\s*([a-zA-Z]*)', s)
    if not m:
        return np.nan
    num = float(m.group(1))
    unit = m.group(2).lower()
    if unit == 'mwh':
        return num / 1000.0
    if unit == 'kwh':
        return num * 1000.0
    return num  # Wh, V, kn — return as-is

def find_file(folder, keyword):
    for f in os.listdir(folder):
        if keyword.lower() in f.lower() and f.endswith('.csv'):
            return os.path.join(folder, f)
    return None

def load_deployment(folder):
    name = os.path.basename(folder)
    vessel = 'DX13' if 'dx13' in name.lower() else 'DX16'

    # --- Voltage (6h intervals) → interpolate to 1h ---
    vf = find_file(folder, 'battery voltage')
    if not vf:
        return None
    df_v = pd.read_csv(vf)
    df_v.columns = [c.strip().strip('"') for c in df_v.columns]
    df_v['Time'] = pd.to_datetime(df_v['Time'])
    df_v['kwh'] = df_v['POB'].apply(parse_val).apply(lambda v: v_to_kwh(v) if not np.isnan(v) else np.nan)
    df_v = df_v[['Time', 'kwh']].dropna().set_index('Time').sort_index()
    df_v = df_v.resample('1h').interpolate(method='time')

    # --- Wind speed (hourly avg) ---
    wf = find_file(folder, 'wind')
    if not wf:
        return None
    df_w = pd.read_csv(wf)
    df_w.columns = [c.strip().strip('"') for c in df_w.columns]
    df_w['Time'] = pd.to_datetime(df_w['Time'])
    df_w['wind_kt'] = df_w['Average'].apply(parse_val)
    df_w = df_w[['Time', 'wind_kt']].dropna().set_index('Time').sort_index()
    df_w = df_w.resample('1h').mean()

    # --- Solar (hourly per panel) ---
    sf = find_file(folder, 'solar')
    df_s = None
    if sf:
        df_s = pd.read_csv(sf)
        df_s.columns = [c.strip().strip('"') for c in df_s.columns]
        df_s['Time'] = pd.to_datetime(df_s['Time'])
        panel_cols = [c for c in df_s.columns if c != 'Time']
        df_s['solar_wh'] = df_s[panel_cols].apply(
            lambda col: col.apply(parse_val).clip(lower=0).fillna(0)
        ).sum(axis=1)
        df_s = df_s[['Time', 'solar_wh']].set_index('Time').sort_index()
        df_s = df_s.resample('1h').mean().fillna(0)

    # --- Merge on hourly index ---
    merged = df_v.join(df_w, how='inner')
    if df_s is not None:
        merged = merged.join(df_s, how='left')
        merged['solar_wh'] = merged['solar_wh'].fillna(0)
    else:
        merged['solar_wh'] = 0.0
    merged['vessel'] = vessel

    return merged

# ── Load all deployments ──────────────────────────────────────────────────────
all_data = []
for folder in sorted(glob.glob(os.path.join(BASE, '*/'))):
    folder = folder.rstrip('/')
    if os.path.basename(folder).startswith('.'):
        continue
    df = load_deployment(folder)
    if df is None or len(df) < 12:
        print(f"  SKIP {os.path.basename(folder)}")
        continue
    all_data.append(df)
    print(f"  OK   {os.path.basename(folder):35s} {len(df):4d}h  vessel={df['vessel'].iloc[0]}")

combined = pd.concat(all_data).sort_index()
print(f"\nTotal hourly rows: {len(combined)}")

# ── Build 12h windows ─────────────────────────────────────────────────────────
# Align to 06:00 (day) / 18:00 (night) boundaries
def period_start(t):
    if 6 <= t.hour < 18:
        return pd.Timestamp(t.year, t.month, t.day, 6)
    elif t.hour >= 18:
        return pd.Timestamp(t.year, t.month, t.day, 18)
    else:
        prev = t - pd.Timedelta(days=1)
        return pd.Timestamp(prev.year, prev.month, prev.day, 18)

combined['period'] = combined.index.map(period_start)

windows = []
for (period, vessel), grp in combined.groupby(['period', 'vessel']):
    if len(grp) < 8:
        continue
    kwh_start = grp['kwh'].iloc[0]
    kwh_end   = grp['kwh'].iloc[-1]
    net_kwh   = kwh_start - kwh_end          # positive = battery consumed
    wind_avg  = grp['wind_kt'].mean()
    solar_kwh = grp['solar_wh'].sum() / 1000
    is_night  = period.hour == 18
    windows.append({
        'period': period,
        'vessel': vessel,
        'wind_avg_kt': wind_avg,
        'net_kwh': net_kwh,
        'solar_kwh': solar_kwh,
        'is_night': is_night,
        'n_hours': len(grp),
    })

W = pd.DataFrame(windows)
print(f"12h windows (>=8h data): {len(W)}")
print(W[['vessel','wind_avg_kt','net_kwh','solar_kwh']].describe().round(4))

# ── Remove outliers (net_kwh < 0 means net charging — skip those) ─────────────
W = W[W['net_kwh'] > 0].copy()
print(f"\nAfter removing net-charging windows: {len(W)} windows")
print(f"  DX13: {(W.vessel=='DX13').sum()}  DX16: {(W.vessel=='DX16').sum()}")

# ── Fit model: net_kwh = a*wind + b ───────────────────────────────────────────
print("\n" + "="*60)
print("MODEL FIT RESULTS")
print("="*60)

results = {}
for vessel in ['DX13', 'DX16']:
    vd = W[W['vessel'] == vessel].copy()
    if len(vd) < 3:
        print(f"\n{vessel}: not enough windows ({len(vd)}), skipping")
        continue

    x = vd['wind_avg_kt'].values
    y = vd['net_kwh'].values

    # Median (mean prediction) fit
    c_mean = np.polyfit(x, y, 1)

    # Residuals for percentile bands
    resid = y - np.polyval(c_mean, x)
    p25 = np.percentile(resid, 25)
    p75 = np.percentile(resid, 75)

    c_opt  = [c_mean[0], c_mean[1] + p25]
    c_pess = [c_mean[0], c_mean[1] + p75]

    results[vessel] = {'mean': c_mean, 'opt': c_opt, 'pess': c_pess}

    print(f"\n{vessel} ({len(vd)} windows)")
    print(f"  Wind range : {x.min():.1f} – {x.max():.1f} kt")
    print(f"  Net kWh    : {y.min():.3f} – {y.max():.3f} kWh/12h")
    print(f"  Solar kWh  : {vd['solar_kwh'].min():.3f} – {vd['solar_kwh'].max():.3f} kWh/12h")
    print(f"  C_MEAN     : [{c_mean[0]:.6f}, {c_mean[1]:.6f}]")
    print(f"  C_OPT      : [{c_opt[0]:.6f},  {c_opt[1]:.6f}]")
    print(f"  C_PESS     : [{c_pess[0]:.6f},  {c_pess[1]:.6f}]")

    # Sample predictions
    for w in [5, 10, 15, 20, 25]:
        pred = np.polyval(c_mean, w)
        print(f"    @ {w:2d} kt → {pred:.3f} kWh/12h  ({pred/CAP_KWH*100:.1f}% of battery)")

# ── DX13 penalty vs DX16 ──────────────────────────────────────────────────────
if 'DX13' in results and 'DX16' in results:
    dx13_intercept = results['DX13']['mean'][1]
    dx16_intercept = results['DX16']['mean'][1]
    penalty = dx13_intercept - dx16_intercept
    print(f"\n--- DX13 vs DX16 penalty: {penalty:+.4f} kWh/12h (intercept diff) ---")

# ── JS output ─────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("PASTE INTO battery.html (replace existing constants)")
print("="*60)

# Use DX16 as baseline (current model structure)
if 'DX16' in results:
    r = results['DX16']
    print(f"const C_MEAN = [{r['mean'][0]:.6f}, {r['mean'][1]:.6f}];")
    print(f"const C_OPT  = [{r['opt'][0]:.6f},  {r['opt'][1]:.6f}];")
    print(f"const C_PESS = [{r['pess'][0]:.6f},  {r['pess'][1]:.6f}];")

if 'DX13' in results and 'DX16' in results:
    penalty = results['DX13']['mean'][1] - results['DX16']['mean'][1]
    print(f"const DX13_PENALTY_KWH_12H = {penalty:.4f};")

print("\nDX13 standalone coefficients (for future use):")
if 'DX13' in results:
    r = results['DX13']
    print(f"// const C_MEAN_DX13 = [{r['mean'][0]:.6f}, {r['mean'][1]:.6f}];")
    print(f"// const C_OPT_DX13  = [{r['opt'][0]:.6f},  {r['opt'][1]:.6f}];")
    print(f"// const C_PESS_DX13 = [{r['pess'][0]:.6f},  {r['pess'][1]:.6f}];")
