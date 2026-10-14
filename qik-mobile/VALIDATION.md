# Mobile delivery verification

Verified on 14 October 2026 with Node 22.19, Expo SDK 57 and React Native 0.86.3.

## Passed

- TypeScript strict type check and Expo ESLint.
- Eight mobile domain tests: GBP calculation and rounding, free-delivery threshold, stock quantity limits, saved basket recovery, removal of unavailable product lines, UK postcodes and rider state transitions.
- Expo Doctor: **21/21 compatibility/configuration checks passed**.
- Customer export: Android and iOS Hermes JavaScript bundles plus web QA bundle.
- Rider export: Android and iOS Hermes JavaScript bundles plus web QA bundle. Variant-specific public environment and separate Metro cache identities prevent a customer bundle being reused as a rider interface.
- Backend Maven verification: **10 tests passed**, including an additional explicit-origin CORS check for local React Native Web QA. PostgreSQL schema and data from the isolated test instance were reused.
- React Native Web interaction checks against PostgreSQL: customer login, search, add-to-bag, restored bag after reload, checkout, persisted order; rider-only navigation/login, assigned order, acceptance, pickup and delivered confirmation; customer order then showed Delivered. Admin preparation/assignment used the same backend APIs.
- Runtime issues found during checks (stray text outside native Text components, web animation driver and variant selection) were corrected and the affected flow rechecked.
- Distinct customer/rider icons, schemes, native application IDs, EAS preview/production/development/simulator profiles, and an HTTPS URL requirement for release configurations are included.

## Not performed

- Actual native-device/simulator execution, native signing, APK/AAB/IPA compilation, EAS account linking, store submission or public backend hosting. This Mac had no full Xcode Simulator or Android SDK, and the user has not set up Expo/Apple accounts yet.
- Native-only haptics, Keychain/Keystore storage, device networking/safe-area/keyboard behavior and background transitions still need physical iPhone and Android tests.
- Exported Hermes bundles are not installation files. No signed installer or app-store listing is claimed.
- Dependency audit still reports known findings; see `SECURITY.md`. Passing source/config checks is not production security clearance.

Screenshots in the workspace's `../artifacts/native-…-preview.jpg` are the React Native Web QA rendering of the mobile screen components, not photos/screenshots from physical devices. Source ZIP excludes test artifacts, `.env`, native generated folders, build output and dependencies.
