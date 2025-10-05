import { Card, Rank, Shoe, Suit } from './types'

const suits: Suit[] = ['♠', '♥', '♦', '♣']
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const getCrypto = (): Crypto => {
  if (typeof globalThis.crypto === 'undefined') {
    throw new Error('Crypto API is not available in this environment')
  }
  return globalThis.crypto
}

const getRandomInt = (max: number): number => {
  const crypto = getCrypto()
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % (max + 1)
}

const shuffle = (cards: Card[]): void => {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = getRandomInt(i)
    const temp = cards[i]
    cards[i] = cards[j]
    cards[j] = temp
  }
}

export const createShoe = (decks: number, penetration: number): Shoe => {
  const cards: Card[] = []
  for (let d = 0; d < decks; d += 1) {
    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        cards.push({ suit, rank })
      })
    })
  }

  shuffle(cards)
  const total = cards.length
  const cutIndex = Math.floor(total * (1 - penetration))

  return {
    cards,
    discard: [],
    cutIndex,
    decks,
    penetration,
    initialCount: total,
    needsShuffle: false,
  }
}

export const reshuffleShoe = (shoe: Shoe): void => {
  shoe.cards.push(...shoe.discard)
  shoe.discard.length = 0
  shuffle(shoe.cards)
  shoe.needsShuffle = false
}

export const drawCard = (shoe: Shoe): Card => {
  if (shoe.cards.length === 0) {
    reshuffleShoe(shoe)
  }
  const card = shoe.cards.pop()
  if (!card) {
    throw new Error('Shoe is empty')
  }
  if (shoe.cards.length <= shoe.cutIndex) {
    shoe.needsShuffle = true
  }
  return card
}

export const discardCards = (shoe: Shoe, cards: Card[]): void => {
  shoe.discard.push(...cards)
}

export const cardsRemaining = (shoe: Shoe): number => shoe.cards.length

export const discardCount = (shoe: Shoe): number => shoe.discard.length

export const currentPenetration = (shoe: Shoe): number =>
  1 - shoe.cards.length / shoe.initialCount
