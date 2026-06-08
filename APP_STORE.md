# HumanoidVerse — App Store Launch Kit

> Drafts / starting points, **not legal advice**. Review the privacy policy and your
> App Store privacy answers against your actual setup and Apple's current rules.

## Identity
- **Name:** HumanoidVerse
- **Subtitle (≤30):** Humanoid robot database
- **Bundle ID:** com.yourname.humanoidverse (set in Xcode → target → Signing)
- **Category:** Reference (primary); News (secondary, optional)
- **Age rating:** 4+

## ASO copy
- **Keywords (≤100, comma-separated, no spaces):**
  `humanoid,robot,robotics,android,AI,compare,specs,Optimus,Figure,Unitree,automation,Tesla`
- **Promotional text (≤170):**
  The fastest way to explore and compare the world's humanoid robots — live news, side-by-side specs, and a database that keeps updating itself.
- **Description (draft):**
  HumanoidVerse is the cleanest way to follow the humanoid robot boom.

  • Discover — a daily spotlight, the newest arrivals, and the whole field at a glance.
  • Robots — search and filter dozens of humanoids by category, maker, height and year.
  • Compare — put any two robots side by side with clear, winner-highlighted specs.
  • News — live headlines from across the industry, refreshed daily.

  Save favorites, share a robot or a comparison, and browse a database that grows
  automatically as new robots launch. Free, fast, no account required.

## App Privacy (App Store Connect answers)
Declare **"Data Not Collected."** Tracking: **No.**
Why: favorites are stored on-device (SwiftData); robot data and news are fetched from
public sources; there are no accounts, analytics, ads, or third-party SDKs.

## Privacy manifest
Add the provided `PrivacyInfo.xcprivacy` to the app target. It declares no tracking, no
collected data, and no required-reason APIs. If App Store Connect later flags a
required-reason API (most commonly **UserDefaults**), add this block to the manifest:
```xml
<key>NSPrivacyAccessedAPITypes</key>
<array>
  <dict>
    <key>NSPrivacyAccessedAPIType</key>
    <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
    <key>NSPrivacyAccessedAPITypeReasons</key>
    <array><string>CA92.1</string></array>
  </dict>
</array>
```

## Privacy policy
A policy URL is **required**. Host the provided `privacy.html` on your GitHub Pages site
(e.g. `https://mkandemirrr.github.io/humanoidverse/privacy.html`) and paste that URL into
App Store Connect. Fill in the contact email + effective date in the file.

## App icon
Export `AppIcon.svg` to a **1024×1024 PNG** (no transparency, no rounded corners — iOS
masks them), then drop it into Assets → AppIcon. Refine or replace as you like.

## Screenshots
Capture in the simulator. Apple currently requires **6.9″ iPhone** screenshots (6.5″ also
accepted). A strong set of 5: Discover, Robots list, a Compare result (pick two), a robot
Detail, News.

## Submit — checklist
1. Xcode: set Version `1.0`, Build `1`, team/signing, bundle id.
2. Product → Archive → Distribute App → App Store Connect → Upload.
3. App Store Connect: create the app; fill name/subtitle/keywords/description/promo;
   upload screenshots + icon; set privacy answers + policy URL; pick category + age rating.
4. Recommended: push to **TestFlight** and test on a real device first.
5. Add build → Submit for Review.
