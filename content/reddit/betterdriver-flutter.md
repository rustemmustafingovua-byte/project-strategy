**Title: BetterDriver — an accessibility-first Flutter package that just works**

Hey r/FlutterDev,

I just published **BetterDriver**, a Flutter package that makes apps accessible out of the box. No more sprinkling `Semantics` widgets manually — this handles it at the architecture level.

**The problem:**  
Flutter is great for cross-platform, but accessibility (TalkBack, VoiceOver, Dynamic Type, Reduced Motion) is often an afterthought, especially in custom widgets. Most apps ship with broken or incomplete accessibility support.

**What BetterDriver does:**
- Automatically adds semantics to Material and Cupertino widgets
- Full TalkBack (Android) and VoiceOver (iOS) support
- Dynamic Type without full UI rebuilds
- Respects `MediaQuery.of(context).disableAnimations`
- Ready-to-use accessibility tests for CI

**Key principle:** progressive enhancement.  
Your app works without BetterDriver, but with it, it becomes accessible. Zero breaking changes, zero rewrites.

**Why this matters:**  
1 billion people have disabilities. If your app isn't accessible, you're excluding ~15% of potential users. This isn't a "nice to have" — it's a business requirement.

**Links:**
- GitHub: https://github.com/yourname/better_driver
- pub.dev: https://pub.dev/packages/better_driver

I'd love feedback from the Flutter community, especially from anyone who has struggled with accessibility in custom widgets. PRs welcome.

---

*Inclusive design makes products better for everyone.*
