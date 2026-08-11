// Style reminder: Tactical Field Notes — asymmetrical draft ledger, bone typography, signal brass for active state, names first.
import { useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, ChevronRight, RotateCcw, Search, Shield, Sparkles, X } from "lucide-react";
import { DOTA_DATA, HERO_NAMES, type DotaEntry } from "@/lib/dotaData";

const ASSET_BASE = import.meta.env.BASE_URL;
const HERO_BACKDROP = `${ASSET_BASE}assets/counter-ledger-hero.jpg`;
const TREASURE_BACKDROP = `${ASSET_BASE}assets/counter-ledger-treasure.jpg`;
const LOGO = `${ASSET_BASE}assets/counter-ledger-logo.png`;
const MARK = `${ASSET_BASE}assets/counter-ledger-mark.png`;

type CounterSource = { enemy: string; role: string; reason: string };
type Ranked = { name: string; score: number; roles: string[]; sources: CounterSource[] };

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const SPECIFIC_COUNTER_NOTES: Record<string, string> = {
  "Abaddon::Shadow Demon": "Disruption hides Abaddon after Borrowed Time starts, wasting the ultimate window.",
  "Abaddon::Slark": "Long fights let Slark steal stats while Abaddon stays alive.",
  "Alchemist::Ancient Apparition": "Ice Blast shuts off Alchemist's Chemical Rage regeneration.",
  "Alchemist::Lifestealer": "Feast turns Alchemist's large health pool into percentage-based damage.",
  "Ancient Apparition::Clockwerk": "Hookshot and Power Cogs close the distance and isolate AA before he can channel.",
  "Ancient Apparition::Weaver": "Shukuchi closes the gap, while Time Lapse can undo Ice Blast damage.",
  "Anti-Mage::Shadow Shaman": "Wait for Counterspell to drop, then chain Hex and Shackles.",
  "Anti-Mage::Meepo": "Earthbind catches through Blink, and Meepo's physical swarm punishes AM's low early armor.",
  "Arc Warden::Bane": "Disable the main hero and clone separately to break the high-ground defense.",
  "Arc Warden::Broodmother": "She collapses the distance and floods both Arc Warden bodies with spiders.",
  "Axe::Viper": "Nether Toxin breaks Axe's passive; no Counter Helix math means no spins.",
  "Axe::Timbersaw": "Pure damage and slow attacks ignore Axe's armor and reduce his spin value.",
  "Bane::Silencer": "Global Silence cancels Fiend's Grip across the map.",
  "Bane::Lycan": "Lycan's micro army overwhelms Bane's single-target lockdown.",
  "Batrider::Abaddon": "Aphotic Shield strong-dispels Flaming Lasso.",
  "Batrider::Queen of Pain": "Blink resets the close-range Firefly and Napalm commitment.",
  "Beastmaster::Winter Wyvern": "Winter's Curse turns the clustered zoo back onto Beastmaster.",
  "Beastmaster::Sven": "Great Cleave converts the summon army into free damage.",
  "Bloodseeker::Abaddon": "Aphotic Shield and Mist Coil absorb or out-heal Rupture pressure.",
  "Bloodseeker::Medusa": "Medusa can stand still through Rupture and answer with Stone Gaze.",
  "Bounty Hunter::Oracle": "Fortune's End repeatedly dispels Track from allies.",
  "Bounty Hunter::Slardar": "Corrosive Haze gives true sight and armor reduction through invisibility.",
  "Brewmaster::Skywrath Mage": "Ancient Seal prevents the defensive split before Mystic Flare lands.",
  "Brewmaster::Outworld Destroyer": "Arcane Orb deals heavy pure damage to the brewling summons.",
  "Bristleback::Silencer": "Arcane Curse punishes Bristleback's constant Quill Spray casts.",
  "Bristleback::Viper": "Nether Toxin breaks the passives that provide his damage reduction.",
  "Broodmother::Grimstroke": "Stroke of Fate scales through the spider cluster for huge area damage.",
  "Broodmother::Earthshaker": "Echo Slam multiplies through overlapping spiderlings.",
  "Centaur Warrunner::Underlord": "Pit of Malice locks the Stampede path while Firestorm burns max health.",
  "Centaur Warrunner::Lifestealer": "Feast scales from Centaur's massive max health.",
  "Chaos Knight::Winter Wyvern": "Winter's Curse turns CK's own illusion army against him.",
  "Chaos Knight::Sand King": "Sand King's area magic rapidly clears Phantasm illusions.",
  "Chen::Enchantress": "Enchant steals the high-tier creep Chen spent the laning phase building.",
  "Chen::Clinkz": "Death Pact consumes Chen's best creep and converts it into Clinkz's power.",
  "Clinkz::Bane": "Enfeeble cuts the carry's damage and Fiend's Grip locks him in place.",
  "Clinkz::Spectre": "Haunt finds Clinkz even after he goes invisible.",
  "Clockwerk::Abaddon": "Force Staff and Aphotic Shield remove the Hookshot isolation.",
  "Clockwerk::Lifestealer": "Rage ignores Battery Assault's magic mini-stuns inside Cogs.",
  "Crystal Maiden::Rubick": "Rubick steals Freezing Field and cancels CM's channel with Telekinesis.",
  "Dark Seer::Oracle": "Fortune's End dispels Ion Shell and Surge.",
  "Dark Seer::Anti-Mage": "Magic resistance shrugs off Ion Shell, while Mana Void punishes Dark Seer's mana pool.",
  "Dark Willow::Silencer": "Global Silence removes the active spell chain Willow needs to survive.",
  "Dark Willow::Axe": "Berserker's Call can force Willow to attack while Shadow Realm is active.",
  "Dawnbreaker::Nyx Assassin": "Spiked Carapace reflects Solar Guardian's global damage and stuns her mid-channel.",
  "Dawnbreaker::Lifestealer": "Rage ignores the landing stun and Feast punishes her large health pool.",
  "Dazzle::Ancient Apparition": "Ice Blast shuts off the healing Dazzle relies on.",
  "Dazzle::Axe": "Culling Blade cuts through Shallow Grave's one-health protection.",
  "Death Prophet::Ancient Apparition": "Ice Blast sets Spirit Siphon and Exorcism healing to zero.",
  "Death Prophet::Bloodseeker": "Rupture forces the mobile Death Prophet to choose between moving and bleeding or standing still.",
  "Disruptor::Abaddon": "Aphotic Shield removes the Static Storm silence after Glimpse.",
  "Disruptor::Pangolier": "Gyroshell rolls through Kinetic Field and Static Storm.",
  "Doom::Oracle": "False Promise delays Doom's damage while Oracle heals through the duration.",
  "Doom::Medusa": "Mana Shield and Split Shot function without needing active spell casts.",
  "Dragon Knight::Elder Titan": "Natural Order removes DK's base armor and magic resistance.",
  "Dragon Knight::Viper": "Nether Toxin breaks Dragon Blood and turns off his passive tankiness.",
  "Drow Ranger::Clockwerk": "Hookshot and Battery Assault trap Drow and interrupt her attack animations.",
  "Drow Ranger::Spirit Breaker": "Charge closes the gap and turns off Marksmanship.",
  "Earth Spirit::Silencer": "Global Silence removes the four-button combo before it starts.",
  "Earth Spirit::Bloodseeker": "Rupture makes Rolling Boulder and movement self-destructive.",
  "Earthshaker::Disruptor": "Kinetic Field and Static Storm ruin the Blink and Echo timing.",
  "Earthshaker::Templar Assassin": "Refraction absorbs the large individual instances of Echo Slam damage.",
  "Elder Titan::Shadow Shaman": "Hex or Shackles catches the stationary body and wastes Astral Spirit setups.",
  "Elder Titan::Lifestealer": "Rage walks through Echo Stomp's sleep and initiation.",
  "Ember Spirit::Disruptor": "Glimpse drags Ember back into Kinetic Field and Static Storm.",
  "Ember Spirit::Slark": "Pounce leash blocks Fire Remnant escape.",
  "Enchantress::Shadow Demon": "Demonic Purge removes movement speed and slows her through Untouchable kiting.",
  "Enchantress::Marci": "Unleash overwhelms Untouchable's attack-speed reduction.",
  "Enigma::Silencer": "Global Silence cancels Black Hole across the map, even through BKB.",
  "Enigma::Sniper": "Long range lets Sniper punish the Blink and Black Hole attempt from safety.",
  "Faceless Void::Shadow Demon": "Disruption hides the Chronosphere victim for most of the ultimate.",
  "Faceless Void::Naga Siren": "Song of the Siren sleeps the rest of Void's team while he is inside Chronosphere.",
  "Grimstroke::Abaddon": "Aphotic Shield pops Ink Phantoms off allies.",
  "Grimstroke::Phantom Lancer": "Doppelganger breaks Soulbind's targeted tracking with a crowd of illusions.",
  "Gyrocopter::Ancient Apparition": "Ice Blast removes the lifesteal that keeps Flak Cannon and Satanic Gyro alive.",
  "Gyrocopter::Faceless Void": "Chronosphere catches the immobile, low-armor Gyro.",
  "Hoodwink::Spirit Breaker": "Charge gives vision through the trees and closes the Bushwhack setup.",
  "Hoodwink::Timbersaw": "Timbersaw clears the trees Hoodwink needs for Scurry and Bushwhack.",
  "Huskar::Ancient Apparition": "Ice Blast sets Berserker's Blood regeneration to zero.",
  "Huskar::Necrophos": "Reaper's Scythe scales harder against a low-health Huskar.",
  "Invoker::Silencer": "Global Silence stops the spell cycling and cast-heavy positioning.",
  "Invoker::Riki": "Smoke Screen silences and blinds Invoker so he cannot invoke or cast.",
  "Io::Ancient Apparition": "Ice Blast removes the healing amplification Io is built around.",
  "Io::Troll Warlord": "Battle Trance's rapid attacks shred Io's tethered carry and utility pair.",
  "Jakiro::Rubick": "Zero cast point lets Rubick steal and return Jakiro's slow spells first.",
  "Jakiro::Lifestealer": "Rage ignores Jakiro's fire zones and attack-speed slows.",
  "Juggernaut::Shadow Demon": "Disruption hides Juggernaut's Omnislash target.",
  "Juggernaut::Riki": "Smoke Screen silences Juggernaut before Blade Fury or Omnislash.",
  "Keeper of the Light::Nyx Assassin": "Mana Burn scales with intelligence and deletes KOTL's fragile pool.",
  "Keeper of the Light::Night Stalker": "Dark Ascension crosses terrain and Crippling Fear silences the backliner.",
  "Kunkka::Shadow Demon": "Disruption hides the X-marked ally before the timed combo lands.",
  "Kunkka::Lifestealer": "Rage invalidates Kunkka's magic-heavy lane and Feast scales from his strength.",
  "Legion Commander::Oracle": "False Promise delays Duel damage and denies duel damage gain.",
  "Leshrac::Ancient Apparition": "Ice Blast disables the Bloodstone sustain Leshrac needs.",
  "Leshrac::Anti-Mage": "Magic resistance and Mana Break make Leshrac's spell damage and mana pool liabilities.",
  "Lich::Oracle": "Fortune's End removes Frost Shield.",
  "Lich::Bristleback": "Bristleback's passive absorbs Chain Frost and turns the hits into Quill Spray.",
  "Lifestealer::Viper": "Nether Toxin breaks Feast and removes his passive sustain.",
  "Lina::Nyx Assassin": "Spiked Carapace reflects Lina's broadcasted burst back onto her.",
  "Lina::Anti-Mage": "Magic resistance blunts Lina's burst while Mana Void punishes her mana spend.",
  "Lion::Silencer": "Global Silence stops Lion's rapid single-target chain.",
  "Lion::Anti-Mage": "Counterspell reflects Lion's targeted lockdown and wastes his initiation.",
  "Lone Druid::Winter Wyvern": "Winter's Curse turns the Spirit Bear's damage back onto the druid.",
  "Lone Druid::Slark": "Slark steals stacks from the bear in a long fight.",
  "Luna::Underlord": "Firestorm and Atrophy Aura reduce Luna's physical and health advantages.",
  "Luna::Phantom Lancer": "Illusions spread Eclipse's limited random bounces harmlessly.",
  "Lycan::Winter Wyvern": "Winter's Curse turns the clustered wolves and creeps on Lycan.",
  "Lycan::Earthshaker": "Echo Slam scales through the traveling zoo.",
  "Magnus::Rubick": "Rubick steals Reverse Polarity and turns the initiation back.",
  "Magnus::Sniper": "Sniper's range denies the tight cluster Magnus needs.",
  "Marci::Winter Wyvern": "Winter's Curse turns Unleash's rapid attacks onto allies.",
  "Marci::Axe": "Berserker's Call converts Unleash's attack speed into Counter Helix.",
  "Mars::Viper": "Nether Toxin breaks Bulwark.",
  "Mars::Lifestealer": "Rage ignores Arena of Blood's walls and damage.",
  "Medusa::Nyx Assassin": "Mana Burn directly attacks the mana shield from a safe distance.",
  "Medusa::Anti-Mage": "Mana Break drains the resource that is also Medusa's health pool.",
  "Meepo::Winter Wyvern": "Winter's Curse makes the clones kill one another.",
  "Meepo::Sand King": "Sandstorm and Epicenter melt the clone squad with area magic.",
  "Mirana::Bounty Hunter": "Track and true sight bankrupt Mirana's invisibility escape plan.",
  "Mirana::Night Stalker": "Dark Ascension breaks the high-ground positioning and invisibility game.",
  "Monkey King::Viper": "Nether Toxin breaks Jingu Mastery.",
  "Monkey King::Timbersaw": "Timber Chain and Chakram cut the tree, stunning Monkey King and exposing him.",
  "Morphling::Ancient Apparition": "Ice Blast makes strength shifting add health without restoring current HP.",
  "Morphling::Anti-Mage": "Mana Break prevents Attribute Shift and leaves Morphling in fragile agility form.",
  "Muerta::Shadow Shaman": "Hex and Shackles hold Muerta through an ultimate that does not grant magic immunity.",
  "Muerta::Lifestealer": "Rage makes Muerta's magical right-clicks deal zero.",
  "Naga Siren::Winter Wyvern": "Winter's Curse turns the illusion army onto Naga.",
  "Naga Siren::Sand King": "Area magic rapidly clears Naga's illusion squad.",
  "Nature's Prophet::Spirit Breaker": "Charge gives true sight and interrupts global teleport setups.",
  "Nature's Prophet::Timbersaw": "Timbersaw chains through Sprout and uses the trees as fuel.",
  "Necrophos::Ancient Apparition": "Ice Blast zeros the healing from Ghost Shroud and Death Pulse.",
  "Necrophos::Anti-Mage": "Counterspell and Mana Break empty Necrophos's mana pool.",
  "Night Stalker::Viper": "Nether Toxin breaks the passive that provides daytime safety and night aggression.",
  "Nyx Assassin::Abaddon": "Aphotic Shield dispels the stun from Nyx's surprise initiation.",
  "Nyx Assassin::Lifestealer": "Rage ignores Nyx's magical burst.",
  "Ogre Magi::Oracle": "Fortune's End removes Bloodlust from the lineup.",
  "Ogre Magi::Anti-Mage": "Counterspell reflects Ignite and Mana Break drains Ogre's large pool.",
  "Omniknight::Oracle": "Fortune's End deletes Omniknight's armor and status-resistance buffs.",
  "Oracle::Axe": "Culling Blade cuts through False Promise's delayed damage.",
  "Outworld Destroyer::Nyx Assassin": "Mana Burn attacks OD's large mana and intelligence pool.",
  "Outworld Destroyer::Sniper": "Range denies OD the close distance he needs for Astral Imprisonment.",
  "Pangolier::Grimstroke": "Soulbind leashes Pangolier and anchors his rolling mobility.",
  "Pangolier::Bloodseeker": "Rupture turns rolling into self-damage.",
  "Phantom Assassin::Viper": "Nether Toxin breaks Blur evasion and Coup de Grace.",
  "Phantom Assassin::Morphling": "Armor and Adaptive Strike answer PA's physical daggers.",
  "Phantom Lancer::Lich": "Chain Frost bounces through the real hero and illusion army.",
  "Phantom Lancer::Earthshaker": "Echo Slam multiplies through the clone swarm.",
  "Phoenix::Snapfire": "Lil Shredder's fixed attack speed burns through Supernova.",
  "Phoenix::Troll Warlord": "Battle Trance overrides Fire Spirits' attack-speed slow.",
  "Primal Beast::Nyx Assassin": "Spiked Carapace stuns Primal Beast on his first Trample step.",
  "Primal Beast::Lifestealer": "Rage ignores Pulverize and Feast punishes the big health pool.",
  "Puck::Silencer": "Global Silence removes the mobility spells Puck needs to live.",
  "Puck::Riki": "Smoke Screen blocks Phase Shift and Illusory Orb escape.",
  "Pudge::Bane": "Nightmare or Fiend's Grip breaks Dismember.",
  "Pudge::Lifestealer": "Feast scales against Pudge's bloated Flesh Heap health.",
  "Pugna::Nyx Assassin": "Mana Burn scales with intelligence and deletes Pugna's health.",
  "Pugna::Anti-Mage": "Counterspell shrugs off Nether Blast and Mana Break empties the pool.",
  "Queen of Pain::Silencer": "Global Silence catches Queen of Pain after Blink.",
  "Queen of Pain::Spirit Breaker": "Charge gives vision and stuns through the Blink escape plan.",
  "Razor::Oracle": "Fortune's End dispels Razor's stolen damage.",
  "Razor::Weaver": "Shukuchi breaks the link distance and gives maximum movement speed.",
  "Riki::Disruptor": "Static Storm's continuous silence prevents Riki from escaping.",
  "Riki::Bristleback": "Backstabs trigger Quill Spray and turn the sneak attack against Riki.",
  "Ringmaster::Silencer": "Global Silence removes the box save and leaves him exposed.",
  "Rubick::Silencer": "Global Silence stops the stolen spell casting window.",
  "Rubick::Riki": "Smoke Screen silences and blinds Rubick so stolen spells are unusable.",
  "Sand King::Zeus": "Lightning reveals Sand Storm hiding spots.",
  "Sand King::Lifestealer": "Rage ignores Sand Storm and Epicenter magic.",
  "Shadow Demon::Oracle": "Fortune's End dispels poison stacks and movement restrictions.",
  "Shadow Demon::Phantom Lancer": "Doppelganger gives Shadow Demon a disposable target for Demonic Purge.",
  "Shadow Fiend::Nyx Assassin": "Spiked Carapace reflects the long Requiem channel.",
  "Shadow Fiend::Templar Assassin": "Refraction absorbs the Shadow Razes while side blades punish low armor.",
  "Shadow Shaman::Abaddon": "Aphotic Shield dispels the target of Hex or Shackles.",
  "Silencer::Abaddon": "Aphotic Shield or Borrowed Time dispels Global Silence.",
  "Silencer::Phantom Lancer": "Doppelganger dispels Silencer's curses and Manta breaks Global Silence.",
  "Skywrath Mage::Nyx Assassin": "Mana Burn scales with intelligence and deletes the fragile caster.",
  "Skywrath Mage::Pugna": "Pugna punishes repeated spell spam, while BKB or Blade Mail answers the burst.",
  "Slardar::Dazzle": "Shallow Grave denies the Corrosive Haze kill window.",
  "Slardar::Troll Warlord": "Battle Trance makes Troll immune to kiting and out-bashes Slardar.",
  "Slark::Disruptor": "Static Storm's continuous zone silence cannot be purged by Dark Pact.",
  "Slark::Bloodseeker": "Thirst grants vision and removes Shadow Dance's safe regeneration.",
  "Snapfire::Abaddon": "Aphotic Shield removes Fire Snap Cookie's stun.",
  "Snapfire::Lifestealer": "Rage ignores Mortimer Kisses and Snapfire's magical burst.",
  "Sniper::Clockwerk": "Hookshot and Battery Assault trap Sniper and interrupt his attacks.",
  "Sniper::Spirit Breaker": "Charge closes the gap on Sniper's low-mobility backline.",
  "Spectre::Undying": "Tombstone and Decay drain Spectre's lane strength and delay Radiance.",
  "Spectre::Viper": "Nether Toxin breaks Dispersion and Desolate.",
  "Spirit Breaker::Clockwerk": "Power Cogs stop the charge path and cancel initiation.",
  "Spirit Breaker::Bloodseeker": "Rupture punishes the movement required for Charge.",
  "Storm Spirit::Silencer": "Global Silence catches Storm in the middle of a zip.",
  "Storm Spirit::Anti-Mage": "Mana Break empties the resource Storm needs to zip.",
  "Sven::Shadow Demon": "Disruption hides Sven's target for the God's Strength window.",
  "Sven::Troll Warlord": "Whirling Axes blind and Battle Trance ignore Sven's physical damage.",
  "Techies::Zeus": "Lightning and Wrath provide true sight for mine setups.",
  "Techies::Lifestealer": "Rage lets Lifestealer walk through the minefield.",
  "Templar Assassin::Jakiro": "Continuous fire damage drains Refraction charges.",
  "Templar Assassin::Viper": "Poison ticks consume all Refraction shields quickly.",
  "Terrorblade::Winter Wyvern": "Winter's Curse turns the reflection squad onto Terrorblade.",
  "Terrorblade::Axe": "Counter Helix punishes the rapid attacks from Terrorblade's illusions.",
  "Tidehunter::Viper": "Nether Toxin turns off Kraken Shell.",
  "Timbersaw::Ancient Apparition": "Ice Blast removes the health regeneration that sustains Timber.",
  "Timbersaw::Ursa": "Fury Swipes scales through armor in a sustained Enrage window.",
  "Tinker::Nyx Assassin": "Mana Burn attacks Tinker's intelligence and mana from safety.",
  "Tinker::Night Stalker": "Dark Ascension sees over trees and breaks Tinker's hiding spot.",
  "Tiny::Jakiro": "Jakiro's continuous damage exploits Tiny's slow tempo.",
  "Tiny::Slardar": "Corrosive Haze exposes Tiny's weak base armor.",
  "Treant Protector::Jakiro": "Macropyre and Dual Breath punish the clustered Overgrowth fight.",
  "Treant Protector::Timbersaw": "Timbersaw uses Treant's trees for movement and damage.",
  "Troll Warlord::Winter Wyvern": "Winter's Curse turns the attacking Troll onto an ally.",
  "Troll Warlord::Axe": "Berserker's Call converts Troll's attack speed into Counter Helix.",
  "Tusk::Abaddon": "Aphotic Shield dispels Snowball or Walrus Punch lockdown.",
  "Tusk::Lifestealer": "Rage ignores Tusk's magical setup.",
  "Underlord::Disruptor": "Disruptor stops Fiend's Gate escapes and transit plays.",
  "Underlord::Outworld Destroyer": "Arcane Orb bypasses Underlord's tank and damage reduction.",
  "Undying::Snapfire": "Lil Shredder burns Tombstone from a safe distance.",
  "Undying::Sniper": "Sniper's range destroys Tombstone before zombies matter.",
  "Ursa::Bane": "Nightmare or Fiend's Grip shuts down Ursa's short Enrage window.",
  "Ursa::Troll Warlord": "Troll out-fights Ursa and steals the one-on-one crown.",
  "Vengeful Spirit::Abaddon": "Aphotic Shield dispels the Nether Swap stun.",
  "Vengeful Spirit::Phantom Lancer": "Illusions break Vengeful's single-target targeting logic.",
  "Venomancer::Oracle": "Fortune's End removes Venomancer's poison stacks.",
  "Venomancer::Lifestealer": "Rage ignores poison ticks and BKB ignores Venomancer's wards.",
  "Viper::Shadow Demon": "Demonic Purge strips Viper's movement and momentum.",
  "Viper::Chaos Knight": "Illusions burst Viper before he can stack poison, and BKB ignores magic.",
  "Visage::Winter Wyvern": "Winter's Curse turns the familiar squad onto Visage.",
  "Visage::Axe": "Counter Helix punishes the familiars' rapid attacks.",
  "Void Spirit::Silencer": "Global Silence stops the mobility chain in the middle of the lineup.",
  "Void Spirit::Riki": "Smoke Screen prevents portal and Shield Crash escapes.",
  "Warlock::Silencer": "Global Silence breaks the Fatal Bonds and Golem sequence.",
  "Warlock::Weaver": "Weaver reaches Warlock's backline and shreds his low armor.",
  "Weaver::Disruptor": "Static Storm prevents Shukuchi and Time Lapse.",
  "Weaver::Bloodseeker": "Rupture turns Weaver's high-speed escapes into self-damage.",
  "Windranger::Shadow Demon": "Demonic Purge strips Wind Run and exposes the physical carry.",
  "Windranger::Centaur Warrunner": "Retaliate returns damage into Wind Run attacks.",
  "Winter Wyvern::Clockwerk": "Rocket Flare finds hidden Wyvern and Hookshot traps her.",
  "Winter Wyvern::Timbersaw": "Pure damage ignores the physical immunity of Ice Block.",
  "Witch Doctor::Silencer": "Global Silence cancels the stationary Death Ward channel.",
  "Witch Doctor::Night Stalker": "Night Stalker hunts the dark backline while BKB ignores the stuns.",
  "Wraith King::Anti-Mage": "Mana Break leaves Wraith King without a second-life mana buffer.",
  "Zeus::Silencer": "Global Silence stops Zeus's spell cycle.",
  "Zeus::Storm Spirit": "Electric Vortex closes the distance on Zeus's fragile, immobile backline.",
};

const GENERIC_COUNTER_NOTES: Record<string, string> = {
  "Ancient Apparition": "The transcript repeatedly uses Ice Blast to stop healing and regeneration.",
  "Abaddon": "The transcript leans on Aphotic Shield or Borrowed Time to dispel the key control or burst.",
  "Viper": "The answer targets passive defenses with Nether Toxin's break mechanic.",
  "Silencer": "Global Silence prevents the enemy's active spell chain from starting.",
  "Lifestealer": "Rage provides spell immunity while Feast punishes large health pools.",
  "Anti-Mage": "Counterspell and Mana Break punish targeted magic and mana-heavy heroes.",
  "Winter Wyvern": "Winter's Curse turns clustered summons or attack speed back onto the enemy.",
  "Axe": "Berserker's Call forces fast attackers to hit into Counter Helix.",
  "Disruptor": "Static Storm and Kinetic Field deny the mobility or escape buttons the transcript calls out.",
  "Nyx Assassin": "Mana Burn or Spiked Carapace punishes intelligence casters, channels, or global damage.",
  "Shadow Demon": "Disruption or Demonic Purge removes the enemy's key target or tempo advantage.",
  "Oracle": "Fortune's End dispels protective buffs, while False Promise delays lethal damage.",
  "Earthshaker": "Echo Slam scales through clustered illusions and summons.",
  "Riki": "Smoke Screen silences and blinds the active spellcaster.",
  "Bloodseeker": "Rupture punishes the movement the enemy hero needs to survive.",
  "Slark": "Pounce leash or vision pressure prevents the escape pattern highlighted in the transcript.",
  "Timbersaw": "Pure damage or tree interaction bypasses the defensive pattern described in the transcript.",
};

function counterReason(enemy: string, counter: string, role: string) {
  return SPECIFIC_COUNTER_NOTES[`${enemy}::${counter}`] ?? GENERIC_COUNTER_NOTES[counter] ?? `${counter} is named in the transcript as a ${role} answer to ${enemy}; the matchup targets the hero's key fight pattern.`;
}

function rankCounters(selected: string[]): Ranked[] {
  const excluded = new Set(selected.map(normalize));
  const scores = new Map<string, { score: number; roles: Set<string>; sources: CounterSource[] }>();
  selected.forEach((enemy, index) => {
    const entry = DOTA_DATA.find((row) => normalize(row.enemy) === normalize(enemy));
    if (!entry) return;
    const weight = 1 / (index + 1);
    [...entry.support.map((name) => [name, "support"] as const), ...entry.core.map((name) => [name, "core"] as const)].forEach(([name, role]) => {
      const key = normalize(name);
      if (excluded.has(key)) return;
      const current = scores.get(key) ?? { score: 0, roles: new Set<string>(), sources: [] as CounterSource[] };
      current.score += weight;
      current.roles.add(role);
      current.sources.push({ enemy, role, reason: counterReason(enemy, name, role) });
      scores.set(key, current);
    });
  });
  return Array.from(scores.entries()).map(([name, value]) => ({ name, score: value.score, roles: Array.from(value.roles), sources: value.sources })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function rankTreasures(selected: string[]) {
  const scores = new Map<string, number>();
  selected.forEach((enemy, index) => {
    const entry = DOTA_DATA.find((row) => normalize(row.enemy) === normalize(enemy));
    if (!entry) return;
    const weight = 1 / (index + 1);
    entry.treasures.forEach((name) => scores.set(name, (scores.get(name) ?? 0) + weight));
  });
  return Array.from(scores.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, score]) => ({ name, score }));
}

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}

function PickRow({ index, enemy, active, onRemove }: { index: number; enemy?: string; active: boolean; onRemove: () => void }) {
  return (
    <div className={`pick-row ${active ? "is-active" : enemy ? "is-complete" : ""}`}>
      <div className="pick-index">0{index + 1}</div>
      <div className="pick-copy">
        <span className="field-label">Enemy slot {index + 1}</span>
        <strong>{enemy ?? (active ? "Awaiting selection" : "Open slot")}</strong>
      </div>
      {enemy ? <button className="icon-button" aria-label={`Remove ${enemy}`} onClick={onRemove}><X size={15} /></button> : <ChevronRight className="row-arrow" size={18} />}
    </div>
  );
}

function CounterRow({ item, index, expanded, onToggle }: { item: Ranked; index: number; expanded: boolean; onToggle: () => void }) {
  return (
    <div className={`counter-row ${index === 0 ? "is-top" : ""} ${expanded ? "is-expanded" : ""}`}>
      <button className="counter-main" onClick={onToggle} aria-expanded={expanded} aria-controls={`counter-explanation-${index}`}>
        <div className="rank-number">0{index + 1}</div>
        <div className="counter-name"><strong>{item.name}</strong><span>{item.roles.join(" + ")}</span></div>
        <div className="counter-score"><span style={{ width: `${Math.min(100, item.score * 64)}%` }} /><em>{formatScore(item.score)}</em><ChevronDown size={14} className="counter-chevron" /></div>
      </button>
      {expanded && <div className="counter-explanation" id={`counter-explanation-${index}`}><span className="field-label">Transcript read</span>{item.sources.slice(0, 2).map((source) => <p key={`${source.enemy}-${source.role}`}>{source.reason} <em>{source.enemy} / {source.role}</em></p>)}</div>}
    </div>
  );
}

function TreasureRow({ name, score, index }: { name: string; score: number; index: number }) {
  return <div className="treasure-row"><span className="treasure-index">0{index + 1}</span><strong>{name}</strong><span className="treasure-signal">{formatScore(score)}</span></div>;
}

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [treasureOpen, setTreasureOpen] = useState(false);
  const [expandedCounter, setExpandedCounter] = useState<string | null>(null);
  const filteredHeroes = useMemo(() => HERO_NAMES.filter((hero) => hero.toLowerCase().includes(query.toLowerCase()) && !selected.includes(hero)).slice(0, 12), [query, selected]);
  const counters = useMemo(() => rankCounters(selected), [selected]);
  const treasures = useMemo(() => rankTreasures(selected), [selected]);
  const currentStep = Math.min(selected.length, 5);
  const addHero = (hero: string) => { if (selected.length < 5) { setSelected((current) => [...current, hero]); setQuery(""); } };
  const removeHero = (hero: string) => setSelected((current) => current.filter((item) => item !== hero));
  const reset = () => { setSelected([]); setQuery(""); };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-symbol"><img src={LOGO} alt="Counter Ledger mark" /></div><div><span className="brand-kicker">Dota 2 / draft intelligence</span><strong className="wordmark"><span>COUNTER</span><span>LEDGER</span></strong></div></div>
        <div className="topbar-meta"><span>Source file</span><strong>dota2.txt</strong><span className="status-dot" /> <span className="status-text">Transcript indexed</span></div>
      </header>

      <section className="hero-band" style={{ backgroundImage: `linear-gradient(90deg, rgba(10, 15, 18, .98) 0%, rgba(10, 15, 18, .86) 42%, rgba(10, 15, 18, .18) 100%), url(${HERO_BACKDROP})` }}>
        <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-rule" /> Draft response system</span><h1>Turn the enemy draft<br /><i>into an answer.</i></h1><p>Lock enemy picks in order. The first answer leads; the next four sharpen it.</p></div>
        <div className="hero-sigil"><img src={MARK} alt="" /><span>Names only.<br />No noise.</span></div>
      </section>

      <div className="workspace">
        <section className="draft-panel panel-surface">
          <div className="panel-heading"><div><span className="section-number">01 / enemy draft</span><h2>Read the board in order</h2></div><button className="quiet-button" onClick={reset}><RotateCcw size={14} /> Reset</button></div>
          <div className="progress-line"><span style={{ width: `${(selected.length / 5) * 100}%` }} /></div>
          <div className="draft-list">{[0, 1, 2, 3, 4].map((index) => <PickRow key={index} index={index} enemy={selected[index]} active={index === currentStep && selected.length < 5} onRemove={() => selected[index] && removeHero(selected[index])} />)}</div>
          <div className="picker-wrap"><div className="picker-label"><span className="field-label">{selected.length < 5 ? `Select enemy ${selected.length + 1}` : "Draft complete"}</span><span>{selected.length}/5 locked</span></div><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={selected.length < 5 ? "Search hero names" : "All enemy slots selected"} disabled={selected.length >= 5} /><kbd>⌘ K</kbd></div>{selected.length < 5 && <div className="hero-suggestions">{filteredHeroes.map((hero) => <button key={hero} onClick={() => addHero(hero)}>{hero}<ArrowUpRight size={14} /></button>)}{filteredHeroes.length === 0 && <span className="empty-search">No unselected heroes match that search.</span>}</div>}</div>
        </section>

        <aside className="recommendation-panel panel-surface">
          <div className="panel-heading"><div><span className="section-number">02 / counter read</span><h2>Best counter picks</h2></div><Shield size={18} className="heading-icon" /></div>
          <p className="panel-note">First pick leads. Later picks break ties.</p>
          <div className="counter-list">{counters.length ? counters.slice(0, 8).map((item, index) => <CounterRow item={item} index={index} key={item.name} expanded={expandedCounter === item.name} onToggle={() => setExpandedCounter((current) => current === item.name ? null : item.name)} />) : <div className="empty-state"><img src={MARK} alt="" /><strong>Lock the first enemy.</strong><span>Your counter board will appear here.</span></div>}</div>
          <div className="read-footer"><span><span className="signal-dot" /> Weighted by pick order</span><span>{counters.length ? `${counters.length} responses indexed` : "Waiting"}</span></div>
        </aside>
      </div>

      <section className="treasure-section" style={{ backgroundImage: `linear-gradient(105deg, rgba(202, 189, 153, .94), rgba(151, 133, 97, .76)), url(${TREASURE_BACKDROP})` }}>
        <div className="treasure-intro"><span className="section-number">03 / item answer</span><h2>Counter treasures</h2><p>Items that blunt the five locked names. Highest signal first.</p><button className="brass-button" onClick={() => setTreasureOpen(true)}><Sparkles size={15} /> Open treasure board <ArrowUpRight size={15} /></button></div>
        <div className="treasure-preview"><div className="preview-top"><span className="field-label">Current shortlist</span><span>{selected.length === 5 ? "Full draft" : `${selected.length}/5 selected`}</span></div>{treasures.length ? treasures.slice(0, 5).map((item, index) => <TreasureRow key={item.name} name={item.name} score={item.score} index={index} />) : <div className="treasure-empty">Select enemy heroes to reveal the item read.</div>}</div>
      </section>

      <footer className="footer"><span>COUNTER LEDGER / static transcript tool</span><span>Built for a five-hero enemy read <span className="footer-mark">◆</span></span></footer>

      {treasureOpen && <div className="modal-backdrop" role="presentation" onClick={() => setTreasureOpen(false)}><section className="treasure-modal" role="dialog" aria-modal="true" aria-labelledby="treasure-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setTreasureOpen(false)} aria-label="Close treasure board"><X size={18} /></button><span className="section-number">03 / item answer</span><h2 id="treasure-title">The treasure board</h2><p>Five names in. Item signal out.</p><div className="modal-list">{treasures.length ? treasures.map((item, index) => <TreasureRow key={item.name} name={item.name} score={item.score} index={index} />) : <div className="treasure-empty">Your five enemy names will populate this board.</div>}</div><button className="brass-button modal-done" onClick={() => setTreasureOpen(false)}><Check size={15} /> Close board</button></section></div>}
    </main>
  );
}
