import { defaultRuleConfig } from "./rules.config";
import { canDouble, canHit, canSplit, canSurrender, isBlackjackHand } from "./rules";
import { bestTotal, getHandTotals, isBust } from "./totals";
import { createShoe, discard as discardCards, drawCard, reshuffleIfNeeded } from "./shoe";
import type { Card, GameState, Hand, Phase, RuleConfig } from "./types";

let handCounter = 0;

const CHIP_DENOMINATIONS = [500, 100, 25, 5, 1];

export const convertAmountToChips = (amount: number): number[] => {
  const chips: number[] = [];
  let remaining = Math.max(0, Math.floor(amount));
  for (const value of CHIP_DENOMINATIONS) {
    while (remaining >= value) {
      chips.push(value);
      remaining -= value;
    }
  }
  return chips;
};

const createHand = (seatIndex: number, bet: number): Hand => ({
  id: `hand-${seatIndex}-${handCounter += 1}`,
  cards: [],
  bet,
  isResolved: false,
  isBlackjack: false,
  parentSeatIndex: seatIndex
});

const cloneRules = (overrides?: Partial<RuleConfig>): RuleConfig => ({
  ...defaultRuleConfig,
  ...overrides
});

const createEmptySeats = (): GameState["seats"] =>
  Array.from({ length: 5 }, (_, index) => ({ index, occupied: false, hands: [], baseBet: 0, chips: [] }));

const initialDealerHand = (): Hand => ({
  id: "dealer",
  cards: [],
  bet: 0,
  isResolved: false,
  isBlackjack: false,
  parentSeatIndex: -1
});

const resetDealer = (): { upcard?: Card; holeCard?: Card; hand: Hand } => ({
  upcard: undefined,
  holeCard: undefined,
  hand: { ...initialDealerHand(), cards: [] }
});

const appendLog = (state: GameState, message: string): void => {
  state.messageLog = [...state.messageLog.slice(-20), message];
};

const nextPhase = (state: GameState, phase: Phase): void => {
  state.phase = phase;
};

const allHands = (state: GameState): Hand[] => state.seats.flatMap((seat) => seat.hands);

const activateFirstHand = (state: GameState): void => {
  for (const seat of state.seats) {
    if (!seat.occupied) {
      continue;
    }
    const hand = seat.hands.find((h) => !h.isResolved);
    if (hand) {
      state.activeSeatIndex = seat.index;
      state.activeHandId = hand.id;
      return;
    }
  }
  state.activeSeatIndex = null;
  state.activeHandId = null;
};

const shouldDealerPeek = (state: GameState): boolean => {
  if (!state.rules.dealerPeekOnTenOrAce) {
    return false;
  }
  const up = state.dealer.upcard;
  if (!up) {
    return false;
  }
  if (up.rank === "A") {
    return true;
  }
  return up.rank === "10" || up.rank === "J" || up.rank === "Q" || up.rank === "K";
};

const resolveDealerBlackjack = (state: GameState): void => {
  state.dealer.hand.isBlackjack = true;
  appendLog(state, "Dealer has blackjack");
  for (const hand of allHands(state)) {
    hand.isResolved = true;
  }
  state.activeHandId = null;
  state.activeSeatIndex = null;
  nextPhase(state, "settlement");
};

const ensureBankroll = (state: GameState, amount: number): void => {
  if (state.bankroll < amount - 1e-6) {
    throw new Error("Insufficient bankroll for this action");
  }
  state.bankroll -= amount;
};

const dealInitialCards = (state: GameState): void => {
  const activeSeats = state.seats.filter((seat) => seat.occupied && seat.baseBet >= state.rules.minBet);
  if (activeSeats.length === 0) {
    throw new Error("No active seats with bets");
  }
  let totalRequired = 0;
  for (const seat of activeSeats) {
    totalRequired += seat.baseBet;
  }
  if (totalRequired > state.bankroll + 1e-6) {
    throw new Error("Bankroll too low for combined bets");
  }
  const shoe = state.shoe;
  for (const seat of activeSeats) {
    const hand = createHand(seat.index, seat.baseBet);
    ensureBankroll(state, seat.baseBet);
    seat.hands = [hand];
  }
  state.dealer = resetDealer();

  // Deal first card to each player
  for (const seat of activeSeats) {
    const hand = seat.hands[0];
    const card = drawCard(shoe);
    hand.cards.push(card);
  }
  // Dealer upcard
  const dealerUpcard = drawCard(shoe);
  state.dealer.upcard = dealerUpcard;
  state.dealer.hand.cards.push(dealerUpcard);

  // Second card for players
  for (const seat of activeSeats) {
    const hand = seat.hands[0];
    const card = drawCard(shoe);
    hand.cards.push(card);
    hand.isBlackjack = isBlackjackHand(hand);
  }
  // Dealer hole card
  const hole = drawCard(shoe);
  state.dealer.holeCard = hole;
  state.dealer.hand.cards.push(hole);
  state.dealer.hand.isBlackjack = isBlackjackHand(state.dealer.hand);

  state.awaitingInsuranceResolution = false;

  if (state.rules.allowInsurance && state.dealer.upcard?.rank === "A") {
    state.awaitingInsuranceResolution = true;
    nextPhase(state, "insurance");
    appendLog(state, "Insurance offered to players");
  } else if (shouldDealerPeek(state)) {
    if (state.dealer.hand.isBlackjack) {
      resolveDealerBlackjack(state);
      return;
    }
    nextPhase(state, "playerActions");
    activateFirstHand(state);
  } else {
    nextPhase(state, "playerActions");
    activateFirstHand(state);
  }
};

export const initGame = (overrides?: Partial<RuleConfig>): GameState => {
  const rules = cloneRules(overrides);
  return {
    phase: "betting",
    seats: createEmptySeats(),
    dealer: resetDealer(),
    shoe: createShoe(rules.numberOfDecks, rules.penetration),
    activeSeatIndex: null,
    activeHandId: null,
    bankroll: 100,
    messageLog: [],
    roundCount: 0,
    rules,
    awaitingInsuranceResolution: false
  };
};

export const sit = (state: GameState, seatIndex: number): void => {
  const seat = state.seats[seatIndex];
  seat.occupied = true;
};

export const leave = (state: GameState, seatIndex: number): void => {
  const seat = state.seats[seatIndex];
  seat.occupied = false;
  seat.baseBet = 0;
  seat.hands = [];
  seat.chips = [];
};

export const setBet = (state: GameState, seatIndex: number, amount: number): void => {
  const seat = state.seats[seatIndex];
  seat.baseBet = Math.max(0, Math.floor(amount));
  if (!Array.isArray(seat.chips)) {
    seat.chips = [];
  }
  seat.chips = convertAmountToChips(seat.baseBet);
};

export const deal = (state: GameState): void => {
  if (state.phase !== "betting") {
    throw new Error("Cannot deal outside betting phase");
  }
  state.shoe = reshuffleIfNeeded(state.shoe, state.rules.numberOfDecks, state.rules.penetration);
  dealInitialCards(state);
};

const getActiveHand = (state: GameState): Hand => {
  if (state.activeSeatIndex === null || state.activeHandId === null) {
    throw new Error("No active hand");
  }
  const seat = state.seats[state.activeSeatIndex];
  const hand = seat.hands.find((h) => h.id === state.activeHandId);
  if (!hand) {
    throw new Error("Active hand missing");
  }
  return hand;
};

export const takeInsurance = (state: GameState, seatIndex: number, handId: string, amount: number): void => {
  if (state.phase !== "insurance") {
    throw new Error("Not in insurance phase");
  }
  const seat = state.seats[seatIndex];
  const hand = seat.hands.find((h) => h.id === handId);
  if (!hand) {
    throw new Error("Hand not found");
  }
  const maxInsurance = hand.bet / 2;
  if (amount < 0 || amount > maxInsurance) {
    throw new Error("Invalid insurance amount");
  }
  ensureBankroll(state, amount);
  hand.insuranceBet = amount;
  appendLog(state, `Seat ${seatIndex + 1} insurance €${amount.toFixed(2)}`);
  finalizeInsurancePhase(state);
};

export const declineInsurance = (state: GameState, seatIndex: number, handId: string): void => {
  if (state.phase !== "insurance") {
    throw new Error("Not in insurance phase");
  }
  const seat = state.seats[seatIndex];
  const hand = seat.hands.find((h) => h.id === handId);
  if (!hand) {
    throw new Error("Hand not found");
  }
  hand.insuranceBet = 0;
  finalizeInsurancePhase(state);
};

const finalizeInsurancePhase = (state: GameState): void => {
  if (state.phase !== "insurance") {
    return;
  }
  const outstanding = state.seats.some((seat) =>
    seat.hands.some((hand) => hand.isResolved === false && hand.insuranceBet === undefined)
  );
  if (outstanding) {
    return;
  }
  state.awaitingInsuranceResolution = false;
  if (shouldDealerPeek(state) && state.dealer.hand.isBlackjack) {
    resolveDealerBlackjack(state);
    return;
  }
  if (shouldDealerPeek(state)) {
    appendLog(state, "Dealer peeks and has no blackjack");
  }
  nextPhase(state, "playerActions");
  activateFirstHand(state);
};

export const finishInsurance = (state: GameState): void => {
  if (state.phase !== "insurance") {
    return;
  }
  for (const seat of state.seats) {
    for (const hand of seat.hands) {
      if (!hand.isResolved && hand.insuranceBet === undefined) {
        hand.insuranceBet = 0;
      }
    }
  }
  finalizeInsurancePhase(state);
};

const moveToNextHand = (state: GameState): void => {
  const currentSeatIndex = state.activeSeatIndex ?? 0;
  const currentHandId = state.activeHandId;
  const seatOrder = [...state.seats];
  for (let seatOffset = 0; seatOffset < seatOrder.length; seatOffset += 1) {
    const seatIndex = (currentSeatIndex + seatOffset) % seatOrder.length;
    const seat = seatOrder[seatIndex];
    if (!seat.occupied) {
      continue;
    }
    const hands = seat.hands;
    const startingIndex = seatIndex === currentSeatIndex && currentHandId
      ? hands.findIndex((hand) => hand.id === currentHandId) + 1
      : 0;
    for (let handIdx = startingIndex; handIdx < hands.length; handIdx += 1) {
      const hand = hands[handIdx];
      if (!hand.isResolved && !isBust(hand)) {
        state.activeSeatIndex = seat.index;
        state.activeHandId = hand.id;
        return;
      }
    }
  }
  state.activeSeatIndex = null;
  state.activeHandId = null;
  nextPhase(state, "dealerPlay");
};

export const playerHit = (state: GameState): void => {
  if (state.phase !== "playerActions") {
    throw new Error("Cannot hit now");
  }
  const hand = getActiveHand(state);
  if (!canHit(hand)) {
    throw new Error("Hit not allowed");
  }
  const card = drawCard(state.shoe);
  hand.cards.push(card);
  hand.hasActed = true;
  appendLog(state, `Seat ${hand.parentSeatIndex + 1} hits ${card.rank}${card.suit}`);
  if (isBust(hand)) {
    hand.isResolved = true;
    appendLog(state, `Seat ${hand.parentSeatIndex + 1} busts`);
    moveToNextHand(state);
  }
};

export const playerStand = (state: GameState): void => {
  if (state.phase !== "playerActions") {
    throw new Error("Cannot stand now");
  }
  const hand = getActiveHand(state);
  hand.isResolved = true;
  appendLog(state, `Seat ${hand.parentSeatIndex + 1} stands`);
  moveToNextHand(state);
};

export const playerDouble = (state: GameState): void => {
  if (state.phase !== "playerActions") {
    throw new Error("Cannot double now");
  }
  const hand = getActiveHand(state);
  if (!canDouble(hand, state.rules)) {
    throw new Error("Double not allowed");
  }
  ensureBankroll(state, hand.bet);
  hand.bet *= 2;
  hand.isDoubled = true;
  const card = drawCard(state.shoe);
  hand.cards.push(card);
  hand.hasActed = true;
  hand.isResolved = true;
  appendLog(state, `Seat ${hand.parentSeatIndex + 1} doubles and draws ${card.rank}${card.suit}`);
  moveToNextHand(state);
};

const handleSplitAces = (state: GameState, hand: Hand, newHand: Hand): void => {
  if (hand.cards[0].rank === "A") {
    newHand.isSplitAce = true;
    if (!state.rules.hitOnSplitAces) {
      newHand.hasActed = true;
    }
  }
};

export const playerSplit = (state: GameState): void => {
  if (state.phase !== "playerActions") {
    throw new Error("Cannot split now");
  }
  const seat = state.seats[state.activeSeatIndex ?? 0];
  const hand = getActiveHand(state);
  if (!canSplit(hand, seat, state.rules)) {
    throw new Error("Split not allowed");
  }
  if (state.bankroll < hand.bet - 1e-6) {
    throw new Error("Insufficient bankroll to split");
  }
  ensureBankroll(state, hand.bet);
  const [firstCard, secondCard] = hand.cards;
  const firstHand = createHand(seat.index, hand.bet);
  const secondHand = createHand(seat.index, hand.bet);
  firstHand.cards.push(firstCard);
  secondHand.cards.push(secondCard);
  firstHand.isSplitHand = true;
  secondHand.isSplitHand = true;
  handleSplitAces(state, hand, firstHand);
  handleSplitAces(state, hand, secondHand);
  const handIndex = seat.hands.findIndex((h) => h.id === hand.id);
  seat.hands.splice(handIndex, 1, firstHand, secondHand);
  appendLog(state, `Seat ${seat.index + 1} splits ${firstCard.rank}s`);

  const newHands = [firstHand, secondHand];
  for (const newHand of newHands) {
    const card = drawCard(state.shoe);
    newHand.cards.push(card);
    if (newHand.isSplitAce && !state.rules.hitOnSplitAces) {
      newHand.isResolved = true;
      appendLog(state, `Seat ${seat.index + 1} split ace gets ${card.rank}${card.suit}`);
    }
  }

  state.activeHandId = firstHand.id;
  state.activeSeatIndex = seat.index;
  if (firstHand.isResolved) {
    moveToNextHand(state);
  }
};

export const playerSurrender = (state: GameState): void => {
  if (state.phase !== "playerActions") {
    throw new Error("Cannot surrender now");
  }
  const hand = getActiveHand(state);
  if (!canSurrender(hand, state.rules)) {
    throw new Error("Surrender not allowed");
  }
  hand.isSurrendered = true;
  hand.isResolved = true;
  const refund = hand.bet / 2;
  state.bankroll += refund;
  appendLog(state, `Seat ${hand.parentSeatIndex + 1} surrenders and receives €${refund.toFixed(2)}`);
  moveToNextHand(state);
};

export const advanceToNextHandOrSeat = (state: GameState): void => {
  moveToNextHand(state);
};

const dealerShouldHit = (state: GameState): boolean => {
  const dealerHand = state.dealer.hand;
  if (isBust(dealerHand)) {
    return false;
  }
  const total = bestTotal(dealerHand);
  if (total < 17) {
    return true;
  }
  if (total === 17) {
    const totals = getHandTotals(dealerHand);
    const hasSoft = totals.soft !== undefined && totals.soft !== totals.hard;
    if (hasSoft) {
      return !state.rules.dealerStandsOnSoft17;
    }
  }
  return false;
};

export type DealerStepResult = "idle" | "hit" | "stand";

export const playDealerStep = (state: GameState): DealerStepResult => {
  if (state.phase !== "dealerPlay") {
    return "idle";
  }
  state.dealer.hand.isResolved = false;
  if (dealerShouldHit(state)) {
    const card = drawCard(state.shoe);
    state.dealer.hand.cards.push(card);
    appendLog(state, `Dealer draws ${card.rank}${card.suit}`);
    return "hit";
  }
  const total = bestTotal(state.dealer.hand);
  appendLog(state, `Dealer stands with ${total}`);
  nextPhase(state, "settlement");
  return "stand";
};

export const playDealer = (state: GameState): void => {
  if (state.phase !== "dealerPlay") {
    return;
  }
  while (true) {
    const result = playDealerStep(state);
    if (result !== "hit") {
      break;
    }
  }
};

const blackjackPayoutMultiplier = (rules: RuleConfig): number => {
  switch (rules.blackjackPayout) {
    case "3:2":
      return 1.5;
    case "6:5":
      return 1.2;
    default:
      return 1.5;
  }
};

const settleHand = (state: GameState, hand: Hand, dealerBust: boolean, dealerTotal: number): void => {
  if (hand.isSurrendered) {
    hand.isResolved = true;
    return;
  }
  if (isBust(hand)) {
    hand.isResolved = true;
    appendLog(state, `Seat ${hand.parentSeatIndex + 1} busts and loses`);
    return;
  }
  const playerTotal = bestTotal(hand);
  if (hand.isBlackjack && !state.dealer.hand.isBlackjack) {
    const winnings = hand.bet * blackjackPayoutMultiplier(state.rules);
    state.bankroll += hand.bet + winnings;
    appendLog(state, `Seat ${hand.parentSeatIndex + 1} blackjack wins €${winnings.toFixed(2)}`);
    hand.isResolved = true;
    return;
  }
  if (state.dealer.hand.isBlackjack) {
    appendLog(state, `Seat ${hand.parentSeatIndex + 1} loses to dealer blackjack`);
    hand.isResolved = true;
    return;
  }
  if (dealerBust) {
    const winnings = hand.bet;
    state.bankroll += hand.bet + winnings;
    appendLog(state, `Seat ${hand.parentSeatIndex + 1} wins €${winnings.toFixed(2)} (dealer bust)`);
    hand.isResolved = true;
    return;
  }
  if (playerTotal > dealerTotal) {
    const winnings = hand.bet;
    state.bankroll += hand.bet + winnings;
    appendLog(state, `Seat ${hand.parentSeatIndex + 1} wins €${winnings.toFixed(2)}`);
  } else if (playerTotal === dealerTotal) {
    state.bankroll += hand.bet;
    appendLog(state, `Seat ${hand.parentSeatIndex + 1} pushes`);
  } else {
    appendLog(state, `Seat ${hand.parentSeatIndex + 1} loses`);
  }
  hand.isResolved = true;
};

export const settleAllHands = (state: GameState): void => {
  if (state.phase !== "settlement") {
    return;
  }
  const dealerBust = isBust(state.dealer.hand);
  const dealerTotal = bestTotal(state.dealer.hand);
  if (state.dealer.hand.isBlackjack) {
    for (const hand of allHands(state)) {
      if (hand.insuranceBet && hand.insuranceBet > 0) {
        state.bankroll += hand.insuranceBet * 3;
      }
      if (hand.isBlackjack) {
        state.bankroll += hand.bet;
      }
      hand.isResolved = true;
    }
  } else {
    for (const hand of allHands(state)) {
      settleHand(state, hand, dealerBust, dealerTotal);
    }
  }
  for (const seat of state.seats) {
    for (const hand of seat.hands) {
      discardCards(state.shoe, hand.cards);
    }
  }
  discardCards(state.shoe, state.dealer.hand.cards);
  state.roundCount += 1;
};

export const prepareNextRound = (state: GameState): void => {
  state.dealer = resetDealer();
  for (const seat of state.seats) {
    seat.hands = [];
  }
  state.activeSeatIndex = null;
  state.activeHandId = null;
  nextPhase(state, "betting");
  state.awaitingInsuranceResolution = false;
  if (state.shoe.needsReshuffle) {
    state.shoe = createShoe(state.rules.numberOfDecks, state.rules.penetration);
    appendLog(state, "Shoe reshuffled");
  }
};
