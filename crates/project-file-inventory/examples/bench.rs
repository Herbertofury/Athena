//! Synthetic warm-cache metadata benchmark; not NTFS or cold-disk evidence.
use std::{fs, path::Path, sync::atomic::AtomicBool, time::Instant};
fn baseline(path: &Path) -> u64 {
    let mut n = 0;
    for e in fs::read_dir(path).unwrap() {
        let e = e.unwrap();
        let m = fs::symlink_metadata(e.path()).unwrap();
        n += 1;
        if m.is_dir() {
            n += baseline(&e.path());
        }
    }
    n
}
fn main() {
    let root = std::env::temp_dir().join(format!("inventory-bench-{}", std::process::id()));
    fs::create_dir_all(&root).unwrap();
    for d in 0..100 {
        let p = root.join(d.to_string());
        fs::create_dir(&p).unwrap();
        for f in 0..100 {
            fs::write(p.join(f.to_string()), b"fixture").unwrap();
        }
    }
    let mut old = Vec::new();
    let mut new = Vec::new();
    for pass in 0..12 {
        for optimized in if pass % 2 == 0 {
            [false, true]
        } else {
            [true, false]
        } {
            let start = Instant::now();
            let count = if optimized {
                let r = project_file_inventory::walk(&root, &AtomicBool::new(false), |v| {
                    v.unwrap();
                });
                assert_eq!(r.errors, 0);
                r.entries
            } else {
                baseline(&root)
            };
            assert_eq!(count, 10100);
            let elapsed = start.elapsed().as_secs_f64() * 1000.;
            if optimized {
                new.push(elapsed)
            } else {
                old.push(elapsed)
            }
        }
    }
    old.sort_by(f64::total_cmp);
    new.sort_by(f64::total_cmp);
    println!(
        "10100 entries, 12 alternating warm runs; baseline stat-per-entry median_ms={:.3}, directory-entry-type median_ms={:.3}; no file contents read",
        old[6], new[6]
    );
    fs::remove_dir_all(root).unwrap();
}
