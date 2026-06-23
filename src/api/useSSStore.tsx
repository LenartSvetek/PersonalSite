import { create } from 'zustand'

export interface ICellState {
    cells?: ICellState[];
    winner: 'X' | 'O' | '';
}

type TPlayReturnState = 'set' | 'noset' | 'won';

interface SuperSodokuState {
    depth: number;
    isGameActive: boolean;

    gameBoard: ICellState;
    playerTurn: 'X' | 'O';

    // Actions
    setDepth: (depth: number) => void;
    startGame: () => void;
    resetGame: () => void;
    play: (cell: number[]) => TPlayReturnState;
    getCell: (cell: number[]) => ICellState;
}

const CreateCell = (depth: number): ICellState => {
    if (depth == 1) {
        return {
            cells: Array.from({ length: 9 }, () => { return { winner: '' } }),
            winner: ''
        }
    }
    else {
        return {
            cells: Array.from({ length: 9 }, () => CreateCell(depth - 1)),
            winner: ''
        }
    }
}

const SetCell = (board: ICellState, cell : number[], state : 'X' | 'O') : { board: ICellState, result: 'set' | 'noset' | 'won' } => {
    const index = cell.pop();

    console.log(index, board.cells, cell);
    if(index == undefined || !board.cells) return { board: {winner: 'X' }, result: 'noset' };

    if(cell.length == 0) {
        let result : 'set' | 'noset' | 'won' = 'noset';
        if(board.cells[index].winner == ''){
            const newCells = [...board.cells]; // Shallow copy the array
            newCells[index] = { ...newCells[index], winner: state }; // Shallow copy the target cell
            
            const newBoard = { ...board, cells: newCells };
            let cellWin = CheckWinCondition(newBoard, index);
            
            if(cellWin) newBoard.winner = state;
            result = cellWin && 'won' || 'set';

            console.log(result);
            
            return { board: newBoard, result: result };
        }

        console.log(board, result);

        return { board, result: result }
    }
    else {
        // @ts-ignore
        const {board : newBoard, result} = SetCell(board.cells[index], cell, state);

        console.log("new board: ", newBoard);
        board.cells[index] = newBoard;

        if(result == 'won') {
            let res = CheckWinCondition(board, index);
            if(res) {
                board.winner = state;
            }
        }

        return { board, result };
    }
}

const CheckWinCondition = (board: ICellState, cell : number) : boolean => {
    const cells = board.cells?.map((cell) => cell.winner);
    console.log(cells);
    if(!cells) return false;

    console.log('checking vertical');
    let startY = cell - Math.floor(cell / 3) * 3;
    let startState = cells[startY];

    if(startState != '')
    for(startY += 3; startY < 9 && cells[startY] == startState; startY += 3);
    if(startY > 9) return true;
    
    console.log('checking horizontal');
    let startX = cell - cell % 3;
    let winCon = startX + 3;
    startState = cells[startX];

    if(startState != '')
    for(startX += 1; startX < winCon && cells[startX] == startState; startX += 1);
    if(startX >= winCon) return true;

    if([1, 3, 5, 7].includes(cell)) return false;

    console.log('checking diagonal 1');
    startX = 0;
    startY = 0;
    startState = cells[startY * 3 + startX];

    if(startState != '')
    for(startX++, startY++; startX < 4 && cells[startY * 3 + startX] == startState; startX++, startY++);
    if(startX > 3) return true;

    console.log('checking diagonal 2');
    startX = 2;
    startY = 0;
    startState = cells[startY * 3 + startX];

    if(startState != '')
    for(startX--, startY++; startY < 4 && cells[startY * 3 + startX] == startState; startX--, startY++) console.log(cells[startY * 3 + startX], startState);
    if(startX < 0) return true;
    console.log("checked all");

    return false;
}


const GetCell = (board: ICellState, cell : number[]) : ICellState => {
    let index = cell.pop();
    if(index == undefined || !board.cells) return board;
    if(cell.length == 0) return board.cells[index];
    // @ts-ignore
    return GetCell(board.cells[index], cell);
}

export const useSSStore = create<SuperSodokuState>((set, get) => ({
    depth: 1,
    isGameActive: false,
    gameBoard: { winner: '' },

    playerTurn: 'O',
    setDepth: (depth: number) => set({ depth: depth }),

    startGame: () => {
        let currentDepth = get().depth;
        currentDepth = isNaN(currentDepth) && 1 || currentDepth;
        set({
            gameBoard: CreateCell(currentDepth),
            playerTurn: 'O'
        })
    },

    resetGame: () => set({
        depth: 1,
        isGameActive: false,
        gameBoard: { winner: '' },
        playerTurn: 'O'
    }),
    
    play: (cell: number[]) => {
        const cellRev = [...cell].reverse();

        const { gameBoard, playerTurn } = get();

        const { board, result } = SetCell(gameBoard, cellRev, playerTurn);

        console.log(board);

        set({
            gameBoard: board,
            playerTurn: result == 'noset' && playerTurn || playerTurn == 'O' && 'X' || 'O'
        })

        return result;
    },

    getCell: (cell : number[]) : ICellState => {
        const { gameBoard } = get();

        return GetCell(gameBoard, [...cell].reverse());
    }
}))