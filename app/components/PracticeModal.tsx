"use client";

type PracticeModalProps = {
  practice: any;
  onClose: () => void;
  onListen: () => void;
  isPlayerOpen: boolean;
};

export default function PracticeModal({
  practice,
  onClose,
  onListen,
  isPlayerOpen,
}: PracticeModalProps) {
  if (!practice || isPlayerOpen) return null;

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6">

  {/* ФОН */}
  <div
  onClick={onClose}
  className="absolute inset-0 bg-[#667CC9]/12 backdrop-blur-[3px]"
  />
  {/* КАРТОЧКА ПРАКТИКИ */}
  <div className="relative z-10 aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

    {/* ФОТО-ФОН */}
    <img
      src={practice.image}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
    />

    {/* КРЕСТИК */}
    <button
      onClick={onClose}
      className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 shadow-sm backdrop-blur-sm transition hover:bg-white"
      aria-label="Закрыть"
    >
      <span className="relative block h-4 w-4">
        <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#172B70]" />
        <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#172B70]" />
      </span>
    </button>

    {/* СОДЕРЖИМОЕ */}
    <div className="absolute inset-x-0 bottom-0 z-10 bg-white/90 px-7 pb-4 pt-3">

      {/* НАЗВАНИЕ */}
      <div>
        <h2 className="text-2xl font-semibold leading-tight text-[#172B70]">
          {practice.title}
        </h2>

        <p className="mt-1 text-sm text-[#7180A0]">
          {practice.duration}
        </p>
      </div>

      {/* ОПИСАНИЕ */}
      <div className="mt-3 h-[96px]">
        <p className="line-clamp-4 text-[15px] leading-6 text-[#596B91]">
          {practice.description}
        </p>
      </div>

      {/* PLAY */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={onListen}
          className="flex items-center gap-2 rounded-lg border border-[#D9E1F0] bg-[#F8FAFD] px-4 py-2 text-sm font-medium text-[#3E63B8] shadow-sm transition hover:border-[#C8D3E8] hover:bg-white hover:text-[#172B70]"
        >
          <span className="block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-[#3E63B8]" />

          <span>
            Слушать
          </span>
        </button>
      </div>

    </div>

  </div>
</div>
  );
}