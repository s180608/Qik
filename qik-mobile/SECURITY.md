# Mobile security and dependency status

The app stores phone sign-in tokens through Expo SecureStore, uses the backend's role and ownership checks, validates quantities/postcodes, and persists a checkout retry key across an interrupted app session. Customer and rider identities are separate native app IDs. Product illustrations are bundled original assets. There are no card fields or location/camera/microphone requirements in the QIK interfaces.

Development configurations allow HTTP for a local Mac backend. Preview/production app config requires `EXPO_PUBLIC_API_URL` to be HTTPS and disables Android cleartext traffic. Never place database passwords or the JWT signing key in public Expo environment variables.

## Dependency audit on 14 October 2026

`npm audit` reported **28 package findings: 18 high and 10 moderate**, including findings propagated through the Expo/React Native dependency graph. The underlying advisories shown by the registry include:

- `braces` stack-exhaustion denial of service through deeply nested patterns (installed version 3.0.3).
- `node-forge` RSA signature-verification issue (installed affected 1.4.0 range).
- `decode-uri-component` malformed-input denial of service, used indirectly by navigation URI handling.
- `uuid` buffer bounds checking in affected v3/v5/v6 APIs in older versions used indirectly by tooling. QIK's own checkout UUID is generated with `expo-crypto`.

Several findings originate in development/build dependencies, but this is **not an exploitability assessment or a claim that all findings are harmless**. Review the current advisory paths before any public release.

The Expo template and installed SDK-compatible modules were retained. Expo's compatibility checker passes, but that does not clear security advisories. Registry checks found the latest `braces` and `node-forge` releases still in the reported affected ranges. The available URI decoder/UUID fixes introduce module/API changes in transitive consumers; replacing them blindly is not a verified fix.

Do not use `npm audit fix --force` as an automatic solution: the suggested graph changes included downgrading Expo to SDK 44 and React Native to 0.72, which are incompatible with this SDK 57 project. Upgrade to a compatible patched SDK/package set, or review/test targeted upstream patches, before store/public release. Re-run the checks, both platform exports and actual-device tests after dependency changes. This source is suitable for local simulated development, with this limitation documented.

## Before public customer onboarding

Implement account deletion and recovery, email verification, abuse/rate limiting, admin MFA, appropriate privacy/retention disclosures and actual device security tests. Use a hosted HTTPS backend with protected database access and monitored backups. Disable demo accounts before accepting real users. App-store account/deletion/privacy requirements and real payment/fulfilment work are listed in `../MOBILE.md` and `../README.md`.
