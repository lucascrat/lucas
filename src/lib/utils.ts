import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a random bingo card (5x5 with center free space)
export function generateBingoCard(): number[][] {
  const card: number[][] = []
  
  // B column: 1-15, I column: 16-30, N column: 31-45, G column: 46-60, O column: 61-75
  const ranges = [
    [1, 15],   // B
    [16, 30],  // I
    [31, 45],  // N
    [46, 60],  // G
    [61, 75]   // O
  ]
  
  for (let col = 0; col < 5; col++) {
    const column: number[] = []
    const [min, max] = ranges[col]
    const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i)
    
    // Shuffle and pick 5 numbers
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }
    
    for (let row = 0; row < 5; row++) {
      column.push(numbers[row])
    }
    
    card.push(column)
  }
  
  // Transpose to get row-major order
  const transposed: number[][] = []
  for (let row = 0; row < 5; row++) {
    const rowData: number[] = []
    for (let col = 0; col < 5; col++) {
      rowData.push(card[col][row])
    }
    transposed.push(rowData)
  }
  
  // Set center as free space (0)
  transposed[2][2] = 0
  
  return transposed
}

// Check if a bingo card has a winning pattern
export function checkBingo(card: number[][], markedNumbers: number[]): {
  hasLine: boolean
  hasColumn: boolean
  hasFullCard: boolean
} {
  const marked = new Set(markedNumbers)
  marked.add(0) // Center is always marked
  
  let hasLine = false
  let hasColumn = false
  
  // Check rows
  for (let row = 0; row < 5; row++) {
    if (card[row].every(num => marked.has(num))) {
      hasLine = true
      break
    }
  }
  
  // Check columns
  for (let col = 0; col < 5; col++) {
    if (card.every(row => marked.has(row[col]))) {
      hasColumn = true
      break
    }
  }
  
  // Check full card
  const hasFullCard = card.every(row => row.every(num => marked.has(num)))
  
  return { hasLine, hasColumn, hasFullCard }
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Format date
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}