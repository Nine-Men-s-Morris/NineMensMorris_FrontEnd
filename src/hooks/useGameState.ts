import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { QUERY } from '~/lib/queries';
import { Client } from '@stomp/stompjs';
import { GameState } from '~/lib/types';
import { NEIGHBOR, TRIPLE } from '~/lib/constants';

const initialGameState: GameState = {
  roomId: -1,
  board: [...Array(24)].map(() => 'EMPTY'),
  hostId: -1,
  guestId: -1,
  currentTurn: null,
  hostAddable: 9,
  guestAddable: 9,
  hostTotal: 9,
  guestTotal: 9,
  status: 'WAITING',
  phase: 1,
  isRemoving: false,
  winner: null,
  loser: null,
};

export function useGameState(roomId: number) {
  const [gameState, setGameState] = useState<GameState>({
    ...initialGameState,
    roomId,
  });
  const { data: currentUser } = useQuery(QUERY.CURRENT_USER);

  const updateGameState = (state: GameState) => setGameState(state);

  const isPlayerTurn = () => {
    return gameState.currentTurn === currentUser?.userId;
  };

  const isPlayerHost = () => {
    return gameState.hostId === currentUser?.userId;
  };

  const getOppositeTurnPlayer = () => {
    return gameState.currentTurn === gameState.hostId
      ? gameState.guestId
      : gameState.hostId;
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
      if (restStones.every(isPlayerPoint)) {
        return true;
      }
    }

    return false;
  };

  // 제거하려는 돌이 이미 3연속 배열을 이루고 있는가?
  const isAlreadyTriple = (index: number) => {
    for (const positions of TRIPLE) {
      if (positions.indexOf(index) === -1) continue;

      if (
        positions.every(
          (position) => gameState.board[position] === getEnemyStoneColor()
        )
      ) {
        // TODO: 제거 불가능함을 알려주기
        return true;
      }
    }

    return false;
  };

  const isExistRemovable = () => {
    const isAllTriple = gameState.board
      .map((stone, index) => (stone === getEnemyStoneColor() ? index : -1))
      .filter((stone) => stone !== -1)
      .every((stone) => isAlreadyTriple(stone));
    console.log('모두 다 트리플이야');
    return !isAllTriple;
  };

  const isAdjacent = (from: number, to: number) => {
    return NEIGHBOR[from].includes(to);
  };

  // 플레이어를 추가하고 서로 다른 2명이 모였는지 확인
  const addPlayerAndReady = (userId: number) => {
    if (
      userId === -1 ||
      !currentUser?.userId ||
      currentUser.userId === userId
    ) {
      return null;
    }

    const newState: GameState = {
      ...gameState,
      hostId: currentUser.userId,
      guestId: userId,
      currentTurn: currentUser.userId,
      status: 'PLAYING',
    };

    setGameState(newState);

    return newState;
  };

  const addStone = (client: Client, index: number) => {
    if (
      getCurrentPhase() === 1 &&
      isPlayerTurn() &&
      !gameState.isRemoving &&
      isEmptyPoint(index) &&
      (isPlayerHost() ? gameState.hostAddable : gameState.guestAddable) > 0
    ) {
      const newBoard = [...gameState.board];
      newBoard[index] = getPlayerStoneColor();
      const isRemovable = isMakingTriple(index) && isExistRemovable();
      const newState = {
        ...gameState,
        board: newBoard,
        currentTurn: isRemovable
          ? gameState.currentTurn
          : getOppositeTurnPlayer(),
        isRemoving: isRemovable,
        hostAddable: gameState.hostAddable - (isPlayerHost() ? 1 : 0),
        guestAddable: gameState.guestAddable - (!isPlayerHost() ? 1 : 0),
      };

      client.publish({
        destination: `/topic/game/${roomId}`,
        body: JSON.stringify({ type: 'SYNC_STATE', state: newState }),
      });
      client.publish({
        destination: `/app/game/placeStone`,
        body: JSON.stringify({
          gameId: gameState.roomId,
          initialPosition: index,
          finalPosition: 99,
        }),
      });
    }
  };

  const moveStone = (client: Client, from: number, to: number) => {
    if (
      getCurrentPhase() === 2 &&
      isPlayerTurn() &&
      isPlayerPoint(from) &&
      isEmptyPoint(to) &&
      isAdjacent(from, to)
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
    if (
      gameState.isRemoving &&
      isPlayerTurn() &&
      isEnemyPoint(index) &&
      !isAlreadyTriple(index)
    ) {
      const newBoard = [...gameState.board];
      newBoard[index] = 'EMPTY';
      const newState = {
        ...gameState,
        board: newBoard,
        currentTurn: getOppositeTurnPlayer(),
        isRemoving: false,
        hostTotal: gameState.hostTotal - (!isPlayerHost() ? 1 : 0),
        guestTotal: gameState.guestTotal - (isPlayerHost() ? 1 : 0),
      };

      client.publish({
        destination: `/topic/game/${roomId}`,
        body: JSON.stringify({ type: 'SYNC_STATE', state: newState }),
      });
      client.publish({
        destination: `/app/game/removeOpponentStone`,
        body: JSON.stringify({
          gameId: gameState.roomId,
          removePosition: index,
        }),
      });
    }
  };

  return {
    gameState,
    updateGameState,
    addPlayerAndReady,
    isPlayerHost,
    isPlayerTurn,
    getPlayerStoneColor,
    getEnemyStoneColor,
    addStone,
    moveStone,
    removeStone,
  };
}
