# ShearLayer-Combustion DNS: A Compressible 2-D Shear Layer DNS Solver for TCR Model Validation


## Overview

This article presents an open-source **2-D compressible shear-layer DNS solver** designed for studying turbulence-chemistry interactions and validating the **Turbulence-Chemistry Recursive (TCR)** micro-mixing model.

The code is available on GitHub:

> **[github.com/windcicada/shearlayer-combustion-DNS](https://github.com/windcicada/shearlayer-combustion-DNS)**

---

## 1. Physical Background

### The Temporal Shear Layer

The temporally-developing shear layer is a canonical configuration for turbulence-chemistry interaction studies. Two streams with different velocities mix through Kelvin–Helmholtz instability, generating a turbulent mixing layer that grows in time.

{{< image src="./dns_velocity_context.png" caption="DNS velocity field with vorticity overlay at t = 100, showing shear-layer roll-up and vortex pairing." width="100%" >}}

The key advantage of this configuration for TCR validation:

- **Well-defined inlet conditions** — no inflow turbulence generation
- **Self-similar growth** — the mixing layer width grows as $\delta(t) \propto t$
- **Strong scalar mixing** — passive and reactive scalars mix through the evolving turbulence field
- **Controllable chemistry** — simple Arrhenius-type reaction models link directly to DNS resolution

### The TCR Micro-Mixing Model

The **TCR (Turbulence-Chemistry Recursive)** model addresses a fundamental issue in transported PDF methods: traditional models (IEM, EMST) require empirical calibration for the mixing frequency. TCR eliminates this by using a recursive multi-layer partitioned reactor concept:

$$\kappa = \frac{\tilde{\omega}_c}{\omega_c(\tilde{\phi})}$$

where:

- $\kappa$ = PSR volume fraction (mixing mode parameter)
- $\tilde{\omega}_c$ = DNS-averaged chemical source term
- $\omega_c(\tilde{\phi})$ = chemical source term evaluated at the mean composition

The DNS provides the ground truth to evaluate this closure and its sensitivity to local mixing conditions.

---

## 2. Governing Equations

### Compressible Navier-Stokes (2-D)

The solver evolves the 2-D compressible Navier-Stokes equations in conservative form:

$$
\frac{\partial \mathbf{U}}{\partial t} 
+ \frac{\partial \mathbf{F}_x}{\partial x} 
+ \frac{\partial \mathbf{F}_y}{\partial y} 
= \mathbf{S}_{\text{visc}} + \mathbf{S}_{\text{reac}}
$$

The conservative state vector is:

$$\mathbf{U} = [\rho,\; \rho u,\; \rho v,\; \rho E,\; \rho Z,\; \rho Y,\; \rho Z^2]^T$$

where:

| Symbol | Meaning |
|--------|---------|
| $\rho$ | Density |
| $u, v$ | Streamwise and cross-stream velocity |
| $E$ | Total energy per unit mass |
| $Z$ | Mixture fraction (passive scalar) |
| $Y$ | Reaction progress variable |
| $Z^2$ | Mixture fraction variance |

### Inviscid Flux: Rusanov with WENO

The inviscid fluxes are computed using the Rusanov (local Lax–Friedrichs) scheme:

$$\mathbf{F} = \frac{1}{2}\left[ \mathbf{F}(\mathbf{U}^-) + \mathbf{F}(\mathbf{U}^+) - \lambda_{\max}(\mathbf{U}^+ - \mathbf{U}^-) \right]$$

where $\mathbf{U}^\pm$ are the reconstructed left and right states using **5th-order WENO** (Jiang-Shu or Z variants).

### Viscous Fluxes

Second-order central differences for viscous momentum and energy fluxes, coupled with Sutherland's law for molecular viscosity:

$$\mu(T) = \mu_0 \left( \frac{T}{T_0} \right)^{3/2} \frac{T_0 + S}{T + S}$$

### Reaction Model

The H₂/O₂ chemistry uses a simplified Arrhenius mechanism:

$$\dot{\omega}_Y = k_r \left[ Y_{\text{H}_2}^a Y_{\text{O}_2}^b - \frac{Y}{k_{\text{eq}}} \right] \exp\left(-\frac{E_a}{RT}\right)$$

where $Y_{\text{H}_2}$ and $Y_{\text{O}_2}$ are derived from $Z$ and $Y$ using the mixture fraction definition.

### Shear Layer Initial Condition

The velocity profile is a hyperbolic tangent:

$$u(y) = u_1 + \frac{u_2 - u_1}{2} \left[ 1 + \tanh\left( \frac{y}{2\delta_\omega} \right) \right]$$

with localized sinusoidal or random perturbations to seed KH instability:

$$v'(x, y, t=0) = A_0 \sin\left( \frac{2\pi x}{\lambda} \right) \exp\left( -\frac{y^2}{2\sigma^2} \right)$$

---

## 3. Code Structure

```
shear_layer_dns/
├── shearlayer_dns/              # Core Python package
│   ├── config.py                # CaseConfig — all parameters in one place
│   ├── solver.py                # Main time-stepping loop + CFL
│   └── state.py                 # State vector manipulation
│
│   ├── flux.py                  # Rusanov numerical flux
│   ├── weno.py                  # 5th-order WENO (JS / Z)
│   ├── grid.py                  # Mesh utilities
│   ├── boundary.py              # BCs (non-reflecting, wall, periodic)
│   ├── initial.py               # Initial profiles + perturbations
│   ├── operators.py             # FD operators
│   ├── filtering.py             # Spatial filters
│   │
│   ├── eos.py                   # Calorically perfect gas
│   ├── reaction.py              # H₂/O₂ chemistry
│   ├── transport.py             # Effective transport
│   ├── viscous.py               # Sutherland viscosity
│   ├── viscous_flux.py          # Viscous flux divergence
│   ├── source_terms.py          # Source term assembly
│   ├── smagorinsky.py           # SGS model
│   │
│   ├── theory.py                # Analytic reference (diffusion, reaction)
│   ├── ms_tcr_physo.py          # Multi-scale TCR physics-constrained opt.
│   ├── tcr_cd_diagnostics.py    # TCR C_D diagnostics
│   ├── tcr_cd_kappa_sensitivity.py  # κ sensitivity analysis
│   ├── esf_tpdf_prior.py        # ESF-TPDF prior analysis
│   ├── scale_constrained_prior.py   # Scale-constrained mixing prior
│   │
│   ├── diagnostics.py           # Run-time statistics
│   ├── plotting.py              # Visualization
│   │
│   ├── run_local_shape.py       # Quick workstation test (WENO + RK3)
│   ├── run_local_debug.py       # Debug entrypoint
│   ├── run_mom_parallel.py      # MPI parallel runs
│   ├── run_mom_reproduction.py  # MOM reproduction
│   ├── run_dns_tpdf_validation.py  # DNS ↔ TPDF comparison
│   ├── run_grid_convergence.py  # Grid convergence study
│   ├── run_parallel_h2o2_cases.py  # H₂/O₂ reacting cases
│   ├── run_shape_scan.py        # Shape parameter scan
│   └── run_mom_perturbation_scan.py # Perturbation sensitivity
│
│   └── tests/                   # Pytest suite
│       ├── test_solver_smoke.py
│       ├── test_esf_tpdf_prior.py
│       ├── test_tcr_cd_diagnostics.py
│       └── ...
└── README.md
```

### Key Design Choices

- **Pure NumPy** — no external CFD libraries, maximally portable
- **Dataclass config** — `CaseConfig` is an immutable frozen dataclass with full input validation
- **Smoke test first** — `run_local_shape.py` runs a workstation-friendly test in seconds
- **Modular diagnostics** — each diagnostic (TCR, ESF-TPDF, grid convergence) is a separate module
- **MPI optional** — `run_mom_parallel.py` uses MPI4Py for distributed runs

---

## 4. How to Run

### Requirements

```bash
pip install numpy matplotlib
# Optional (for parallel runs):
pip install mpi4py
```

### Workstation Smoke Test

```bash
git clone https://github.com/windcicada/shearlayer-combustion-DNS.git
cd shearlayer-combustion-DNS
python -m shearlayer_dns.run_local_shape
```

This runs a small 150×40 domain (lx = 150, t = 1.0) with WENO + RK3 and a sinusoidal perturbation. Expected runtime: a few seconds to a minute.

### MOM Reproduction

```bash
python -m shearlayer_dns.run_mom_reproduction \
    --nx 300 --ny 80 --lx 100.0 \
    --t-end 400 --cfl 0.5 \
    --flux weno --integrator rk3 \
    --perturbation-amplitude 0.02 \
    --perturbation-wavelength 30.0
```

### Grid Convergence

```bash
python -m shearlayer_dns.run_grid_convergence
```

### DNS–TPDF Prior Validation

```bash
python -m shearlayer_dns.run_dns_tpdf_validation
```

### H₂/O₂ Reacting Case

```bash
python -m shearlayer_dns.run_parallel_h2o2_cases
```

---

## 5. Sample Results

### DNS Velocity Field

{{< image src="./dns_velocity_context.png" caption="2-D temporally-developing shear layer at Re = 600. Vorticity contours show characteristic KH roll-up and pairing." width="100%" >}}

### DNS Four-Panel Context

{{< image src="./dns_context_four_panel.png" caption="Multi-field diagnostic panel: density, vorticity, mixture fraction, and reaction rate at t = 100." width="100%" >}}

### ESF-TPDF Prior Profiles

{{< image src="./esf_tpdf_profiles.png" caption="Conditional mean profiles from DNS prior analysis. Comparison of IEM, TCR, and DNS at different mixture fraction thresholds." width="100%" >}}

### Reaction Rate Scatter

{{< image src="./reaction_rate_scatter.png" caption="Scatter plot of instantaneous reaction rate vs mixture fraction. Red line shows DNS reference; blue markers show TPDF model predictions." width="100%" >}}

### TCR Diagnostics

| Diagnostic | Description |
|---|---|
| **C_D analysis** | Rate-ratio diagnostics quantifying the deviation of TCR closure from DNS ground truth |
| **κ sensitivity** | Parametric sweep of κ on mixing model accuracy |
| **Scale-constrained prior** | Effect of block-averaging scale on observed mixing behavior |

{{< image src="./tcr_r_c_map.png" caption="Spatial map of the TCR rate-ratio parameter r_c. Red = flamelet-like (r_c < 1), blue = well-mixed (r_c ≈ 1)." width="100%" >}}

{{< image src="./cd_lambda_scan.png" caption="C_D sensitivity to the mixing-dissipation coupling parameter λ. The optimal λ minimizes the gap between TCR and DNS." width="100%" >}}

### Physics-Constrained Optimization

{{< image src="./tcr_oracle_a_fields.png" caption="PhySO-optimized TCR coefficient a* across the shear layer. The optimizer discovers local mixing corrections that best match DNS reference data." width="100%" >}}

---

## 6. References

1. Wang, Y. & Wang, F. (2026). TCR: A Turbulence-Chemistry Recursive Micro-Mixing Model for LES-TPDF. *Under review.*
2. Dopazo, C. (1975). Probability density function approach for a turbulent axisymmetric heated jet. *Phys. Fluids*, 18(4), 397–404.
3. Pope, S. B. (1985). PDF methods for turbulent reactive flows. *Prog. Energy Combust. Sci.*, 11(2), 119–192.
4. Jiang, G.-S. & Shu, C.-W. (1996). Efficient implementation of weighted ENO schemes. *J. Comput. Phys.*, 126(1), 202–228.
5. Rusanov, V. V. (1961). Calculation of interaction of non-steady shock waves with obstacles. *J. Comput. Math. Phys. USSR*, 1, 267–279.

---

## Repository

**GitHub**: [github.com/windcicada/shearlayer-combustion-DNS](https://github.com/windcicada/shearlayer-combustion-DNS)

If you use this code in your research, please cite:

```bibtex
@software{wang_shearlayer_dns_2026,
  author = {Wang, Yudong},
  title = {ShearLayer-Combustion DNS: A Compressible Shear-Layer DNS for TCR Model Validation},
  year = {2026},
  url = {https://github.com/windcicada/shearlayer-combustion-DNS}
}
```

License: **MIT**

