import {
  Board,
  Cell,
  PlayerColor,
  QuadrantIndex,
  RotationDirection,
} from './types';

export function createBoard(): Board {
  return Array.from({ length: 6 }, () => Array(6).fill(null) as Cell[]);
}

// Returns the top-left [row, col] offset for each quadrant
// 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
function getQuadrantOffset(quadrant: QuadrantIndex): [number, number] {
  const offsets: Record<QuadrantIndex, [number, number]> = {
    0: [0, 0],
    1: [0, 3],
    2: [3, 0],
    3: [3, 3],
  };
  return offsets[quadrant];
}

export function rotateQuadrant(
  board: Board,
  quadrant: QuadrantIndex,
  direction: RotationDirection
): Board {
  // Deep-clone the board
  const newBoard: Board = board.map((row) => [...row]);
  const [rowOffset, colOffset] = getQuadrantOffset(quadrant);

  // Extract 3x3 subgrid
  const sub: Cell[][] = [];
  for (let r = 0; r < 3; r++) {
    sub.push([
      newBoard[rowOffset + r][colOffset + 0],
      newBoard[rowOffset + r][colOffset + 1],
      newBoard[rowOffset + r][colOffset + 2],
    ]);
  }

  // Rotate: CW = transpose then reverse each row
  //         CCW = reverse each row then transpose
  let rotated: Cell[][];
  if (direction === 'cw') {
    rotated = [
      [sub[2][0], sub[1][0], sub[0][0]],
      [sub[2][1], sub[1][1], sub[0][1]],
      [sub[2][2], sub[1][2], sub[0][2]],
    ];
  } else {
    rotated = [
      [sub[0][2], sub[1][2], sub[2][2]],
      [sub[0][1], sub[1][1], sub[2][1]],
      [sub[0][0], sub[1][0], sub[2][0]],
    ];
  }

  // Write rotated values back
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      newBoard[rowOffset + r][colOffset + c] = rotated[r][c];
    }
  }

  return newBoard;
}

export function placeStone(
  board: Board,
  row: number,
  col: number,
  color: PlayerColor
): Board | null {
  if (row < 0 || row > 5 || col < 0 || col > 5) return null;
  if (board[row][col] !== null) return null;

  const newBoard: Board = board.map((r) => [...r]);
  newBoard[row][col] = color;
  return newBoard;
}

interface WinResult {
  winner: PlayerColor | 'draw' | null;
}

export function checkWin(board: Board): WinResult {
  const whiteWins = hasWinner(board, 'white');
  const blackWins = hasWinner(board, 'black');

  if (whiteWins && blackWins) return { winner: 'draw' };
  if (whiteWins) return { winner: 'white' };
  if (blackWins) return { winner: 'black' };
  return { winner: null };
}

function hasWinner(board: Board, color: PlayerColor): boolean {
  const size = 6;
  const WIN = 5;

  // Check rows
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) {
      count = board[r][c] === color ? count + 1 : 0;
      if (count >= WIN) return true;
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) {
      count = board[r][c] === color ? count + 1 : 0;
      if (count >= WIN) return true;
    }
  }

  // Check diagonals (top-left to bottom-right)
  for (let r = 0; r <= size - WIN; r++) {
    for (let c = 0; c <= size - WIN; c++) {
      let count = 0;
      for (let i = 0; i < WIN; i++) {
        if (board[r + i][c + i] === color) count++;
      }
      if (count === WIN) return true;
    }
  }

  // Check diagonals (top-right to bottom-left)
  for (let r = 0; r <= size - WIN; r++) {
    for (let c = WIN - 1; c < size; c++) {
      let count = 0;
      for (let i = 0; i < WIN; i++) {
        if (board[r + i][c - i] === color) count++;
      }
      if (count === WIN) return true;
    }
  }

  return false;
}

export function isBoardFull(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell !== null));
}
