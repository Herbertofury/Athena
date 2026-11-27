use athena_defense_placement::skirmish::{BASE, OUTPOST, Outcome, Reject, Skirmish, Tower};
use std::io::Write;
use std::process::{Command, Stdio};

#[test]
fn sitting_out_defense_loses_and_stops_clock() {
    let mut s = Skirmish::default();
    for _ in 0..40 { s.advance(); }
    assert_eq!(s.outcome(), Outcome::Lost);
    assert_eq!(s.base_hp(), 0);
    let t = s.clock();
    s.advance();
    assert_eq!(s.clock(), t);
    assert_eq!(s.build(2,Tower::Bolt), Err(Reject::Finished));
}

#[test]
fn sortie_has_cost_and_benefit_and_no_required_progression() {
    let mut s = Skirmish::default();
    assert_eq!(s.build(BASE, Tower::Bolt), Err(Reject::InvalidPad));
    assert_eq!(s.ore(), 12);
    assert_eq!(s.next_wave(), Some(5));
    s.build(19, Tower::Bolt).unwrap();
    assert_eq!(s.build(25, Tower::Bolt), Err(Reject::InsufficientOre));
    assert_eq!(s.build(19, Tower::Pulse), Err(Reject::AlreadyBuilt));
    assert_eq!(s.ore(), 5);
    s.order(OUTPOST).unwrap();
    for _ in 0..5 { s.advance(); }
    assert!(s.outpost_held());
    assert!(s.squad().unwrap().hp < 6);
    assert_eq!(s.ore(), 12);
    s.build(25, Tower::Pulse).unwrap();
    for _ in 0..6 { s.advance(); }
    s.build(41, Tower::Pulse).unwrap();
    s.build(6, Tower::Bolt).unwrap();
    for _ in 0..40 { s.advance(); }
    assert_eq!(s.outcome(), Outcome::Won);
    assert!(s.base_hp() > 0);
}

#[test]
fn terminal_player_can_capture_and_win() {
    let mut child = Command::new(env!("CARGO_BIN_EXE_outpost"))
        .stdin(Stdio::piped()).stdout(Stdio::piped()).spawn().unwrap();
    child.stdin.take().unwrap().write_all(b"bolt 1 2\nmove 4 2\nwait 5\npulse 7 2\nwait 6\npulse 5 4\nbolt 6 0\nwait 40\n").unwrap();
    let received = child.wait_with_output().unwrap();
    assert!(received.status.success());
    let text = String::from_utf8(received.stdout).unwrap();
    assert!(text.contains("HELD (+2 ore/tick)"), "{text}");
    assert!(text.contains("VICTORY"), "{text}");
    assert!(!text.contains("Order refused"), "{text}");
}

#[test]
fn terminal_player_can_win_without_expansion() {
    let mut child = Command::new(env!("CARGO_BIN_EXE_outpost"))
        .stdin(Stdio::piped()).stdout(Stdio::piped()).spawn().unwrap();
    child.stdin.take().unwrap().write_all(b"bolt 1 2\nwait 2\nbolt 7 2\nwait 7\nbolt 6 0\nwait 7\nbolt 5 4\nwait 40\n").unwrap();
    let received = child.wait_with_output().unwrap();
    assert!(received.status.success());
    let text = String::from_utf8(received.stdout).unwrap();
    assert!(text.contains("VICTORY"), "{text}");
    assert!(!text.contains("HELD"), "{text}");
    assert!(!text.contains("Order refused"), "{text}");
}

#[test]
fn host_previews_neither_reserve_ore_nor_replace_existing_squad_order() {
    let mut s = Skirmish::default();
    s.order(OUTPOST).unwrap();
    assert_eq!(s.preview_move(OUTPOST).unwrap().into_iter().collect::<Vec<_>>(), [14,13,22]);
    assert_eq!(s.preview_move(17).unwrap().into_iter().collect::<Vec<_>>(), [16,17]);
    assert_eq!(s.preview_move(usize::MAX), Err(Reject::NoRoute));
    assert_eq!(s.preview_build(19,Tower::Pulse), Ok(()));
    assert_eq!(s.ore(),12);
    assert!(s.towers().is_empty());
    s.build(25,Tower::Bolt).unwrap();
    assert_eq!(s.build(19,Tower::Pulse),Err(Reject::InsufficientOre));
    s.advance();
    assert_eq!(s.squad().unwrap().cell,14);
}
