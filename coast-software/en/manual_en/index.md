# COAST v1 Quick Guide


This concise guide helps international users install and validate the COAST v1 release on a Linux x86_64 HPC cluster. For the authoritative release details, consult `COAST.v1-USER_MANUAL.pdf` included with the download.

## 1. What is included

COAST v1 provides a source-free target-system linking package and two complete example-data packages.

- `COAST.v1-SourceFile.tar.gz`: object files, libraries, scripts, mechanisms, schema, and runtime assets. It does **not** contain source code, `.mod` files, or a final executable.
- `COAST.v1-GTMC-ExampleData.tar.gz`: fixed at 128 MPI ranks.
- `COAST.v1-FlameD-ExampleData.tar.gz`: fixed at 192 MPI ranks.

Each archive has a matching `.sha256` file outside the archive. Do not rename the extracted `AECSC-D.1-*` directories; their names are retained for script and data compatibility.

## 2. Verify and unpack

```bash
sha256sum -c COAST.v1-SourceFile.tar.gz.sha256
sha256sum -c COAST.v1-FlameD-ExampleData.tar.gz.sha256
sha256sum -c COAST.v1-GTMC-ExampleData.tar.gz.sha256

tar -xzf COAST.v1-SourceFile.tar.gz
tar -xzf COAST.v1-FlameD-ExampleData.tar.gz
tar -xzf COAST.v1-GTMC-ExampleData.tar.gz
```

Only unpack after checksum verification succeeds. The `.sha256` files must be in the same directory as their corresponding archives.

## 3. Link on the destination cluster

Load the required modules and run the package scripts on the destination system:

```bash
cd AECSC-D.1-SourceFile-Link
module purge
module load gcc/7.3.0
module load mpi/openmpi/4.1.1-gcc7.3.0

./scripts/target_link.sh
./scripts/target_verify.sh

INSTALL=$(pwd)
test -x "$INSTALL/bin/aecsc"
```

Both commands must return successfully. `target_verify.sh` checks package integrity, dependencies, and RPATH. Do not copy `lib/`, `registry/`, `Fuels/`, `schema/`, or `scripts/` from another release into this installation.

## 4. Validate an example first

Inputs are independent and should be kept read-only. Write outputs outside the input roots. The following validates GTMC without advancing time steps:

```bash
PROJECT=/path/to/project
INSTALL="$PROJECT/AECSC-D.1-SourceFile-Link"
GTMC="$PROJECT/AECSC-D.1-GTMC-ExampleData"
mkdir -p "$PROJECT/runs/gtmc"

"$INSTALL/bin/aecsc" "$GTMC/case.json" --print-resolved > "$PROJECT/runs/gtmc/case.resolved.json"
mpirun -np 128 "$INSTALL/bin/aecsc" "$GTMC/case.json" \
  --validate --output "$PROJECT/runs/gtmc"
```

Use 192 ranks for the FlameD example. A successful `--validate` confirms configuration, paths, and the MPI-rank contract; it is not a production simulation.

## 5. Run through your scheduler

Load the same compiler/MPI modules used for linking, then expose the package libraries and executable:

```bash
export LD_LIBRARY_PATH="$INSTALL/lib:${LD_LIBRARY_PATH:-}"
export PATH="$INSTALL/bin:${PATH}"
```

In the Slurm job script, always call `"$INSTALL/bin/aecsc"` by its absolute path. GTMC is designed for 128 ranks (typically two nodes with 64 ranks each); FlameD is designed for 192 ranks (typically three nodes with 64 ranks each). Adapt the scheduler directives to your local cluster policy.

## 6. Important rules

You may modify research parameters in `case.json` and create new JSON files in your own working directory. Keep the distributed `boundary_conditions.d`, `Restart/`, `Decomp/`, `mesh_identity.*`, and the installation assets `lib/`, `registry/`, `Fuels/`, `schema/`, and `scripts/` unchanged.

If an error reports a missing expanded path, return to the installation that passed `target_verify.sh`. If an MPI launch refers to a Slurm temporary directory, replace the relative executable path with `"$INSTALL/bin/aecsc"`.

[中文完整说明 / Chinese Guide →](/coast-software/manual/)
