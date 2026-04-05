import { create } from 'zustand'

interface GameState {
  targetWord: string;
  isGameActive: boolean;
  // Actions
  setTargetWord: (word: string) => void;
  startGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  targetWord: '',
  isGameActive: false,

  setTargetWord: (word) => set({ targetWord: word }),
  
  startGame: () => set({ isGameActive: true }),

  resetGame: () => set({ 
    targetWord: '', 
    isGameActive: false 
  }),
}))