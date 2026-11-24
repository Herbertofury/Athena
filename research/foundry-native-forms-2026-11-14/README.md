# Native Foundry source-form rendering
Adapted CSS ecology forms from the already reviewed MIT Feature Foundry source, src/styles/premium.css, into the same-document Athena workspace. Orb, tower/console, chair and sign geometry reuse source concepts; no third-party images or artist catalog. All 17 already-reviewed palettes now affect the room and forms. Time-of-day changes retain palette identity.

Text labels and accessible button names remain primary. Forms are decorative and hidden from assistive technology. No animation loop, media autoplay, network request or provider account action is introduced.

Normalized layout coordinates remain unchanged in storage, but visual positions clamp to safe room bounds. Previously an imported x/y of 0 or 1 clipped the object/label. Hosted browser checks now assert all object rectangles and labels remain inside the room at desktop and 390px width; a 320px check also rejects default-layout overlaps. Independent review identified the narrow-screen sizing risk; responsive cards and edge clamps address it.

This is CSS ecology-form and palette parity, not original cinematic 3D/mascot/artist-world parity. Source repositories remain intact. Full npm tests and 21 focused Foundry tests are local gates; exact-head hosted browser outcomes are separate.
