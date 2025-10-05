import { defaultRules } from "./rules.config";
import { canDouble, canHit, canSplit } from "./rules";
import { bestTotal, getHandTotals, isBlackjack, isBust } from "./totals";
import { type GameState, type Hand, type Phase, type RuleConfig, type Seat } from "./types";
import { createShoe, discard, drawCard, needsReshuffle, reshuffle } from "./shoe";

function createEmptyHand(parentSeatIndex: number): Hand {
  return {
    id: crypto.randomUUID(),
    cards: [],
    bet: 0,
    isResolved: false,
    isBlackjack: false,
    parentSeatIndex,
  };
}

function cloneRules(rules?: Partial<RuleConfig>): RuleConfig {
  return { ...defaultRules, ...rules };
}

function createInitialState(rules?: Partial<RuleConfig>): GameState {
  const mergedRules = cloneRules(rules);
  return {
    phase: "betting",
    seats: Array.from({ length: 7 }, (_, index) => ({
      index,
      occupied: false,
      hands: [],
      baseBet: 0,
    })),
    dealer: {
      hand: {
        id: "dealer",
        cards: [],
        bet: 0,
        isResolved: false,
        isBlackjack: false,
        parentSeatIndex: -1,
      },
    },
    shoe: createShoe(mergedRules.numberOfDecks, mergedRules.penetration),
    activeSeatIndex: null,
    activeHandId: null,
    bankroll: 100,
    messageLog: [],
    roundCount: 0,
    rules: mergedRules,
  };
}

function ensurePhase(state: GameState, expected: Phase): void {
  if (state.phase !== expected) {
    throw new Error(`Invalid phase: expected ${expected}, got ${state.phase}`);
  }
}

function prepareSeatHands(state: GameState): Seat[] {
  return state.seats.filter((seat) => seat.occupied && seat.baseBet >= state.rules.minBet);
}

function pushLog(state: GameState, message: string): void {
  state.messageLog = [...state.messageLog.slice(-19), message];
}

function dealCardToHand(state: GameState, hand: Hand): void {
  const card = drawCard(state.shoe);
  hand.cards.push(card);
}

function resetHands(state: GameState): void {
  state.seats.forEach((seat) => {
    if (seat.hands.length > 0) {
      seat.hands.forEach((hand) => discard(state.shoe, hand.cards));
    }
    seat.hands = [];
  });
  discard(state.shoe, state.dealer.hand.cards);
  state.dealer = {
    hand: {
      id: "dealer",
      cards: [],
      bet: 0,
      isResolved: false,
      isBlackjack: false,
      parentSeatIndex: -1,
    },
  };
}

function updateActiveHand(state: GameState): void {
  for (let seatIndex = 0; seatIndex < state.seats.length; seatIndex += 1) {
    const seat = state.seats[seatIndex];
    for (const hand of seat.hands) {
      if (!hand.isResolved && !hand.isSurrendered && !isBust(hand)) {
        state.activeSeatIndex = seatIndex;
        state.activeHandId = hand.id;
        return;
      }
    }
  }
  state.activeSeatIndex = null;
  state.activeHandId = null;
}

function settleInsuranceLosses(state: GameState): void {
  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      if (hand.insuranceBet !== undefined && hand.insuranceBet > 0) {
        pushLog(state, `Insurance lost for seat ${seat.index + 1}.`);
        hand.insuranceBet = undefined;
      }
    });
  });
}

function payout(hand: Hand, amount: number, state: GameState, description: string): void {
  state.bankroll += amount;
  pushLog(state, `Seat ${hand.parentSeatIndex + 1} ${description} €${Math.abs(amount).toFixed(2)}.`);
}

function handleDealerBlackjack(state: GameState): void {
  const dealerHand = state.dealer.hand;
  dealerHand.isBlackjack = isBlackjack(dealerHand);
  if (!dealerHand.isBlackjack) {
    settleInsuranceLosses(state);
    return;
  }
  state.activeHandId = null;
  state.activeSeatIndex = null;
  state.phase = "settlement";
  settleAllHands(state);
}

export function initGame(rules?: Partial<RuleConfig>): GameState {
  return createInitialState(rules);
}

export function sit(state: GameState, seatIndex: number): void {
  ensurePhase(state, "betting");
  state.seats[seatIndex].occupied = true;
  if (state.seats[seatIndex].baseBet < state.rules.minBet) {
    state.seats[seatIndex].baseBet = state.rules.minBet;
  }
}

export function leave(state: GameState, seatIndex: number): void {
  ensurePhase(state, "betting");
  state.seats[seatIndex] = {
    index: seatIndex,
    occupied: false,
    hands: [],
    baseBet: 0,
  };
}

export function setBet(state: GameState, seatIndex: number, amount: number): void {
  ensurePhase(state, "betting");
  if (amount < 0) throw new Error("Bet must be positive");
  const capped = Math.min(amount, state.bankroll, state.rules.maxBet);
  state.seats[seatIndex].baseBet = capped;
}

function totalLockedBets(state: GameState): number {
  return state.seats.reduce((sum, seat) => {
    if (seat.occupied && seat.baseBet >= state.rules.minBet) {
      return sum + seat.baseBet;
    }
    return sum;
  }, 0);
}

function createInitialHands(state: GameState): void {
  state.seats.forEach((seat) => {
    seat.hands = [];
    if (seat.occupied && seat.baseBet >= state.rules.minBet) {
      const hand = createEmptyHand(seat.index);
      hand.bet = seat.baseBet;
      seat.hands.push(hand);
    }
  });
}

export function deal(state: GameState): void {
  ensurePhase(state, "betting");
  if (needsReshuffle(state.shoe)) {
    state.shoe = reshuffle(state.shoe, state.rules.numberOfDecks, state.rules.penetration);
    pushLog(state, "Shoe reshuffled before deal.");
  }
  const seatsToPlay = prepareSeatHands(state);
  if (seatsToPlay.length === 0) {
    throw new Error("No active bets");
  }
  const totalBet = totalLockedBets(state);
  if (totalBet > state.bankroll) {
    throw new Error("Insufficient bankroll for all bets");
  }
  state.bankroll -= totalBet;

  resetHands(state);
  createInitialHands(state);

  // Deal two rounds to player hands then dealer
  for (let round = 0; round < 2; round += 1) {
    state.seats.forEach((seat) => {
      const hand = seat.hands[0];
      if (hand) {
        dealCardToHand(state, hand);
      }
    });
    if (round === 0) {
      const card = drawCard(state.shoe);
      state.dealer.upcard = card;
      state.dealer.hand.cards.push(card);
    } else {
      const hole = drawCard(state.shoe);
      state.dealer.holeCard = hole;
      state.dealer.hand.cards.push(hole);
    }
  }

  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      hand.isBlackjack = isBlackjack(hand);
      if (hand.isBlackjack) {
        hand.isResolved = true;
      }
    });
  });
  state.dealer.hand.isBlackjack = isBlackjack(state.dealer.hand);

  state.phase = "playerActions";
  if (state.rules.allowInsurance && state.dealer.upcard?.rank === "A") {
    state.phase = "insurance";
  }

  if (state.rules.dealerPeekOnTenOrAce) {
    const up = state.dealer.upcard;
    if (up && (up.rank === "A" || up.rank === "10" || up.rank === "J" || up.rank === "Q" || up.rank === "K")) {
      if (isBlackjack(state.dealer.hand)) {
        handleDealerBlackjack(state);
        return;
      }
      if (state.phase === "insurance") {
        // If dealer does not have blackjack after peek, insurance phase ends immediately.
        state.phase = "playerActions";
        settleInsuranceLosses(state);
      }
    }
  }

  updateActiveHand(state);
  if (state.activeSeatIndex === null) {
    state.phase = "dealerPlay";
  }
}

export function offerInsurance(state: GameState): void {
  if (!state.rules.allowInsurance) return;
  if (state.dealer.upcard?.rank === "A") {
    state.phase = "insurance";
  }
}

export function takeInsurance(state: GameState, seatIndex: number, handId: string, amount: number): void {
  ensurePhase(state, "insurance");
  const seat = state.seats[seatIndex];
  const hand = seat.hands.find((h) => h.id === handId);
  if (!hand) throw new Error("Hand not found");
  if (hand.insuranceBet !== undefined) throw new Error("Insurance already taken");
  const cap = hand.bet / 2;
  if (amount < 0 || amount > cap) throw new Error("Invalid insurance amount");
  if (amount > state.bankroll) throw new Error("Insufficient bankroll for insurance");
  state.bankroll -= amount;
  hand.insuranceBet = amount;
  pushLog(state, `Seat ${seatIndex + 1} takes insurance €${amount.toFixed(2)}.`);
}

export function skipInsurance(state: GameState): void {
  ensurePhase(state, "insurance");
  state.phase = "playerActions";
  updateActiveHand(state);
  if (state.activeSeatIndex === null) {
    state.phase = "dealerPlay";
  }
}

function resolveBust(state: GameState, hand: Hand): void {
  hand.isResolved = true;
  pushLog(state, `Seat ${hand.parentSeatIndex + 1} busts.`);
}

export function playerHit(state: GameState): void {
  ensurePhase(state, "playerActions");
  if (state.activeSeatIndex === null || state.activeHandId === null) return;
  const seat = state.seats[state.activeSeatIndex];
  const hand = seat.hands.find((h) => h.id === state.activeHandId);
  if (!hand || !canHit(state, hand)) return;
  dealCardToHand(state, hand);
  if (isBust(hand)) {
    resolveBust(state, hand);
    advanceToNextHandOrSeat(state);
  }
}

export function playerStand(state: GameState): void {
  ensurePhase(state, "playerActions");
  if (state.activeSeatIndex === null || state.activeHandId === null) return;
  const seat = state.seats[state.activeSeatIndex];
  const hand = seat.hands.find((h) => h.id === state.activeHandId);
  if (!hand) return;
  hand.isResolved = true;
  advanceToNextHandOrSeat(state);
}

export function playerDouble(state: GameState): void {
  ensurePhase(state, "playerActions");
  if (state.activeSeatIndex === null || state.activeHandId === null) return;
  const seat = state.seats[state.activeSeatIndex];
  const hand = seat.hands.find((h) => h.id === state.activeHandId);
  if (!hand || !canDouble(state, state.rules, hand)) return;
  state.bankroll -= hand.bet;
  hand.bet *= 2;
  hand.isDoubled = true;
  dealCardToHand(state, hand);
  hand.isResolved = true;
  if (isBust(hand)) {
    resolveBust(state, hand);
  }
  advanceToNextHandOrSeat(state);
}

export function playerSplit(state: GameState): void {
  ensurePhase(state, "playerActions");
  if (state.activeSeatIndex === null || state.activeHandId === null) return;
  const seat = state.seats[state.activeSeatIndex];
  const handIndex = seat.hands.findIndex((h) => h.id === state.activeHandId);
  if (handIndex === -1) return;
  const hand = seat.hands[handIndex];
  if (!canSplit(state, state.rules, hand)) return;

  const originalBet = hand.bet;
  state.bankroll -= originalBet;

  const [firstCard, secondCard] = hand.cards;
  if (!firstCard || !secondCard) return;

  const handOne: Hand = {
    id: crypto.randomUUID(),
    cards: [firstCard],
    bet: originalBet,
    isResolved: false,
    isBlackjack: false,
    parentSeatIndex: seat.index,
  };
  const handTwo: Hand = {
    id: crypto.randomUUID(),
    cards: [secondCard],
    bet: originalBet,
    isResolved: false,
    isBlackjack: false,
    parentSeatIndex: seat.index,
  };

  seat.hands.splice(handIndex, 1, handOne, handTwo);

  dealCardToHand(state, handOne);
  dealCardToHand(state, handTwo);
  handOne.isBlackjack = false;
  handTwo.isBlackjack = false;

  if (firstCard.rank === "A" && !state.rules.hitOnSplitAces) {
    handOne.isResolved = true;
    handTwo.isResolved = true;
  }

  state.activeHandId = handOne.id;
  updateActiveHand(state);
}

export function playerSurrender(state: GameState): void {
  if (state.rules.surrender === "none") return;
  if (state.rules.surrender === "late") ensurePhase(state, "playerActions");
  if (state.rules.surrender === "early") ensurePhase(state, "insurance");
  if (state.activeSeatIndex === null || state.activeHandId === null) return;
  const seat = state.seats[state.activeSeatIndex];
  const hand = seat.hands.find((h) => h.id === state.activeHandId);
  if (!hand) return;
  hand.isSurrendered = true;
  hand.isResolved = true;
  state.bankroll += hand.bet / 2;
  pushLog(state, `Seat ${seat.index + 1} surrenders.`);
  advanceToNextHandOrSeat(state);
}

export function advanceToNextHandOrSeat(state: GameState): void {
  updateActiveHand(state);
  if (state.activeSeatIndex === null) {
    state.phase = "dealerPlay";
  }
}

export function playDealer(state: GameState): void {
  ensurePhase(state, "dealerPlay");
  const dealerHand = state.dealer.hand;
  dealerHand.isResolved = true;

  let drawing = true;
  while (drawing) {
    const totals = getHandTotals(dealerHand);
    const best = bestTotal(dealerHand);
    const soft = totals.soft !== undefined && totals.soft !== totals.hard;

    if (best > 21) {
      break;
    }

    const shouldHit =
      best < 17 || (best === 17 && soft && !state.rules.dealerStandsOnSoft17);

    if (shouldHit) {
      dealCardToHand(state, dealerHand);
    } else {
      drawing = false;
    }
  }

  state.phase = "settlement";
  settleAllHands(state);
}

function compareHands(player: Hand, dealer: Hand): number {
  const dealerBust = isBust(dealer);
  const playerBust = isBust(player);
  if (player.isSurrendered) {
    return -0.5;
  }
  if (playerBust) return -1;
  if (dealerBust) return 1;
  const playerTotal = bestTotal(player);
  const dealerTotal = bestTotal(dealer);
  if (player.isBlackjack && !dealer.isBlackjack) {
    return 1.5;
  }
  if (!player.isBlackjack && dealer.isBlackjack) {
    return -1;
  }
  if (playerTotal > dealerTotal) return 1;
  if (playerTotal < dealerTotal) return -1;
  return 0;
}

export function settleAllHands(state: GameState): void {
  const dealerHand = state.dealer.hand;
  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      if (hand.insuranceBet && dealerHand.isBlackjack) {
        const amount = hand.insuranceBet * 3;
        state.bankroll += amount;
        pushLog(state, `Insurance pays for seat ${seat.index + 1}.`);
        hand.insuranceBet = undefined;
      } else if (hand.insuranceBet && !dealerHand.isBlackjack) {
        pushLog(state, `Insurance lost for seat ${seat.index + 1}.`);
        hand.insuranceBet = undefined;
      }

      const result = compareHands(hand, dealerHand);
      if (result > 0) {
        let payoutAmount = hand.bet;
        if (result === 1.5) {
          payoutAmount = hand.bet * (state.rules.blackjackPayout === "3:2" ? 1.5 : 1.2);
        }
        payout(hand, hand.bet + payoutAmount, state, "wins");
      } else if (result === 0) {
        payout(hand, hand.bet, state, "pushes");
      } else if (result < 0 && !hand.isSurrendered) {
        pushLog(state, `Seat ${hand.parentSeatIndex + 1} loses €${hand.bet.toFixed(2)}.`);
      }
      hand.isResolved = true;
    });
  });
  state.roundCount += 1;
  state.activeHandId = null;
  state.activeSeatIndex = null;
}

export function prepareNextRound(state: GameState): void {
  ensurePhase(state, "settlement");
  resetHands(state);
  state.phase = "betting";
  state.activeHandId = null;
  state.activeSeatIndex = null;
  if (needsReshuffle(state.shoe)) {
    state.shoe = reshuffle(state.shoe, state.rules.numberOfDecks, state.rules.penetration);
    pushLog(state, "Shoe reshuffled for next round.");
  }
}
