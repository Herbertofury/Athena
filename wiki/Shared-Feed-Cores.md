# Shared feed and ticker cores

Athena owns the reusable `feed-core` and `ticker-core` source. Consumer products
choose their own interface; INTA exposes its integrated experience as **News**.

- [Core catalog, exact-source consumption and verification](https://github.com/Herbertofury/Athena/blob/main/cores/README.md)
- [feed-core API, portable preferences and date/attribution rules](https://github.com/Herbertofury/Athena/blob/main/cores/feed-core/README.md)
- [ticker-core lifecycle, motion controls and host responsibilities](https://github.com/Herbertofury/Athena/blob/main/cores/ticker-core/README.md)
- [Shared capability routing index](https://github.com/Herbertofury/Athena/blob/main/guidance/registry/shared-capabilities.json)

Consumers bundle pinned source locally and keep independent offline operation.
The source and contract fixtures are implemented; full independent second-host
acceptance and GameSync feature parity remain open. A shared source is not an
automatic claim that every platform has shipped or that a live workflow ran.

