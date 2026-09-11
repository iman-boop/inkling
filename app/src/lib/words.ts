const WORDS = [
  'No',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
]

/** Small counts read as words in copy — "Eleven letters", not "11 letters". */
export const spell = (n: number) => WORDS[n] ?? String(n)

export const lower = (word: string) => word.charAt(0).toLowerCase() + word.slice(1)
