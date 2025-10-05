import { describe, expect, it } from 'vitest'

import { createShoe, discardCards, drawCard, reshuffleShoe } from '../src/engine/shoe'

const countRanks = (decks: number) => decks * 52

describe('shoe management', () => {
  it('creates the correct number of cards for the configured decks', () => {
    const shoe = createShoe(2, 0.75)
    expect(shoe.cards.length + shoe.discard.length).toBe(countRanks(2))
    expect(shoe.needsShuffle).toBe(false)
  })

  it('flags when penetration is reached and reshuffles discarded cards', () => {
    const shoe = createShoe(1, 0.5)
    const drawn: typeof shoe.cards = []
    while (shoe.cards.length > shoe.cutIndex) {
      drawn.push(drawCard(shoe))
    }
    expect(shoe.needsShuffle).toBe(true)
    discardCards(shoe, drawn)
    reshuffleShoe(shoe)
    expect(shoe.cards.length).toBe(countRanks(1))
    expect(shoe.discard.length).toBe(0)
    expect(shoe.needsShuffle).toBe(false)
  })
})
