# QIK for iPhone and Android

`qik-mobile/` is a real React Native/Expo project. It uses native screens, controls, bottom tabs, device secure storage and haptics. It does not wrap the earlier website in a WebView.

One shared codebase produces **two different apps**, each available on **both platforms**:

| App | Intended user | Default Android package / iOS bundle ID |
| --- | --- | --- |
| QIK | Customer | `com.qik.customer` |
| QIK Rider | Delivery rider | `com.qik.rider` |

Customer: shop, search, categories, saved bag, registration/login, UK checkout, order history, tracking and cancellation. Rider: login, assigned deliveries, acceptance, pickup, delivered confirmation and history. Both include the original QIK cream/ink/lime artwork, motion, touch feedback and failure/retry states. Orders and deliveries remain simulated; the admin dashboard controls picking/packing and assignment.

The source is ready to run in development and has Android/iOS JavaScript bundles checked. A native signed APK/AAB/IPA or an App Store listing has **not** been generated. Apple/Expo accounts, signing credentials and device testing remain your next steps. See `qik-mobile/VALIDATION.md` for exactly what was verified.

## 1. Start the backend and admin dashboard

From the extracted `QIK` folder, with Docker Desktop running:

```sh
chmod +x scripts/*.sh qik-backend/mvnw
./scripts/setup.sh
docker compose up --build
```

Open http://localhost:8080/#admin. Sign in with `admin@qik.demo` and the `DEMO_PASSWORD` value in the root `.env`. Demo customer and rider accounts use the same password: `customer@qik.demo` and `rider@qik.demo`.

The full original backend setup, persistence, migration and deployment instructions are in `README.md`.

## 2. Run QIK on your actual iPhone and Android phone

Install Node.js **22.13 or newer** (Node 22 LTS is suitable). Install the free **Expo Go** app on each phone. Use the Expo Go version that supports this project's Expo SDK 57. Both phones and your Mac must be on the same Wi-Fi for local testing.

For local phone access, add this line to the **root** `QIK/.env`:

```dotenv
QIK_BIND_ADDRESS=0.0.0.0
```

Then recreate the application port mapping:

```sh
docker compose up -d --build app
```

This makes the local backend reachable from your Wi-Fi devices. Use a trusted local network and turn this setting back to `127.0.0.1` when you no longer need phone access. The database remains bound to localhost.

Find your Mac's local IP in **System Settings → Wi-Fi → Details → TCP/IP**. For example, it might be `192.168.1.23`. In a second Terminal window, from QIK:

```sh
cd qik-mobile
npm ci
cp .env.example .env
```

Edit `qik-mobile/.env` and set your **actual** Mac IP:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.23:8080
```

The example IP above is a placeholder. **Do not use localhost on a physical phone**: that points to the phone, not your Mac. Alternatively, use your deployed backend's HTTPS URL and skip local port exposure.

Start the customer app:

```sh
npm run start:customer
```

Scan the Terminal QR code with your iPhone camera or Expo Go on Android. If the CLI targets a development build instead of Expo Go, press `s` to switch to Expo Go. Open QIK, sign in as `customer@qik.demo`, add a bag and place a simulated order.

To run the rider app alongside it, open another Terminal in `qik-mobile/`:

```sh
npm run start:rider -- --port 8082
```

Scan that second QR code on the rider's phone and use `rider@qik.demo`. In the browser admin dashboard, start picking, assign that rider, then mark the order packed. The rider can accept, pick up and deliver. Customer order status refreshes while the app is active; pull down on Orders/Deliveries to refresh manually.

Expo Go is a development container. A standalone QIK app with its own home-screen icon comes from the builds below. Never put passwords or JWT signing secrets in `EXPO_PUBLIC_…` variables: those values are bundled into the app. Only the public backend URL belongs there.

If the backend can't be reached: verify its URL from the phone's browser, check both devices are on the same Wi-Fi, check the Mac firewall allows the backend/Metro port, and restart Expo after editing `.env`. A Metro tunnel helps deliver the app bundle but does **not** automatically expose a localhost backend.

## 3. Run in simulators on your Mac

For iPhone Simulator install the full **Xcode** application, its iOS Simulator runtime, and select its developer tools. For Android install **Android Studio**, its SDK and an emulator. This machine currently had only Command Line Tools, so device/simulator installation was not performed here.

In `qik-mobile/.env` use:

| Target | Backend URL |
| --- | --- |
| iPhone Simulator on your Mac | `http://localhost:8080` |
| Standard Android Emulator | `http://10.0.2.2:8080` |
| Physical device | Your Mac's LAN IP or hosted HTTPS URL |

Build/run locally:

```sh
npm run ios:customer
npm run android:customer
```

For the rider app use `npm run ios:rider` or `npm run android:rider`. Local scripts generate native projects through Expo's prebuild process. When changing between customer/rider variants in a previously generated native checkout, regenerate the native directories with the correct variant first:

```sh
QIK_APP_VARIANT=rider npx expo prebuild --clean
```

`--clean` replaces generated `ios/` and `android/` directories. Do not put manual work in those generated folders; keep settings in `app.config.js` and plugins. iOS local builds require CocoaPods/Xcode setup; EAS cloud builds avoid maintaining those tools locally.

## 4. Build an installable Android APK and iPhone test app

Use your own [Expo account](https://expo.dev). The supplied `eas.json` has separate customer/rider profiles and separate application identities.

1. Deploy the Spring Boot backend using `README.md`. Set `EXPO_PUBLIC_API_URL` to the deployed **HTTPS** URL. Preview/production configs refuse to build without an HTTPS backend URL.
2. Choose a unique identifier prefix you own, e.g. `com.yourcompany.qik`, and set `QIK_APP_ID_PREFIX` in `.env`. The defaults are placeholders and may not be available in app stores.
3. Sign in to EAS from `qik-mobile/`:

```sh
npx eas-cli@latest login
```

4. Create/link the two Expo projects separately:

```sh
QIK_APP_VARIANT=customer npx eas-cli@latest init
QIK_APP_VARIANT=rider npx eas-cli@latest init
```

Because `app.config.js` is dynamic, the CLI may tell you it cannot write a project ID automatically. Copy the returned project UUIDs into `.env` as `QIK_CUSTOMER_PROJECT_ID` and `QIK_RIDER_PROJECT_ID`. Keep both values; `app.config.js` selects the correct one for each variant. If using the Expo dashboard instead, create `qik-customer` and `qik-rider` and copy their project IDs from project settings.

5. Load the non-secret URL/project configuration into your Terminal environment:

```sh
set -a
. ./.env
set +a
```

For **each** Expo project create its `preview` and `production` EAS environment variable `EXPO_PUBLIC_API_URL` with your HTTPS backend URL. If the account/project identity prefix differs from the default, supply `QIK_APP_ID_PREFIX` in those EAS environments as well. A public HTTPS URL is not a secret; choose plaintext visibility for this value so it can be embedded during bundling. Store the appropriate project ID in your local environment for each build. Do not upload JWT/database passwords to EAS client variables.

Build the two **Android APKs**:

```sh
QIK_APP_VARIANT=customer npx eas-cli@latest build --platform android --profile preview-customer
QIK_APP_VARIANT=rider npx eas-cli@latest build --platform android --profile preview-rider
```

EAS supplies an APK download/install link when each build succeeds. APKs can be installed directly on an Android phone with the normal device installation permission. A Play Store developer account is not needed just to test an APK.

For **iPhone internal testing**, register your test device with EAS and build each app:

```sh
npx eas-cli@latest device:create
QIK_APP_VARIANT=customer npx eas-cli@latest build --platform ios --profile preview-customer
QIK_APP_VARIANT=rider npx eas-cli@latest build --platform ios --profile preview-rider
```

EAS prompts for the Apple Developer account and provisioning steps. An iPhone installation must be signed for the registered device, or distributed through TestFlight. An arbitrary unsigned `.ipa` cannot simply be opened on any iPhone.

To build only for **iPhone Simulator** without physical-device distribution:

```sh
QIK_APP_VARIANT=customer npx eas-cli@latest build --platform ios --profile simulator-customer
QIK_APP_VARIANT=rider npx eas-cli@latest build --platform ios --profile simulator-rider
```

These builds cannot be installed on a real iPhone. Development-client profiles are also supplied (`development-customer`, `development-rider`) for testing native changes beyond Expo Go.

## 5. App Store and Google Play

When the release checks below are complete:

```sh
QIK_APP_VARIANT=customer npx eas-cli@latest build --platform all --profile production-customer
QIK_APP_VARIANT=rider npx eas-cli@latest build --platform all --profile production-rider
```

Production Android builds produce an AAB for Google Play; iOS builds are signed for App Store distribution. Submit to each app's store listing using the corresponding `production-customer` or `production-rider` EAS submit profile. Prefer an explicit build ID to avoid submitting the wrong variant. Complete store metadata, screenshots, review access and release controls yourself; building does not guarantee review approval or automatically publish an app.

Costs, checked 14 October 2026:

- Expo/React Native and Expo Go are free. EAS has a limited free, low-priority build quota; paid plans/overages depend on current usage. [Expo pricing](https://expo.dev/pricing), [plan limits](https://docs.expo.dev/billing/plans/).
- Apple Developer Program: **US$99 per year**, or local-currency pricing where available. [Apple membership](https://developer.apple.com/programs/whats-included/).
- Google Play Console registration: **US$25 once**. New personal accounts also have testing/verification requirements. [Google registration](https://support.google.com/googleplay/android-developer/answer/6112435).
- Backend/database hosting is separate. The supplied Render free demo database expires after 30 days; lasting hosting, domains, messaging and payment fees can add costs. See `README.md`.

No membership, build credit, hosting plan or store submission was purchased or used on your behalf.

## Release checks still needed

- Test on actual iPhone and Android devices: safe areas, keyboard, haptics, secure credential storage, app restart during checkout, slow network, denied connectivity, background/foreground and the entire customer/admin/rider flow.
- Address the dependency audit recorded in `qik-mobile/SECURITY.md`. Compatibility checks passing does not mean dependencies have no advisories.
- Implement account deletion/recovery, email verification, login abuse controls and admin MFA before public customer onboarding. Create a proper hosted privacy policy and store data-safety disclosures. No production privacy policy or account-deletion flow is claimed here.
- Replace demo inventory/credentials; deploy an HTTPS API with backups and appropriate access controls; supply review-only accounts to store reviewers through the store's secure app-access fields.
- This project still simulates payments and deliveries. Add actual payments/refunds/webhooks, service areas, real fulfilment, delivery proof, support and required retail information before accepting real orders. No camera, microphone or GPS access is needed by the current QIK apps.

## Source checks

In `qik-mobile/`:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx expo-doctor
npm run export:customer
npm run export:rider
```

Exports compile iOS and Android Hermes JavaScript plus a web QA bundle. They are **not APK/IPA installation files**; EAS/native compilation and signing produce those. The web target is included only to inspect the same native screen components when a simulator is unavailable.
