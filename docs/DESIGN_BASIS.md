# Villa Como — basis of design & limits of the showroom

## Source document

MÈTRE design & architecture, **«Дизайн-проект. Вилла на озере Комо»**, working documentation (revision file dated 09.02.2026).

This repository contains **a visual client demo**, not a CAD/BIM conversion or an electrical installation package. The source PDF in the project context is not redistributed here.

### Architectural references

| PDF sheet | Meaning | Demo use |
| --- | --- | --- |
| A-03–A-06 | Measured plans of garage, levels 1–3 | Overall massing and number of levels |
| A-10–A-13 | Wall/partition installation plans | Organization of floor-plan sections |
| A-18 | Garage furniture plan | Garage, lab, storage, WC, technical room, wine cellar |
| A-19 | Furniture plan, level 1 | Apartment, fireplace lounge, study, entry, staff and utility spaces |
| A-20 | Furniture plan, level 2 | Main lounge, master suite, guest bedrooms, dining, kitchen, terrace |
| A-21 | Furniture plan, level 3 | Playroom, bedroom, WC, attic utilities |
| A-34–A-37 | Lighting device/switch plans | Lighting group references and physical switch types |
| A-30–A-33 | Electrical outlet plans | Context only — not automatically switched as light circuits |

**Listed room totals from source:**

- Garage: 138.72 m² (A-18).
- Level 1: 247.85 m² (A-19).
- Level 2: 262.24 m² (A-20), including terrace/balcony **22.51 m²**.
- Level 3: 66.79 m² (A-21).

The visualization is a **stylized finished villa**: light stone facade, warm pitched roofs, masonry belt courses, illuminated glazing, terrace guardrail/furniture, landscaped grounds and a separate garage. Roof geometry, facade design, elevations, orientation on site, trees and driveway are artist's interpretation: the referenced plan sheets do not confirm the exterior architecture.

### Lighting abstractions

Physical wiring is represented as room/area dimmable groups: the UI controls **circuits/groups, not individual bulbs**. Conceptual mappings are retained in `src/data/villa.js` through `ref`, allowing later replacement with an audited relay/controller map.

Examples grounded in sheet labeling:

- Level 2 main lounge: A-36 group 8.1–8.9 (visual split into main and accent).
- Dining: A-36 groups 11.1–11.2.
- Kitchen: A-36 groups 12.1–12.3.
- Level 1 study: A-35 groups 11.1–11.4.
- Level 1 hall: A-35 groups 10.1–10.2.
- Upper floor children's/play area: A-37 groups 2.1–2.2.
- Upper floor bedroom: A-37 groups 3.1–3.2.
- Garage: A-34 has gate opening sensors and switching information.

References marked **“ориентир”** are indicative and must be cross-checked against fully legible source group tags. References marked **“демонстрац.”** are placeholder visualization groupings without asserted circuit equivalence.

## Demo functionality

- 3D exterior: drag to orbit, mouse wheel / pinch to zoom, reset view.
- Floor isolate mode: level 1, 2, 3, garage. Roofs and upper external volumes hidden to inspect furnished plan.
- In-floor illuminated markers: click area to select a group.
- Seven light presets; per-group intensity 0–100%; scene switching resets overrides.
- Day/dusk/night changes the presentation environment, **not real time**.
- Auto demo tour cycles scenes/floor viewpoints.
- Local PNG screenshot.
- Responsive control sidebar; iPhone-size panel slides in/out.

## Engineering boundary — mandatory before real integration

The PDF documents include single-key, two-key, three-key, two-way, intermediate and **Master** switching. A smart-home controller must not replace physical multi-location control with Wi-Fi-only actions.

Before any live device integration:

1. Create verified inventory `physical circuit -> luminaire set -> switching points -> protective device -> module/channel -> addressing`.
2. Choose the wired/relay and/or wireless topology with safe **local physical control when Wi-Fi and Internet are down**, including appropriate latching/bypass behaviour.
3. Obtain electrical designer review for mains voltage, relay load/inrush, dimming compatibility, cable count, enclosure sizes, isolation and circuit protection.
4. Add hardware-level emergency/off behaviour, manual local override and commissioning tests; never equate a simulated button with verified fail-safe behavior.
5. In software, replace `getLevels` demo state with device readback and command acknowledgments; show offline/unavailable and manual-switch status explicitly.

## Acceptance checks

- `npm run build` succeeds.
- Every scenario maps all groups to a bounded intensity.
- `off` returns zero for all groups, `full` returns 100 for all.
- Selecting a floor changes camera/view and labels; selecting a group zooms to its floor.
- On phone, the control panel can be opened and closed without hiding the model permanently.
