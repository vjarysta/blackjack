import { defaultRules } from "./rules.config";
import { canDouble, canHit, canSplit, canSurrender } from "./rules";
import { bestTotal, getHandTotals, isBust } from "./totals";
import { createShoe, discard, drawCard, rebuildShoe, shouldReshuffle } from "./shoe";
import { type GameState, type Hand, type RuleConfig, type Seat } from "./types";

const SEAT_COUNT = 7;

function mergeRules(partial?: Partial<RuleConfig>): RuleConfig {
  return { ...defaultRules, ...partial };
}

function createEmptySeat(index: number): Seat {
  return {
    index,
    occupied: false,
    hands: [],
    baseBet: 0
  };
}

function createHand(bet: number, seatIndex: number): Hand {
  return {
    id: crypto.randomUUID(),
    cards: [],
    bet,
    isResolved: false,
    isBlackjack: false,
    parentSeatIndex: seatIndex,
    originatesFromSplit: false
  };
}

function markMessage(state: GameState, message: string): void {
  state.messageLog.push(message);
  if (state.messageLog.length > 50) {
    state.messageLog.shift();
  }
}

function totalBetForRound(state: GameState): number {
  return state.seats.reduce((sum, seat) => sum + (seat.occupied ? seat.baseBet : 0), 0);
}

function ensureBankroll(state: GameState, amount: number): void {
  if (amount <= 0) return;
  if (state.bankroll < amount) {
    throw new Error("Insufficient bankroll");
  }
  state.bankroll -= amount;
}

function refund(state: GameState, amount: number): void {
  if (amount <= 0) return;
  state.bankroll += amount;
}

function checkCutCard(state: GameState): void {
  if (!state.pendingReshuffle && shouldReshuffle(state.shoe)) {
    state.pendingReshuffle = true;
    markMessage(state, "Cut card reached. Shoe will be reshuffled after this round.");
  }
}

function dealCardToHand(state: GameState, hand: Hand): void {
  const card = drawCard(state.shoe);
  hand.cards.push(card);
  checkCutCard(state);
}

function evaluateBlackjack(hand: Hand): void {
  if (hand.cards.length === 2) {
    const totals = getHandTotals(hand);
    const total = totals.soft ?? totals.hard;
    hand.isBlackjack = total === 21;
    if (hand.isBlackjack && hand.parentSeatIndex >= 0) {
      hand.isResolved = true;
    }
  } else {
    hand.isBlackjack = false;
  }
}

function findSeat(state: GameState, seatIndex: number): Seat {
  const seat = state.seats[seatIndex];
  if (!seat) {
    throw new Error("Invalid seat index");
  }
  return seat;
}

function prepareHands(state: GameState): void {
  state.seats.forEach((seat) => {
    seat.hands = [];
    if (seat.occupied && seat.baseBet >= state.rules.minBet) {
      ensureBankroll(state, seat.baseBet);
      const hand = createHand(seat.baseBet, seat.index);
      dealCardToHand(state, hand);
      dealCardToHand(state, hand);
      evaluateBlackjack(hand);
      seat.hands = [hand];
    }
  });
}

function createDealerHand(): Hand {
  return {
    id: "dealer",
    cards: [],
    bet: 0,
    isResolved: false,
    isBlackjack: false,
    parentSeatIndex: -1,
    originatesFromSplit: false
  };
}

function prepareDealer(state: GameState): void {
  state.dealer = {
    upcard: undefined,
    holeCard: undefined,
    hand: createDealerHand()
  };
  dealCardToHand(state, state.dealer.hand);
  dealCardToHand(state, state.dealer.hand);
  state.dealer.upcard = state.dealer.hand.cards[0];
  state.dealer.holeCard = state.dealer.hand.cards[1];
  evaluateBlackjack(state.dealer.hand);
}

function nextActiveSeatIndex(state: GameState): number | null {
  for (let i = 0; i < state.seats.length; i += 1) {
    const seat = state.seats[i];
    if (seat.hands.some((hand) => !hand.isResolved)) {
      return seat.index;
    }
  }
  return null;
}

function nextActiveHandId(state: GameState, seatIndex: number | null): string | null {
  if (seatIndex === null) return null;
  const seat = findSeat(state, seatIndex);
  const hand = seat.hands.find((h) => !h.isResolved);
  return hand?.id ?? null;
}

function prepareNextActiveHand(state: GameState): void {
  state.activeSeatIndex = nextActiveSeatIndex(state);
  state.activeHandId = nextActiveHandId(state, state.activeSeatIndex);
  if (state.activeSeatIndex === null) {
    state.phase = "dealerPlay";
  }
}

function rotateToNextSeat(state: GameState, currentSeatIndex: number): void {
  for (let i = currentSeatIndex + 1; i < state.seats.length; i += 1) {
    const nextSeat = state.seats[i];
    const hand = nextSeat.hands.find((h) => !h.isResolved);
    if (hand) {
      state.activeSeatIndex = nextSeat.index;
      state.activeHandId = hand.id;
      return;
    }
  }
  state.activeSeatIndex = null;
  state.activeHandId = null;
  state.phase = "dealerPlay";
}

function rotateToNextHand(state: GameState): void {
  const seatIndex = state.activeSeatIndex;
  if (seatIndex === null) {
    state.phase = "dealerPlay";
    state.activeHandId = null;
    return;
  }
  const seat = findSeat(state, seatIndex);
  const currentIndex = seat.hands.findIndex((hand) => hand.id === state.activeHandId);
  if (currentIndex === -1) {
    const hand = seat.hands.find((h) => !h.isResolved);
    if (hand) {
      state.activeHandId = hand.id;
      return;
    }
    rotateToNextSeat(state, seatIndex);
    return;
  }
  for (let i = currentIndex + 1; i < seat.hands.length; i += 1) {
    if (!seat.hands[i].isResolved) {
      state.activeHandId = seat.hands[i].id;
      return;
    }
  }
  rotateToNextSeat(state, seatIndex);
}

function settleInsuranceForDealerBlackjack(state: GameState): void {
  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      if (hand.insuranceBet && hand.insuranceBet > 0) {
        refund(state, hand.insuranceBet * 3);
        markMessage(state, `Seat ${seat.index + 1} insurance paid`);
        hand.insuranceBet = 0;
      }
    });
  });
}

function payoutBlackjack(hand: Hand, state: GameState): void {
  const multiplier = state.rules.blackjackPayout === "3:2" ? 1.5 : 1.2;
  refund(state, hand.bet * (1 + multiplier));
  hand.isResolved = true;
}

function payoutWin(hand: Hand, state: GameState): void {
  refund(state, hand.bet * 2);
  hand.isResolved = true;
}

function payoutPush(hand: Hand, state: GameState): void {
  refund(state, hand.bet);
  hand.isResolved = true;
}

function handleDealerBlackjack(state: GameState): void {
  markMessage(state, "Dealer has blackjack");
  settleInsuranceForDealerBlackjack(state);
  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      if (hand.cards.length === 0) return;
      if (hand.isBlackjack) {
        payoutPush(hand, state);
      } else {
        hand.isResolved = true;
      }
    });
  });
  state.phase = "settlement";
}

function handleBust(state: GameState, hand: Hand): boolean {
  if (isBust(hand)) {
    hand.isResolved = true;
    markMessage(state, `Seat ${hand.parentSeatIndex + 1} busts`);
    rotateToNextHand(state);
    return true;
  }
  return false;
}

function handleSplit(state: GameState, seat: Seat, hand: Hand): void {
  const [firstCard, secondCard] = hand.cards;
  if (!firstCard || !secondCard) {
    throw new Error("Cannot split without two cards");
  }
  ensureBankroll(state, hand.bet);
  const newHand = createHand(hand.bet, seat.index);
  newHand.cards = [secondCard];
  newHand.originatesFromSplit = true;
  hand.cards = [firstCard];
  hand.originatesFromSplit = true;
  hand.isBlackjack = false;
  newHand.isBlackjack = false;
  const insertIndex = seat.hands.findIndex((h) => h.id === hand.id) + 1;
  seat.hands.splice(insertIndex, 0, newHand);
  dealCardToHand(state, hand);
  dealCardToHand(state, newHand);
  evaluateBlackjack(hand);
  evaluateBlackjack(newHand);
  const splittingAces = hand.cards[0]?.rank === "A";
  if (splittingAces && !state.rules.hitOnSplitAces) {
    hand.isResolved = true;
  }
  if (newHand.cards[0]?.rank === "A" && !state.rules.hitOnSplitAces) {
    newHand.isResolved = true;
  }
}

function getActiveHand(state: GameState): Hand {
  if (state.activeSeatIndex === null || !state.activeHandId) {
    throw new Error("No active hand");
  }
  const seat = findSeat(state, state.activeSeatIndex);
  const hand = seat.hands.find((h) => h.id === state.activeHandId);
  if (!hand) {
    throw new Error("Active hand not found");
  }
  return hand;
}

function dealerShouldHit(state: GameState): boolean {
  const totals = getHandTotals(state.dealer.hand);
  if (totals.soft && totals.soft <= 21) {
    if (totals.soft < 17) {
      return true;
    }
    if (totals.soft === 17) {
      return !state.rules.dealerStandsOnSoft17;
    }
    return false;
  }
  return totals.hard < 17;
}

function settleHandAgainstDealer(hand: Hand, dealerHand: Hand, state: GameState): void {
  if (hand.cards.length === 0) {
    return;
  }
  if (hand.isSurrendered) {
    hand.isResolved = true;
    return;
  }
  const dealerBlackjack = dealerHand.isBlackjack;
  if (hand.isBlackjack) {
    if (dealerBlackjack) {
      payoutPush(hand, state);
    } else {
      payoutBlackjack(hand, state);
    }
    return;
  }
  if (dealerBlackjack) {
    hand.isResolved = true;
    return;
  }
  if (isBust(hand)) {
    hand.isResolved = true;
    return;
  }
  const playerTotal = bestTotal(hand);
  const dealerBust = isBust(dealerHand);
  const dealerTotal = bestTotal(dealerHand);
  if (dealerBust) {
    payoutWin(hand, state);
    return;
  }
  if (playerTotal > dealerTotal) {
    payoutWin(hand, state);
    return;
  }
  if (playerTotal === dealerTotal) {
    payoutPush(hand, state);
    return;
  }
  hand.isResolved = true;
}

function settleInsurance(state: GameState): void {
  const dealerBlackjack = state.dealer.hand.isBlackjack;
  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      if (hand.insuranceBet && hand.insuranceBet > 0) {
        if (dealerBlackjack) {
          refund(state, hand.insuranceBet * 3);
        }
        hand.insuranceBet = 0;
      }
    });
  });
}

export function initGame(rules?: Partial<RuleConfig>): GameState {
  const mergedRules = mergeRules(rules);
  const shoe = createShoe(mergedRules.numberOfDecks, mergedRules.penetration);
  const seats = Array.from({ length: SEAT_COUNT }, (_, index) => createEmptySeat(index));
  return {
    phase: "betting",
    seats,
    dealer: {
      upcard: undefined,
      holeCard: undefined,
      hand: createHand(0, -1)
    },
    shoe,
    activeSeatIndex: null,
    activeHandId: null,
    bankroll: 100,
    messageLog: [],
    roundCount: 0,
    rules: mergedRules,
    pendingReshuffle: false,
    insuranceOffered: false
  };
}

export function sit(state: GameState, seatIndex: number): void {
  if (state.phase !== "betting") {
    throw new Error("Cannot change seats during an active round");
  }
  const seat = findSeat(state, seatIndex);
  seat.occupied = true;
  markMessage(state, `Sat at seat ${seatIndex + 1}`);
}

export function leave(state: GameState, seatIndex: number): void {
  if (state.phase !== "betting") {
    throw new Error("Cannot leave during a round");
  }
  const seat = findSeat(state, seatIndex);
  seat.occupied = false;
  seat.baseBet = 0;
  seat.hands = [];
  markMessage(state, `Left seat ${seatIndex + 1}`);
}

export function setBet(state: GameState, seatIndex: number, amount: number): void {
  if (state.phase !== "betting") {
    throw new Error("Cannot change bets outside betting phase");
  }
  const seat = findSeat(state, seatIndex);
  if (!seat.occupied) {
    throw new Error("Seat is not occupied");
  }
  if (Number.isNaN(amount) || !Number.isFinite(amount)) {
    throw new Error("Invalid bet amount");
  }
  if (amount < 0) {
    throw new Error("Bet must be non-negative");
  }
  if (amount > state.rules.maxBet) {
    throw new Error("Bet exceeds table maximum");
  }
  if (amount > state.bankroll) {
    throw new Error("Bet exceeds bankroll");
  }
  seat.baseBet = amount;
}

export function deal(state: GameState): void {
  if (state.phase !== "betting") {
    throw new Error("Round already in progress");
  }
  const totalBet = totalBetForRound(state);
  if (totalBet === 0) {
    throw new Error("At least one bet required");
  }
  state.roundCount += 1;
  state.messageLog = [];
  state.dealer = {
    upcard: undefined,
    holeCard: undefined,
    hand: createDealerHand()
  };
  prepareHands(state);
  prepareDealer(state);

  if (!state.seats.some((seat) => seat.hands.length > 0)) {
    throw new Error("No active hands after dealing");
  }

  const upRank = state.dealer.upcard?.rank;
  const isTenValue = upRank === "10" || upRank === "J" || upRank === "Q" || upRank === "K";

  if (state.rules.allowInsurance && upRank === "A") {
    state.phase = "insurance";
    state.insuranceOffered = true;
    return;
  }

  if (state.rules.dealerPeekOnTenOrAce && (upRank === "A" || isTenValue)) {
    if (state.dealer.hand.isBlackjack) {
      handleDealerBlackjack(state);
      return;
    }
  }

  state.phase = "playerActions";
  prepareNextActiveHand(state);
}

export function takeInsurance(state: GameState, seatIndex: number, handId: string, amount: number): void {
  if (state.phase !== "insurance") {
    throw new Error("Not in insurance phase");
  }
  const seat = findSeat(state, seatIndex);
  const hand = seat.hands.find((h) => h.id === handId);
  if (!hand) {
    throw new Error("Hand not found");
  }
  if (amount < 0) {
    throw new Error("Insurance must be non-negative");
  }
  const maxInsurance = hand.bet / 2;
  if (amount > maxInsurance) {
    throw new Error("Insurance exceeds limit");
  }
  if (amount > state.bankroll) {
    throw new Error("Insufficient bankroll for insurance");
  }
  ensureBankroll(state, amount);
  hand.insuranceBet = amount;
}

export function skipInsurance(state: GameState): void {
  if (state.phase !== "insurance") {
    throw new Error("Not in insurance phase");
  }
  resolveInsurancePhase(state);
}

export function offerInsurance(state: GameState): void {
  if (state.phase !== "insurance") {
    throw new Error("Not in insurance phase");
  }
  resolveInsurancePhase(state);
}

function resolveInsurancePhase(state: GameState): void {
  state.insuranceOffered = false;
  if (state.rules.dealerPeekOnTenOrAce && state.dealer.hand.isBlackjack) {
    handleDealerBlackjack(state);
    return;
  }
  state.phase = "playerActions";
  prepareNextActiveHand(state);
}

export function playerHit(state: GameState): void {
  if (state.phase !== "playerActions") {
    throw new Error("Not in player action phase");
  }
  const hand = getActiveHand(state);
  if (!canHit(hand)) {
    throw new Error("Cannot hit this hand");
  }
  dealCardToHand(state, hand);
  evaluateBlackjack(hand);
  const busted = handleBust(state, hand);
  if (!busted) {
    markMessage(state, `Seat ${hand.parentSeatIndex + 1} hits`);
  }
}

export function playerStand(state: GameState): void {
  if (state.phase !== "playerActions") {
    throw new Error("Not in player action phase");
  }
  const hand = getActiveHand(state);
  hand.isResolved = true;
  markMessage(state, `Seat ${hand.parentSeatIndex + 1} stands`);
  rotateToNextHand(state);
}

export function playerDouble(state: GameState): void {
  if (state.phase !== "playerActions") {
    throw new Error("Not in player action phase");
  }
  const hand = getActiveHand(state);
  if (!canDouble(hand, state.rules)) {
    throw new Error("Cannot double this hand");
  }
  ensureBankroll(state, hand.bet);
  hand.bet *= 2;
  hand.isDoubled = true;
  dealCardToHand(state, hand);
  hand.isResolved = true;
  evaluateBlackjack(hand);
  markMessage(state, `Seat ${hand.parentSeatIndex + 1} doubles`);
  const busted = handleBust(state, hand);
  if (!busted) {
    rotateToNextHand(state);
  }
}

export function playerSplit(state: GameState): void {
  if (state.phase !== "playerActions") {
    throw new Error("Not in player action phase");
  }
  const seatIndex = state.activeSeatIndex;
  if (seatIndex === null) {
    throw new Error("No active seat");
  }
  const seat = findSeat(state, seatIndex);
  const hand = getActiveHand(state);
  if (!canSplit(hand, seat, state.rules)) {
    throw new Error("Cannot split this hand");
  }
  handleSplit(state, seat, hand);
  state.activeHandId = hand.id;
  if (hand.isResolved) {
    rotateToNextHand(state);
  }
}

export function playerSurrender(state: GameState): void {
  if (state.phase !== "playerActions") {
    throw new Error("Not in player action phase");
  }
  if (state.rules.surrender === "none") {
    throw new Error("Surrender not allowed");
  }
  const hand = getActiveHand(state);
  if (!canSurrender(hand, state.rules)) {
    throw new Error("Cannot surrender this hand");
  }
  hand.isSurrendered = true;
  hand.isResolved = true;
  refund(state, hand.bet / 2);
  markMessage(state, `Seat ${hand.parentSeatIndex + 1} surrenders`);
  rotateToNextHand(state);
}

export function advanceToNextHandOrSeat(state: GameState): void {
  rotateToNextHand(state);
}

export function playDealer(state: GameState): void {
  if (state.phase !== "dealerPlay") {
    throw new Error("Dealer cannot play yet");
  }
  state.dealer.hand.isResolved = true;
  state.dealer.upcard = state.dealer.hand.cards[0];
  state.dealer.holeCard = state.dealer.hand.cards[1];
  while (dealerShouldHit(state)) {
    dealCardToHand(state, state.dealer.hand);
  }
  state.phase = "settlement";
}

export function settleAllHands(state: GameState): void {
  if (state.phase !== "settlement") {
    throw new Error("Settlement not ready");
  }
  settleInsurance(state);
  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => settleHandAgainstDealer(hand, state.dealer.hand, state));
  });
  discard(state.shoe, [...state.dealer.hand.cards]);
  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      discard(state.shoe, hand.cards);
      hand.isResolved = true;
    });
    seat.hands = [];
  });
  if (state.pendingReshuffle) {
    rebuildShoe(state.shoe, state.rules.numberOfDecks, state.rules.penetration);
    state.pendingReshuffle = false;
  }
  state.phase = "betting";
  state.activeSeatIndex = null;
  state.activeHandId = null;
  state.dealer.hand = createDealerHand();
}
