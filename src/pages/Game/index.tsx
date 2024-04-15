import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { useGameState } from '~/hooks/useGameState';
import { Button } from '~/components';
import Logout from '~/assets/icons/logout.svg?react';
import { useLeaveRoom } from '~/hooks/useMutations';
import { Board } from './Board';
import { Status } from './Status';
import { WithdrawModal } from './WithdrawModal';
import { useQuery } from '@tanstack/react-query';
import { QUERY } from '~/lib/queries';
import { GameResultModal } from './GameResultModal';
import { Message } from './Message';

const client = new Client({
  brokerURL: 'ws://localhost:8080/morris-websocket',
  debug: console.log,
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
});

export function GamePage() {
  const { roomId } = useParams();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showGameResultModal, setShowGameResultModal] = useState(false);
  const [connected, setConnected] = useState(client.connected);
  const { data: currentUser } = useQuery(QUERY.CURRENT_USER);
  const { mutate: leaveRoom } = useLeaveRoom();
  const {
    gameState,
    setGameState,
    isPlayerTurn,
    getPlayerStoneColor,
    getEnemyStoneColor,
    getPlayerAddable,
    getEnemyAddable,
    getPlayerTotal,
    getEnemyTotal,
    addStone,
    moveStone,
    removeStone,
    skipRemoving,
    withdraw,
  } = useGameState();

  const onShowWithdrawModal = () => {
    setShowWithdrawModal(true);
  };

  const onLeaveRoom = () => {
    if (roomId) {
      leaveRoom(Number(roomId));
    }
  };

  const onWithdraw = () => {
    if (roomId && currentUser) {
      withdraw(client, Number(roomId), currentUser.userId);
    }
  };

  const onSkipRemoving = () => {
    if (roomId) {
      skipRemoving(client, Number(roomId));
    }
  };

  const handleEvent = useCallback(
    (body: string) => {
      const response = JSON.parse(body);
      console.log(response);
      setGameState(response.data);
      if (response.type === 'GAME_OVER') {
        setShowGameResultModal(true);
      }
    },
    [setGameState]
  );

  // 마운트/언마운트 시 소켓 연결/종료
  useEffect(() => {
    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  // 최초 연결 시 입장 이벤트 전송
  useEffect(() => {
    if (connected && roomId && currentUser) {
      client.publish({
        destination: `/app/joinGame/${roomId}`,
        body: JSON.stringify(currentUser.userId),
      });
    }
  }, [connected, roomId, currentUser]);

  useEffect(() => {
    client.onConnect = () => {
      console.log('소켓에 연결되었습니다.');
      client.subscribe(`/topic/game/${roomId}`, (message) => {
        handleEvent(message.body);
      });

      setConnected(true);
    };
  }, [roomId, handleEvent]);

  if (!gameState) {
    return <div>로딩 중...</div>;
  }

  return (
    <main
      className={`transition-removing flex h-full grow flex-col justify-between overflow-x-hidden transition-colors duration-1000 ${gameState.removing && 'bg-red-200'} p-4 md:gap-4`}
    >
      <WithdrawModal
        visible={showWithdrawModal}
        onWithdraw={onWithdraw}
        onClose={() => setShowWithdrawModal(false)}
      />
      <GameResultModal
        visible={showGameResultModal}
        won={gameState.winner === currentUser?.userId}
        score={30}
        onLeaveRoom={onLeaveRoom}
      />
      <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
        {gameState.status === 'WAITING' ? (
          <div className="flex items-center gap-2">
            <span className="animate-pulse">상대를 기다리는 중...</span>
            <Button
              slim
              text="나가기"
              theme="secondary"
              icon={<Logout />}
              onClick={onLeaveRoom}
            />
          </div>
        ) : (
          <div className="z-20 flex w-full items-center justify-center gap-4 bg-phase text-white md:flex-col md:items-start md:gap-0 md:bg-none md:text-black">
            <h1 className="font-phase text-xl md:text-5xl">
              Phase {gameState.phase}
            </h1>
            <span className="font-semibold">
              돌 {gameState.phase === 1 ? '배치' : '이동'} 단계
            </span>
          </div>
        )}
        <Status
          isTurn={!isPlayerTurn()}
          color={getEnemyStoneColor()}
          addable={getEnemyAddable()}
          total={getEnemyTotal()}
          visible={gameState.status !== 'WAITING'}
        />
      </div>
      {client && (
        <Board
          client={client}
          board={gameState.board}
          selectable={gameState.phase === 2 && isPlayerTurn()}
          playerStoneColor={getPlayerStoneColor()}
          addStone={addStone}
          moveStone={moveStone}
          removeStone={removeStone}
        />
      )}
      <div className="flex w-full flex-col items-center justify-between md:flex-row-reverse md:items-end">
        <Message
          phase={gameState.phase}
          removing={gameState.removing}
          turn={isPlayerTurn()}
          onSkipRemoving={onSkipRemoving}
        />
        <Status
          isCurrentUser
          isTurn={isPlayerTurn()}
          color={getPlayerStoneColor()}
          addable={getPlayerAddable()}
          total={getPlayerTotal()}
          onShowWithdrawModal={onShowWithdrawModal}
        />
      </div>
    </main>
  );
}
