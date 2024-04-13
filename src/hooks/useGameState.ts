import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { QUERY } from '~/lib/queries';
import { Client } from '@stomp/stompjs';
import { GameState } from '~/lib/types';
import { TRIPLE } from '~/lib/constants';

const initialGameState: GameState = {
  roomId: -1,
  board: [...Array(24)].map(() => 'EMPTY'),
  playerOneId: -1,
  playerTwoId: -1,
  currentTurn: null,
  addable: [9, 9],
  total: [9, 9],
  status: 'WAITING',
  phase: 1,
  winner: null,
  loser: null,
};

export function useGameState() {
  const [gameState, setGameState] = useState(initialGameState);
  const [removingTurn, setRemovingTurn] = useState(false);
  const { data: currentUser } = useQuery(QUERY.CURRENT_USER);
  console.log(gameState);

  const updateGameState = (newState: GameState) => {
    setGameState(newState);
  };

  const isPlayerTurn = () => {
    return gameState.currentTurn === currentUser?.userId;
  };

  const isPlayerHost = () => {
    return gameState.playerOneId === currentUser?.userId;
  };

  const getPlayerStoneColor = () => {
    return isPlayerHost() ? 'BLACK' : 'WHITE';
  };

  const getEnemyStoneColor = () => {
    return isPlayerHost() ? 'WHITE' : 'BLACK';
  };

  const getCurrentPhase = () => {
    return gameState.phase;
  };

  const countPlayerAddableStone = () => {
    return gameState.addable[isPlayerHost() ? 0 : 1];
  };

  const countEnemyAddableStone = () => {
    return gameState.addable[isPlayerHost() ? 1 : 0];
  };

  const countPlayerTotalStone = () => {
    return gameState.total[isPlayerHost() ? 0 : 1];
  };

  const countEnemyTotalStone = () => {
    return gameState.total[isPlayerHost() ? 1 : 0];
  };

  const isEmptyPoint = (index: number) => {
    return gameState.board[index] === 'EMPTY';
  };

  const isPlayerPoint = (index: number) => {
    return gameState.board[index] === getPlayerStoneColor();
  };

  const isEnemyPoint = (index: number) => {
    return (
      gameState.board[index] !== 'EMPTY' &&
      gameState.board[index] !== getPlayerStoneColor()
    );
  };

  // 새로 두려는 돌이 3연속 배열을 만드는가?
  const isMakingTriple = (index: number) => {
    for (const positions of TRIPLE) {
      const current = positions.indexOf(index);
      if (current === -1) continue;

      const restStones = [
        ...positions.slice(0, current),
        ...positions.slice(current + 1),
      ];
      if (isPlayerPoint(restStones[0]) && isPlayerPoint(restStones[1])) {
        return true;
      }
    }

    return false;
  };

  const addStone = (client: Client, index: number) => {
    if (
      getCurrentPhase() === 1 &&
      isPlayerTurn() &&
      isEmptyPoint(index) &&
      countPlayerAddableStone() > 0
    ) {
      client.publish({
        destination: `/app/game/placeStone`,
        body: JSON.stringify({
          gameId: gameState.roomId,
          initialPosition: index,
          finalPosition: 99,
        }),
      });

      if (isMakingTriple(index)) {
        setRemovingTurn(true);
      }
    }
  };

  const moveStone = (client: Client, from: number, to: number) => {
    if (
      getCurrentPhase() === 2 &&
      isPlayerTurn() &&
      isPlayerPoint(from) &&
      isEmptyPoint(to)
    ) {
      client.publish({
        destination: `/app/game/placeStone`,
        body: JSON.stringify({
          gameId: gameState.roomId,
          initialPosition: from,
          finalPosition: to,
        }),
      });
    }
  };

  const removeStone = (client: Client, index: number) => {
    if (removingTurn && isPlayerTurn() && isEnemyPoint(index)) {
      client.publish({
        destination: `/app/game/removeOpponentStone`,
        body: JSON.stringify({
          gameId: gameState.roomId,
          removePosition: index,
        }),
      });
      setRemovingTurn(false);
    }
  };

  return {
    gameState,
    removingTurn,
    updateGameState,
    isPlayerTurn,
    getPlayerStoneColor,
    getEnemyStoneColor,
    countPlayerAddableStone,
    countEnemyAddableStone,
    countPlayerTotalStone,
    countEnemyTotalStone,
    addStone,
    moveStone,
    removeStone,
  };
}
