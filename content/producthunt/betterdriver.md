# BetterDriver — Product Hunt Launch Kit

## Tagline
Accessibility-first Flutter package. Screen readers, Dynamic Type, and inclusive widgets — out of the box.

## Description
BetterDriver is a Flutter package that makes apps accessible by default. It automatically adds semantics to Material and Cupertino widgets, supports TalkBack and VoiceOver, handles Dynamic Type gracefully, and includes accessibility tests for CI.

**Key features:**
- Automatic semantics for standard Flutter widgets
- Full TalkBack (Android) and VoiceOver (iOS) support
- Dynamic Type without full UI rebuilds
- Respects Reduced Motion and high-contrast settings
- Ready-to-use CI accessibility tests

BetterDriver uses progressive enhancement: your app works without it, but with it, it becomes accessible to 1 billion people with disabilities.

## Target audience
- Flutter developers building consumer apps
- Product teams with accessibility compliance requirements
- Indie devs who care about inclusive design
- Engineering managers who want to ship accessible apps without rewrites

## Call to action
Add BetterDriver to your pubspec, run your app with a screen reader, and see the difference. PRs and feedback welcome.

**GitHub:** https://github.com/yourname/better_driver  
**pub.dev:** https://pub.dev/packages/better_driver

## First comment
Hey PH 👋

I built BetterDriver because I realized most Flutter apps ship with broken or missing accessibility support. Custom widgets are especially guilty — they look great but are invisible to screen readers.

BetterDriver fixes this at the architecture level, not through one-off patches.

It adds semantics automatically, handles Dynamic Type, respects system accessibility settings, and gives you CI tests so regressions don't slip in.

The principle is simple: inclusive design makes products better for everyone. Not a "nice to have." A baseline.

If you're building a Flutter app, try adding this package and running TalkBack or VoiceOver. You might be surprised at what you missed.

## Hashtags
#flutter #accessibility #opensource #inclusion #dart
