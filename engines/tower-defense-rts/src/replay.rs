//! Versioned tactical checkpoint through a bounded accepted-order journal.
use crate::skirmish::{Outcome, Reject, Skirmish, Tower};

const HEADER: &str = "outpost/replay/1";
const MAX_BYTES: usize = 8192;
const MAX_COMMANDS: usize = 256;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Command { Move(u16), Bolt(u16), Pulse(u16), Advance(u16), Choose { offer: u16, option: u16 } }

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Mode { Classic, Run {seed: u64} }

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Reward { Supply, Repair }

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Offer { pub id: u16, pub options: [Reward;2] }


#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Error { Malformed, WrongVersion, Limit, Finished, NeedsChoice, InvalidChoice, Rejected(Reject) }

pub struct Battle {
    state: Skirmish,
    accepted: Vec<Command>,
    mode: Mode,
    pending: Option<Offer>,
    draws: u8,
}

impl Default for Battle {
    fn default() -> Self { Self::new(Mode::Classic) }
}

impl Battle {
    pub fn new(mode: Mode) -> Self {
        Self { state: Skirmish::default(), accepted: Vec::new(), mode, pending: None, draws: 0 }
    }

    pub fn mode(&self) -> Mode { self.mode }

    pub fn offer(&self) -> Option<Offer> { self.pending }
    pub fn draws(&self) -> u8 { self.draws }

    pub fn state(&self) -> &Skirmish { &self.state }

    pub fn apply(&mut self, command: Command) -> Result<(), Error> {
        if self.state.outcome() != Outcome::Active { return Err(Error::Finished); }
        if self.accepted.len() >= MAX_COMMANDS { return Err(Error::Limit); }
        if let Command::Choose { offer, option } = command {
            let current = self.pending.filter(|current| current.id == offer).ok_or(Error::InvalidChoice)?;
            match current.options.get(usize::from(option)).ok_or(Error::InvalidChoice)? {
                Reward::Supply => self.state.grant_supply(),
                Reward::Repair => self.state.repair_bastion(),
            }
            self.pending = None;
            self.accepted.push(command);
            return Ok(());
        }
        if self.pending.is_some() { return Err(Error::NeedsChoice); }

        match command {
            Command::Move(p) => self.state.order(p.into()),
            Command::Bolt(p) => self.state.build(p.into(), Tower::Bolt),
            Command::Pulse(p) => self.state.build(p.into(), Tower::Pulse),
            Command::Advance(n @ 1..=40) => {
                for _ in 0..n {
                    self.state.advance();
                    if self.state.outcome() != Outcome::Active { break; }
                    if let Mode::Run { seed } = self.mode {
                        if self.draws == 0 && self.state.next_wave() == Some(13) && self.state.invaders().is_empty() {
                            let mixed = seed.wrapping_mul(0x9e3779b97f4a7c15).rotate_right(19);
                            let mut options = [Reward::Supply, Reward::Repair];
                            if mixed % 2 == 1 { options.swap(0, 1); }
                            self.pending = Some(Offer { id: 1, options });
                            self.draws += 1;
                            break;
                        }
                    }
                }
                Ok(())
            },
            Command::Advance(_) => return Err(Error::Malformed),
            Command::Choose { .. } => unreachable!(),
        }.map_err(Error::Rejected)?;
        self.accepted.push(command);
        Ok(())
    }

    pub fn checkpoint(&self) -> String {
        use std::fmt::Write;
        let mut saved = String::from(HEADER);
        saved.push('\n');
        if let Mode::Run { seed } = self.mode { writeln!(saved,"run {seed}").unwrap(); }
        for &command in &self.accepted {
            let (kind,arg) = match command {
                Command::Move(p) => ("move",p), Command::Bolt(p) => ("bolt",p),
                Command::Pulse(p) => ("pulse",p), Command::Advance(n) => ("advance",n),
                Command::Choose { offer, option } => { writeln!(saved,"choose {offer} {option}").unwrap(); continue; },
            };
            writeln!(saved,"{kind} {arg}").expect("writing into String is infallible");
        }
        saved
    }

    pub fn restore(data: &str) -> Result<Self, Error> {
        if data.len() > MAX_BYTES { return Err(Error::Limit); }
        if !data.ends_with('\n') { return Err(Error::Malformed); }
        let mut lines = data.lines();
        if lines.next() != Some(HEADER) { return Err(Error::WrongVersion); }
        let mut lines = lines.peekable();
        let mut replay = if let Some(raw) = lines.peek().and_then(|s|s.strip_prefix("run ")) {
            let seed: u64 = raw.parse().map_err(|_| Error::Malformed)?;
            if seed.to_string()!=raw { return Err(Error::Malformed); }
            lines.next();
            Self::new(Mode::Run {seed})
        } else { Self::default() };
        for line in lines {
            let (kind,arg)=line.split_once(' ').ok_or(Error::Malformed)?;
            if kind=="choose" {
                let (offer,option)=arg.split_once(' ').ok_or(Error::Malformed)?;
                replay.apply(Command::Choose { offer: number(offer)?,option: number(option)? })?;
                continue;
            }
            let n=number(arg)?;
            replay.apply(match kind {
                "move" => Command::Move(n), "bolt" => Command::Bolt(n),
                "pulse" => Command::Pulse(n), "advance" => Command::Advance(n),
                _ => return Err(Error::Malformed),
            })?;
        }
        Ok(replay)
    }
}


fn number(raw:&str)->Result<u16,Error> {
    let n: u16 = raw.parse().map_err(|_| Error::Malformed)?;
    if n.to_string()!=raw { return Err(Error::Malformed); }
    Ok(n)
}
