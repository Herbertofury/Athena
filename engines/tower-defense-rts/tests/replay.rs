use athena_defense_placement::{replay::{Battle,Command::*,Error},skirmish::{Outcome,Skirmish}};

fn equivalent(a:&Skirmish,b:&Skirmish){
    assert_eq!(a.clock(),b.clock());
    assert_eq!(a.ore(),b.ore());
    assert_eq!(a.base_hp(),b.base_hp());
    assert_eq!(a.outpost_held(),b.outpost_held());
    assert_eq!(a.outpost_garrison(),b.outpost_garrison());
    assert_eq!(a.squad(),b.squad());
    assert_eq!(a.towers(),b.towers());
    assert_eq!(a.invaders(),b.invaders());
    assert_eq!(a.next_wave(),b.next_wave());
    assert_eq!(a.outcome(),b.outcome());
}
#[test]
fn cold_checkpoint_in_live_wave_resumes_to_same_victory(){
    let mut straight=Battle::default();
    for c in [Bolt(19),Move(22),Advance(5)]{straight.apply(c).unwrap();}
    assert!(straight.state().outpost_held());
    assert_eq!(straight.state().invaders().len(),2);
    let mut restored=Battle::restore(&straight.checkpoint()).unwrap();
    equivalent(straight.state(),restored.state());
    for c in [Pulse(25),Advance(6),Pulse(41),Bolt(6),Advance(40)]{
        straight.apply(c).unwrap(); restored.apply(c).unwrap(); equivalent(straight.state(),restored.state());
    }
    assert_eq!(restored.state().outcome(),Outcome::Won);
    assert_eq!(restored.checkpoint(),straight.checkpoint());
}
#[test]
fn pending_squad_route_resumes_and_bad_input_never_becomes_accepted(){
    let mut a=Battle::default();
    a.apply(Move(22)).unwrap(); a.apply(Advance(1)).unwrap();
    let mut b=Battle::restore(&a.checkpoint()).unwrap();
    let save=b.checkpoint();
    assert!(b.apply(Bolt(17)).is_err()); assert_eq!(b.checkpoint(),save);
    for _ in 0..5 { a.apply(Advance(1)).unwrap(); b.apply(Advance(1)).unwrap(); equivalent(a.state(),b.state()); }
    assert!(matches!(Battle::restore("outpost/replay/999\n"),Err(Error::WrongVersion)));
    assert!(matches!(Battle::restore("outpost/replay/1\nadvance 41\n"),Err(Error::Malformed)));
    assert!(matches!(Battle::restore("outpost/replay/1\nadvance 01\n"),Err(Error::Malformed)));
    assert!(matches!(Battle::restore(&"x".repeat(8193)),Err(Error::Limit)));
}

#[test]
fn optional_first_wave_offer_is_stable_and_exactly_once() {
    use athena_defense_placement::replay::{Mode,Reward};
    let mut b=Battle::new(Mode::Run {seed:431});
    for c in [Bolt(19),Move(22),Advance(5),Pulse(25),Advance(40)] { b.apply(c).unwrap(); }
    let offer=b.offer().unwrap();
    assert_eq!(b.draws(),1);
    assert!(b.state().clock()<13);
    let mut b=Battle::restore(&b.checkpoint()).unwrap();
    assert_eq!(b.offer(),Some(offer));
    assert_eq!(b.draws(),1);
    let saved=b.checkpoint();
    assert_eq!(b.apply(Advance(1)),Err(Error::NeedsChoice));
    assert_eq!(b.apply(Choose{offer:2,option:0}),Err(Error::InvalidChoice));
    assert_eq!(b.apply(Choose{offer:1,option:2}),Err(Error::InvalidChoice));
    assert_eq!(b.checkpoint(),saved);
    let supply=offer.options.iter().position(|x|*x==Reward::Supply).unwrap() as u16;
    let before=b.state().ore();
    let chosen=Choose {offer:1,option:supply};
    b.apply(chosen).unwrap();
    let mut b=Battle::restore(&b.checkpoint()).unwrap();
    assert_eq!(b.state().ore(),before+5);
    assert!(b.offer().is_none());
    assert_eq!(b.apply(chosen),Err(Error::InvalidChoice));
    assert_eq!(b.state().ore(),before+5);
}
#[test]
fn classic_mode_has_no_offer_or_optional_draw() {
    let mut b=Battle::default();
    for c in [Bolt(19),Move(22),Advance(5),Pulse(25),Advance(6),Pulse(41),Bolt(6),Advance(40)] { b.apply(c).unwrap(); }
    assert_eq!(b.state().outcome(),Outcome::Won);
    assert_eq!(b.draws(),0);
    assert!(b.offer().is_none());
    assert!(!b.checkpoint().contains("run "));
}

fn terminal(args:&[&str], script:&str)->String {
    use std::{io::Write, process::{Command,Stdio}};
    let mut child=Command::new(env!("CARGO_BIN_EXE_outpost")).args(args)
        .stdin(Stdio::piped()).stdout(Stdio::piped()).spawn().unwrap();
    child.stdin.take().unwrap().write_all(script.as_bytes()).unwrap();
    let output=child.wait_with_output().unwrap();
    assert!(output.status.success());
    String::from_utf8(output.stdout).unwrap()
}

#[test]
fn real_terminal_saves_resumes_and_wins_classic() {
    let saved=terminal(&[],"bolt 1 2\nmove 4 2\nwait 5\ncheckpoint\nquit\n");
    let code=saved.lines().find_map(|l|l.strip_prefix("> Checkpoint: ")).unwrap();
    let restored=terminal(&[],&format!("resume {code}\npulse 7 2\nwait 6\npulse 5 4\nbolt 6 0\nwait 40\n"));
    assert!(restored.contains("Checkpoint restored."));
    assert!(restored.contains("VICTORY"));
    assert!(!restored.contains("Order refused"));
}

#[test]
fn real_terminal_run_checkpoint_preserves_offer_and_needs_matching_mode() {
    let args=["--run","431"];
    let saved=terminal(&args,"bolt 1 2\nmove 4 2\nwait 5\npulse 7 2\nwait 40\ncheckpoint\nquit\n");
    let code=saved.lines().find_map(|l|l.strip_prefix("> Checkpoint: ")).unwrap();
    let offer=saved.lines().find(|l|l.starts_with("choose ")&&l.ends_with("+5 ore")).unwrap();
    let choose=offer.split(':').next().unwrap();
    let restored=terminal(&args,&format!("resume {code}\nwait 1\n{choose}\n{choose}\nquit\n"));
    assert!(restored.contains("Checkpoint restored."));
    assert!(restored.contains(offer));
    assert_eq!(restored.matches("Choice refused: InvalidChoice").count(),1);
    assert!(restored.contains("Order refused: NeedsChoice"));
    let refused=terminal(&[],&format!("resume {code}\nquit\n"));
    assert!(refused.contains("Checkpoint refused: launch with the matching mode and seed."));
    assert!(!refused.contains("Wave cleared."));
}
