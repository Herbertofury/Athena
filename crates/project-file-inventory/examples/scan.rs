use project_file_inventory::{ntfs_volume, walk};
use std::{path::Path, sync::atomic::AtomicBool, time::Instant};
fn main() {
    let arg = std::env::args()
        .nth(1)
        .expect("scan <folder> OR --volume=C");
    let flag = AtomicBool::new(false);
    let start = Instant::now();
    if let Some(d) = arg.strip_prefix("--volume=") {
        assert_eq!(d.len(), 1);
        println!(
            "{:?}",
            ntfs_volume(d.chars().next().unwrap(), &flag, |_| {})
        );
    } else {
        println!(
            "{:?}",
            walk(Path::new(&arg), &flag, |v| {
                if let Err(e) = v {
                    eprintln!("{e}");
                }
            })
        );
    }
    eprintln!("elapsed={:?}; metadata enumeration only", start.elapsed());
}
