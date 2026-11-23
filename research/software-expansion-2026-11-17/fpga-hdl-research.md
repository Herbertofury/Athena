# FPGA and HDL software research — 2026-11-17

## Scope

This is a source-level catalog expansion, not a claim of physical FPGA board validation. Product identity, capabilities, licensing, pricing and platform fields are sourced separately. "Active" records upstream release or repository activity only; it does not prove an installed build, security audit, hardware compatibility or stable package availability.

## Open-source design flow

| Stage | Tool | Scope and caveat |
| --- | --- | --- |
| RTL synthesis | [Yosys](https://github.com/YosysHQ/yosys) | Verilog-2005 and a synthesizable SystemVerilog subset; ISC. |
| Place and route | [nextpnr](https://github.com/YosysHQ/nextpnr) | Timing-driven implementation for documented architectures; experimental backends remain experimental. |
| VHDL simulation | [GHDL](https://github.com/ghdl/ghdl) | Native-code VHDL analysis and simulation; VHDL-2008/2019 support is partial and synthesis is experimental. |
| Verilog simulation | [Icarus Verilog](https://github.com/steveicarus/iverilog) | Event-driven compiler and VVP runtime; SystemVerilog support is incomplete. |
| Compiled simulation and lint | [Verilator](https://github.com/verilator/verilator) | Generates C++/SystemC models; requires a harness and is not a traditional event-driven simulator. |
| Python testbenches | [cocotb](https://github.com/cocotb/cocotb) | Verification framework, not a simulator; simulator interfaces and host support vary. |
| Formal checking | [SBY](https://github.com/YosysHQ/sby) | Yosys-based formal front-end; solver and engine licenses are separate. The project has historically been called SymbiYosys. |
| Waveform inspection | [GTKWave](https://github.com/gtkwave/gtkwave) | Views simulator traces; viewer only. Legacy macOS binary has compatibility caveats. |
| Bundled environment | [OSS CAD Suite](https://github.com/YosysHQ/oss-cad-suite-build) | Packages several open-source tools for Windows, macOS and Linux; each component retains its own license and device-support limits. |

## Vendor suites

- [AMD Vivado Design Suite](https://www.amd.com/en/products/software/adaptive-socs-and-fpgas/vivado.html): integrated vendor flow for AMD FPGA and adaptive-SoC families. The 2026.1 licensing page describes BASIC, CORE, PRO, ENTERPRISE and GOLD tiers; the tier/device matrix must be checked before adoption. Current 2026.2 host OS documentation is separate from older releases.
- [Altera Quartus Prime](https://www.altera.com/products/software-tools/quartus-prime): Lite is a free, no-license-file edition for selected devices. Standard and Pro have different device and feature coverage. Do not treat "free" as equivalent to unrestricted device support.

## Evidence references

All links below were checked on 2026-11-17.

- Yosys v0.71 release (2026-11-12): https://github.com/YosysHQ/yosys/releases/tag/v0.71
- nextpnr 0.11.1 release (2026-08-11): https://github.com/YosysHQ/nextpnr/releases/tag/nextpnr-0.11.1
- GHDL v6.0.0 release (2026-03-07): https://github.com/ghdl/ghdl/releases/tag/v6.0.0
- Icarus Verilog v13_0 release (2026-03-02): https://github.com/steveicarus/iverilog/releases/tag/v13_0
- cocotb v2.1.0 release (2026-08-30): https://github.com/cocotb/cocotb/releases/tag/v2.1.0
- Verilator upstream source commit (2026-11-17): https://github.com/verilator/verilator/commit/8d39b26906b819c59294de34ef1bb800d572d652
- SBY upstream rename/source commit (2026-11-16): https://github.com/YosysHQ/sby/commit/b21f778333efc1e7c33fe22b56d43f87e4f759d4
- GTKWave upstream source commit (2026-11-03): https://github.com/gtkwave/gtkwave/commit/e40ba7937336824f12f7db870ea36f6f090dd90d
- OSS CAD Suite distribution release (2026-11-17): https://github.com/YosysHQ/oss-cad-suite-build/releases/tag/2026-11-17
- AMD Vivado licensing options: https://www.amd.com/en/products/software/adaptive-socs-and-fpgas/vivado/vivado-licensing-options.html
- AMD Vivado supported operating systems: https://docs.amd.com/r/en-US/ug973-vivado-release-notes-install-license/Supported-Operating-Systems
- Altera Quartus Prime product and edition overview: https://www.altera.com/products/software-tools/quartus-prime
- Altera Quartus Prime 25.3 OS requirements: https://docs.altera.com/r/docs/683472/25.3/altera-fpga-software-installation-and-licensing/operating-system-requirements

## Remaining validation

1. Select actual boards and record exact FPGA part numbers, package and speed grade.
2. Run an open-source flow only when the board's architecture database and bitstream utilities are documented for that exact part.
3. Run a vendor flow using the exact device family and edition.
4. Preserve reproducible source fixtures, tool versions, constraints, synthesis logs, timing reports and bitstream hashes.
5. Validate safe programming and board behavior on owned hardware; never infer electrical or safety correctness from a successful simulation.
6. Compare language support using small, explicit Verilog/SystemVerilog/VHDL fixtures and preserve simulator-specific failures.
