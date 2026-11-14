//! Versioned Athena workspace backup schema, aligned with layout-state.mjs.
use crate::{CATALOG, Result, catalog};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashSet};
#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct Placement {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    transform_origin: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    skew_x: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    skew_y: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    brightness: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    contrast: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    saturation: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    hue: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    blur: Option<f64>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    opacity: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    visible: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    z_index: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    object_id: Option<String>,
    x: f64,
    y: f64,
    pinned: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    rotation: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    scale_x: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    scale_y: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    scope: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    anchor: Option<String>,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Layout {
    version: u32,
    theme_id: String,
    room_id: String,
    time: String,
    placements: BTreeMap<String, Placement>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    environment: Option<Environment>,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Environment {
    preset: String,
    opacity: f64,
    horizon: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    target: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none", rename = "targetId")]
    target_id: Option<String>,
}
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct View {
    inspector_dock: String,
    #[serde(default = "default_width")]
    inspector_width: u32,
}
fn default_width() -> u32 {
    240
}
impl Default for View {
    fn default() -> Self {
        Self {
            inspector_dock: "right".into(),
            inspector_width: 240,
        }
    }
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Named {
    name: String,
    layout: Layout,
}
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Backup {
    version: u32,
    active: Layout,
    layouts: BTreeMap<String, Layout>,
    #[serde(default)]
    view: View,
    #[serde(default)]
    saved_layouts: Vec<Named>,
}
fn js_space(c: char) -> bool {
    matches!(c,'\u{0009}'..='\u{000d}'|'\u{0020}'|'\u{00a0}'|'\u{1680}'|'\u{2000}'..='\u{200a}'|'\u{2028}'|'\u{2029}'|'\u{202f}'|'\u{205f}'|'\u{3000}'|'\u{feff}')
}
fn instance_id(id: &str) -> bool {
    id.strip_prefix("instance-").is_some_and(|s| {
        s.len() == 36
            && s.bytes().enumerate().all(|(i, c)| {
                if [8, 13, 18, 23].contains(&i) {
                    c == b'-'
                } else {
                    c.is_ascii_digit() || (b'a'..=b'f').contains(&c)
                }
            })
    })
}
fn layout(v: &Layout) -> Result<()> {
    let c = catalog(CATALOG)?;
    let t = c
        .themes
        .iter()
        .find(|t| t.id == v.theme_id)
        .ok_or("Unknown layout theme")?;
    if !matches!(v.version, 1..=9)
        || !t.rooms.iter().any(|r| r.id == v.room_id)
        || !matches!(v.time.as_str(), "dawn" | "day" | "dusk" | "night")
    {
        return Err("Invalid layout version, room or time".into());
    }
    if v.version >= 4 {
        let env = v.environment.as_ref().ok_or("Missing room environment")?;
        if !matches!(env.preset.as_str(), "off" | "vapor" | "backrooms")
            || !env.opacity.is_finite()
            || !(0.0..=1.0).contains(&env.opacity)
            || !env.horizon.is_finite()
            || !(0.1..=0.9).contains(&env.horizon)
        {
            return Err("Invalid room environment".into());
        }
    }
    if v.version >= 5 {
        let env = v.environment.as_ref().ok_or("Missing environment")?;
        match env.target.as_deref() {
            Some("room") if env.target_id.is_none() => {}
            Some("object")
                if env.target_id.as_ref().is_some_and(|id| {
                    t.objects.iter().any(|o| o.id == *id) || (v.version >= 6 && instance_id(id))
                }) => {}
            _ => return Err("Invalid environment surface target".into()),
        }
    }
    if v.placements.len() > 100 {
        return Err("At most100 instances per room".into());
    }
    for (id, p) in &v.placements {
        if v.version == 9
            && !matches!(
                p.transform_origin.as_deref(),
                Some("tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br")
            )
        {
            return Err("Invalid transform origin".into());
        }
        if v.version >= 8 {
            for (value, lo, hi) in [
                (p.skew_x, -85., 85.),
                (p.skew_y, -85., 85.),
                (p.brightness, 0., 2.5),
                (p.contrast, 0., 2.5),
                (p.saturation, 0., 2.5),
                (p.hue, -180., 180.),
                (p.blur, 0., 20.),
            ] {
                let v = value.ok_or("Missing skew/filter field")?;
                if !v.is_finite() || v < lo || v > hi {
                    return Err("Skew/filter bounds exceeded".into());
                }
            }
        }

        if v.version >= 7 {
            let opacity = p.opacity.ok_or("Missing opacity")?;
            if !opacity.is_finite()
                || !(0.0..=1.0).contains(&opacity)
                || p.visible.is_none()
                || p.z_index.is_none_or(|z| z > 100000)
            {
                return Err("Invalid appearance fields".into());
            }
        }
        if v.version == 1
            && [p.rotation, p.scale_x, p.scale_y]
                .iter()
                .any(Option::is_some)
        {
            return Err("Transforms require layout version2".into());
        }
        if v.version >= 2 {
            let rotation = p.rotation.ok_or("Missing rotation")?;
            let x = p.scale_x.ok_or("Missing scaleX")?;
            let y = p.scale_y.ok_or("Missing scaleY")?;
            if !rotation.is_finite()
                || rotation.abs() > 360.
                || [x, y]
                    .iter()
                    .any(|n| !n.is_finite() || n.abs() < 0.05 || n.abs() > 8.)
            {
                return Err("Invalid transform bounds".into());
            }
        }
        if v.version >= 3 {
            let scope = p.scope.as_deref().ok_or("Missing scope")?;
            if !matches!(scope, "world" | "ui" | "sticker") {
                return Err("Invalid scope".into());
            }
            if scope == "sticker" {
                let key = p.anchor.as_deref().ok_or("Missing sticker anchor")?;
                if key.is_empty()
                    || key.len() > 64
                    || !key
                        .bytes()
                        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'-')
                {
                    return Err("Invalid stable anchor key".into());
                }
            } else if p.anchor.is_some() {
                return Err("Nonsticker anchor must be null".into());
            }
        }
        if !(if v.version >= 6 {
            (t.objects.iter().any(|o| o.id == *id) || instance_id(id))
                && p.object_id
                    .as_ref()
                    .is_some_and(|asset| t.objects.iter().any(|o| o.id == *asset))
        } else {
            t.objects.iter().any(|o| o.id == *id)
        }) || !p.x.is_finite()
            || !p.y.is_finite()
            || !(0.0..=1.0).contains(&p.x)
            || !(0.0..=1.0).contains(&p.y)
        {
            return Err("Invalid object or position".into());
        }
    }
    Ok(())
}
pub fn normalize(text: &str) -> Result<String> {
    if text.encode_utf16().count() > 1_000_000 {
        return Err("Workspace exceeds import limit".into());
    }
    let raw: serde_json::Value = serde_json::from_str(text)?;
    let reject_v1_fields = |layout: &serde_json::Value| -> Result<()> {
        let env = &layout["environment"];
        if layout["version"].as_u64().unwrap_or(0) < 5 {
            if env.get("target").is_some() || env.get("targetId").is_some() {
                return Err("Environment targets require layout version5".into());
            }
        } else if env.get("targetId").is_none() {
            return Err("Missing targetId".into());
        }

        if layout["version"].as_u64().unwrap_or(0) < 4 && layout.get("environment").is_some() {
            return Err("Environment requires layout version4".into());
        }
        if layout.get("version").and_then(serde_json::Value::as_u64) == Some(1)
            && let Some(p) = layout
                .get("placements")
                .and_then(serde_json::Value::as_object)
        {
            for placement in p.values() {
                if ["rotation", "scaleX", "scaleY"]
                    .iter()
                    .any(|key| placement.get(key).is_some())
                {
                    return Err("Transforms require layout version2".into());
                }
            }
        }
        if let Some(placements) = layout
            .get("placements")
            .and_then(serde_json::Value::as_object)
        {
            for p in placements.values() {
                if layout["version"] != 9 && p.get("transformOrigin").is_some() {
                    return Err("Origin requires version9".into());
                }
                if layout["version"].as_u64().unwrap_or(0) < 8
                    && [
                        "skewX",
                        "skewY",
                        "brightness",
                        "contrast",
                        "saturation",
                        "hue",
                        "blur",
                    ]
                    .iter()
                    .any(|key| p.get(key).is_some())
                {
                    return Err("Filters require version8".into());
                }
                if layout["version"].as_u64().unwrap_or(0) < 7
                    && ["opacity", "visible", "zIndex"]
                        .iter()
                        .any(|key| p.get(key).is_some())
                {
                    return Err("Appearance requires version7".into());
                }
                if layout["version"].as_u64().unwrap_or(0) < 6 && p.get("objectId").is_some() {
                    return Err("Instance asset identity requires version6".into());
                }
                if layout["version"].as_u64().unwrap_or(0) < 3 {
                    if p.get("scope").is_some() || p.get("anchor").is_some() {
                        return Err("Scopes require layout version3".into());
                    }
                } else if p.get("anchor").is_none() {
                    return Err("Missing anchor field".into());
                }
            }
        }
        Ok(())
    };
    reject_v1_fields(&raw["active"])?;
    if let Some(layouts) = raw["layouts"].as_object() {
        for layout in layouts.values() {
            reject_v1_fields(layout)?
        }
    }
    if let Some(named) = raw["savedLayouts"].as_array() {
        for item in named {
            reject_v1_fields(&item["layout"])?
        }
    }
    let mut v: Backup = serde_json::from_str(text)?;
    if !matches!(v.version, 1..=9) {
        return Err("Unsupported backup version".into());
    }
    layout(&v.active)?;
    if v.active.version > v.version {
        return Err("Workspace version cannot contain newer layout".into());
    }
    for (key, l) in &v.layouts {
        layout(l)?;
        if l.version > v.version {
            return Err("Workspace version cannot contain newer layout".into());
        }
        if key != &l.room_id {
            return Err("Layout key mismatch".into());
        }
    }
    v.layouts.insert(v.active.room_id.clone(), v.active.clone());
    if !matches!(v.view.inspector_dock.as_str(), "left" | "right" | "hidden")
        || !(180..=480).contains(&v.view.inspector_width)
    {
        return Err("Invalid inspector layout".into());
    }
    if v.saved_layouts.len() > 20 {
        return Err("At most 20 named layouts".into());
    }
    let mut names = HashSet::new();
    for n in &v.saved_layouts {
        if n.name.is_empty()
            || n.name.trim_matches(js_space) != n.name
            || n.name.encode_utf16().count() > 80
            || !names.insert(&n.name)
        {
            return Err("Invalid or duplicate layout name".into());
        }
        layout(&n.layout)?;
        if n.layout.version > v.version {
            return Err("Workspace version cannot contain newer layout".into());
        }
    }
    let mut output = serde_json::to_value(&v)?;
    fn restore_null(layout: &mut serde_json::Value) {
        if layout["version"].as_u64().unwrap_or(0) >= 5
            && layout["environment"].get("targetId").is_none()
        {
            layout["environment"]["targetId"] = serde_json::Value::Null;
        }
        if layout["version"].as_u64().unwrap_or(0) >= 3
            && let Some(p) = layout["placements"].as_object_mut()
        {
            for placement in p.values_mut() {
                if placement.get("anchor").is_none() {
                    placement["anchor"] = serde_json::Value::Null;
                }
            }
        }
    }
    restore_null(&mut output["active"]);
    if let Some(layouts) = output["layouts"].as_object_mut() {
        for l in layouts.values_mut() {
            restore_null(l);
        }
    }
    if let Some(presets) = output["savedLayouts"].as_array_mut() {
        for p in presets {
            restore_null(&mut p["layout"]);
        }
    }
    Ok(serde_json::to_string(&output)?)
}

pub(crate) fn require_storage_version(text: &str, schema: i64) -> Result<()> {
    let v: Backup = serde_json::from_str(text)?;
    if v.version == 9 && schema != 12 {
        return Err(
            "Origin backups require explicit upgrade-origins to schema12 and relaunch".into(),
        );
    }
    if v.version == 8 && schema < 11 {
        return Err(
            "Filter backups require explicit upgrade-filters to schema11 and relaunch".into(),
        );
    }
    if v.version == 7 && schema < 10 {
        return Err(
            "Appearance backups require explicit upgrade-appearance to schema10 and relaunch"
                .into(),
        );
    }
    if v.version == 6 && schema < 9 {
        return Err(
            "Instance backups require explicit upgrade-instances to schema9 and relaunch".into(),
        );
    }
    if v.version == 5 && schema < 8 {
        return Err(
            "Targeted environment backups require explicit upgrade-targets to schema8 and relaunch"
                .into(),
        );
    }
    if v.version == 4 && schema < 7 {
        return Err(
            "Environment backups require explicit upgrade-environment to schema7 and relaunch"
                .into(),
        );
    }
    if v.version == 3 && schema < 6 {
        return Err(
            "Scoped backups require explicit upgrade-scopes to schema6 and relaunch".into(),
        );
    }
    if v.version == 2 && schema < 5 {
        return Err(
            "Transform backups require explicit upgrade-transforms to schema5 and relaunch".into(),
        );
    }
    Ok(())
}
