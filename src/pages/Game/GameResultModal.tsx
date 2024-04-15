import { Button, Modal } from '~/components';

type GameResultModalProps = {
  visible: boolean;
  won: boolean;
  score: number;
  onLeaveRoom: () => void;
};

export function GameResultModal({
  visible,
  won,
  score,
  onLeaveRoom,
}: GameResultModalProps) {
  return (
    <Modal visible={visible}>
      <>
        <div className="text-2xl font-semibold">
          {won ? '승리했습니다!' : '패배했습니다...'}
        </div>
        <div>
          점수 {score > 0 ? '+' : '-'}
          {score}
        </div>
        <div className="flex w-full gap-4">
          <Button fullWidth text="확인" onClick={onLeaveRoom} />
        </div>
      </>
    </Modal>
  );
}
