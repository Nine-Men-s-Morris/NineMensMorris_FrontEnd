import Add from '~/assets/icons/add.svg?react';
import { clickSound } from '~/lib/sounds';

type CreateRoomButtonProps = {
  onClick: () => void;
};

export function CreateRoomButton({ onClick }: CreateRoomButtonProps) {
  const onClickWithSound = () => {
    onClick?.();
    clickSound.play();
  };

  return (
    <li
      className="flex h-20 w-full cursor-pointer items-center justify-center gap-1 rounded-xl border border-dashed border-gray-500 fill-gray-800 text-gray-800 hover:opacity-75 active:opacity-100"
      onClick={onClickWithSound}
    >
      <Add width={24} height={24} />방 만들기
    </li>
  );
}
