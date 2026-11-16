# Vault utilities: distinguish integration fixes from cryptographic guarantees

Reviewed 2026-11-15. Independent release-risk analysis only; no password database, key, credential or personal file was accessed.

## KeePassXC 2.8.0

The [official announcement](https://keepassxc.org/blog/2026-10-21-2.8.0-released/) dates the stable release to October 21, 2026. It introduces native Windows ARM64 builds, Qt6 and optional external-tool database synchronization, alongside security fixes.

Two reviewed advisories clarify why version and integration matter:
- [Browser entry-reference injection](https://github.com/keepassxreboot/keepassxc/security/advisories/GHSA-2vm2-vmc3-vccr): versions from 2.3.0 through those before 2.8.0 are affected; 2.8.0 is patched. A malicious site's saved entry could cause other entry data to be disclosed when filled. Upstream rates this moderate. This is not a claim that the database encryption was broken.
- [Windows Pageant shared-memory naming](https://github.com/keepassxreboot/keepassxc/security/advisories/GHSA-mffq-j98j-wfr2): the same affected range is listed, with 2.8.0 patched. The advisory requires a local attacker under the same user. The naming mitigation does not eliminate all same-user memory-observation risks. Upstream rates it low.

Both advisories were published September 23, 2026. No exploit proof-of-concept was downloaded or run.

The [download page](https://keepassxc.org/download/) identifies Windows 10/11 x64 and ARM64 builds and an MSVC runtime requirement. Legacy Windows installers stop at 2.7.12; retaining an old supported OS path must not be confused with receiving the newer security fixes.

The [COPYING file](https://github.com/keepassxreboot/keepassxc/blob/develop/COPYING) specifies GPL version 2 or, at the recipient's option, version 3, and contains component notices. Pin and inspect exact files/dependencies for reuse rather than assuming uniform license terms. External synchronization is an added data-transfer boundary, not permission to connect a vault to a new destination.

## Cryptomator 1.19.6

The [official release](https://github.com/cryptomator/cryptomator/releases/tag/1.19.6) fixes rejection of supporter certificates after signing-certificate rotation by evaluating the chain at issue time. Do not inflate this into a claim of repaired encryption or compromised vaults. The rendered release date showed October 30 without a year, so its full publication date is unverified in this note.

The [Windows download page](https://cryptomator.org/downloads/win/) specifies Windows 10 version 1803 minimum. Its EXE bundles the third-party WinFsp driver; an MSI without dependencies is also offered. The linked portable distribution is community-maintained, not an officially maintained Skymatic build. These differences matter for installation review and support expectations.

The [repository](https://github.com/cryptomator/cryptomator#license) describes GPLv3 and an alternative commercial license. Review exact source and dependency licenses before incorporation; this note neither imports code nor obtains a commercial grant.

## Verification boundary

No installs, security-setting changes, database imports, keys, new synchronization destinations, exports or browser integrations were performed. No application compatibility, recovery or cryptographic test is claimed. A future authorized evaluation should use synthetic non-sensitive databases and preserve recoverable copies.

No catalog record, runtime manifest or generated database is changed by this research note. Upstream security fixes and installation documentation are evidence, not a universal ranking or guarantee.
