"use client";

import { useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type PracticePlayerProps = {
  practice: any;
  audioRef: any;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  currentTime: number;
  setCurrentTime: (value: number) => void;
  duration: number;
  setDuration: (value: number) => void;
  onClose: () => void;
  formatTime: (time: number) => string;
};

function ReactionIcon({
  type,
}: {
  type: "lighter" | "same" | "harder" | "unclear";
}) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="#F5D86E"
        stroke="#D6B84F"
        strokeWidth="1"
      />

      <circle cx="9" cy="10" r="1" fill="#596B91" />
      <circle cx="15" cy="10" r="1" fill="#596B91" />

      {type === "lighter" && (
        <path
          d="M8.5 14C9.5 15.5 11 16.2 12 16.2C13.2 16.2 14.6 15.5 15.5 14"
          stroke="#596B91"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      )}

      {type === "same" && (
        <path
          d="M9 15H15"
          stroke="#596B91"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      )}

      {type === "harder" && (
        <path
          d="M8.5 16C9.5 14.6 10.8 14 12 14C13.2 14 14.5 14.6 15.5 16"
          stroke="#596B91"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      )}

      {type === "unclear" && (
        <>
          <path
            d="M10.2 9.2C10.5 8.2 11.3 7.7 12.3 7.7C13.6 7.7 14.5 8.5 14.5 9.6C14.5 10.5 14 11 13.1 11.6C12.3 12.1 12 12.6 12 13.3"
            stroke="#596B91"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16" r="0.8" fill="#596B91" />
        </>
      )}
    </svg>
  );
}

export default function PracticePlayer({
  practice,
  audioRef,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  onClose,
  formatTime,
}: PracticePlayerProps) {
  if (!practice) return null;

const [isFinishConfirmOpen, setIsFinishConfirmOpen] =
  useState(false);

const [isPostReflectionOpen, setIsPostReflectionOpen] =
  useState(false);

const [postReflectionText, setPostReflectionText] =
  useState("");

const [stateChange, setStateChange] =
  useState("");

const [savedMessage, setSavedMessage] =
  useState("");

const listenedSecondsRef = useRef(0);
const playStartedAtRef = useRef<number | null>(null);

const finishListeningSegment = () => {
  if (playStartedAtRef.current === null) {
    return;
  }

  listenedSecondsRef.current +=
    (Date.now() - playStartedAtRef.current) / 1000;

  playStartedAtRef.current = null;
};

const getListenedSeconds = () => {
  let total = listenedSecondsRef.current;

  if (playStartedAtRef.current !== null) {
    total +=
      (Date.now() - playStartedAtRef.current) / 1000;
  }

  return Math.round(total);
};

const savePracticeToMyFullness = async ({
  reflectionText = "",
  change = "",
}: {
  reflectionText?: string;
  change?: string;
}) => {
  const listenedSeconds = getListenedSeconds();

  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "Не удалось определить пользователя:",
      userError
    );

    return;
  }

  const { error } = await supabase
    .from("practice_history")
    .insert({
      user_id: user.id,
      practice_id: practice.id,
      title: practice.title,
      image: practice.image,
      planned_duration: practice.duration,
      listened_seconds: listenedSeconds,
      completed_at: new Date().toISOString(),
      state_change: change,
      reflection: reflectionText.trim(),
      diary_entry_id: practice.diaryEntryId ?? null,
      before_tags: practice.beforeTags ?? [],
    });

  if (error) {
    console.error(
      "Не удалось сохранить практику в My Fullness:",
      error
    );

    return;
  }
};


const closePracticeCompletely = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  setIsPlaying(false);
  setCurrentTime(0);
  setDuration(0);

  listenedSecondsRef.current = 0;
  playStartedAtRef.current = null;

  onClose();
};

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6">

    {/* ФОН */}
    <div
  className="absolute inset-0 bg-[#667CC9]/18 backdrop-blur-[5px]"
    />

{isFinishConfirmOpen && (
  <div className="absolute inset-0 z-40 flex items-center justify-center px-4">

    <div className="w-full max-w-[340px] rounded-2xl border border-[#E0E2F0] bg-white px-6 py-6 text-center shadow-[0_18px_50px_rgba(54,63,110,0.18)]">

      <p className="text-lg font-medium text-[#172B70]">
        Завершить практику?
      </p>

      <div className="mt-5 flex justify-center gap-3">

        <button
          type="button"
          onClick={() => {
            setIsFinishConfirmOpen(false);

            if (audioRef.current) {
              audioRef.current.play();
            }
          }}
          className="rounded-xl border border-[#D9E1F0] px-5 py-2.5 text-sm font-medium text-[#596B91] transition hover:bg-[#F5F7FC]"
        >
          Продолжить
        </button>

        <button
          type="button"
          onClick={() => {
            setIsFinishConfirmOpen(false);

            if (getListenedSeconds() >= 60) {
              setIsPostReflectionOpen(true);
            } else {
              closePracticeCompletely();
            }
          }}
          className="rounded-xl bg-[#667CC9] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#596FB5]"
        >
          Завершить
        </button>

      </div>

    </div>

  </div>
)}

{isPostReflectionOpen && (
  <div className="absolute inset-0 z-50 flex items-center justify-center px-4">

    <div className="recommendation-result-modal w-full max-w-[540px] rounded-[24px] border border-[#E0E2F0] bg-white px-7 py-7 shadow-[0_20px_60px_rgba(54,63,110,0.18)]">

      <h2 className="text-xl font-medium text-[#667CC9]">
        Как Вы сейчас?
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#7580A5]">
        Попробуйте остановиться ненадолго, чтобы заметить, что происходит
        с Вами после практики. Здесь можно оставить мысли и ощущения
        — или просто выбрать реакцию, которая лучше всего отражает
        Ваше состояние.
      </p>


      <textarea
        value={postReflectionText}
        onChange={(event) =>
          setPostReflectionText(event.target.value)
        }
        placeholder="Если хочется, оставьте несколько слов..."
        className="mt-5 min-h-[90px] w-full resize-none rounded-2xl border border-[#E1E4F0] bg-[#FBFCFE] p-4 text-sm leading-6 text-[#566587] outline-none placeholder:text-[#9BA3BA] focus:border-[#AAB6D7]"
      />


      <p className="mt-5 text-sm font-medium text-[#596B91]">
        Как изменилось Ваше состояние?
      </p>


      <div className="mt-3 grid gap-2 sm:grid-cols-2">

        {[
          {
          id: "lighter",
          label: "Стало легче",
        },
        {
          id: "same",
          label: "Почти не изменилось",
        },
        {
          id: "harder",
          label: "Стало сложнее",
        },
        {
          id: "unclear",
          label: "Не могу определить",
        },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() =>
              setStateChange(option.id)
            }
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              stateChange === option.id
                ? "border-[#AAB6D7] bg-[#EEF1FA] text-[#526083]"
                : "border-[#E2E5EF] bg-white text-[#6875A8] hover:bg-[#F8F9FC]"
            }`}
          >
            <div className="flex items-center gap-2">
            <ReactionIcon
              type={option.id as "lighter" | "same" | "harder" | "unclear"}
            />

            <span>{option.label}</span>
          </div>
          </button>
        ))}

      </div>


      <div className="mt-6 flex items-center justify-between gap-3">

        <button
          type="button"
          onClick={() => {
            savePracticeToMyFullness({});

            setSavedMessage(
              "Время, проведённое в этой практике, сохранено в My Fullness."
            );
          }}
          className="text-sm text-[#8A94B1] transition hover:text-[#667CC9]"
        >
          Ой, всё!
        </button>


        <button
          type="button"
          onClick={() => {
            savePracticeToMyFullness({
              reflectionText: postReflectionText,
              change: stateChange,
            });

            setSavedMessage(
              "Ваша рефлексия сохранена в My Fullness."
            );
          }}
          disabled={
            postReflectionText.trim() === "" &&
            stateChange === ""
          }
          className="rounded-xl bg-[#667CC9] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#596FB5] disabled:cursor-default disabled:opacity-40"
        >
          Сохранить
        </button>

      </div>

    </div>

  </div>
)}

{savedMessage && (
  <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#667CC9]/8 px-4 backdrop-blur-[2px]">

    <div className="w-full max-w-[380px] rounded-2xl border border-[#E0E2F0] bg-white px-7 py-6 text-center shadow-[0_18px_50px_rgba(54,63,110,0.18)]">

      <p className="text-sm leading-6 text-[#6875A8]">
        {savedMessage}
      </p>

      <button
        type="button"
        onClick={() => {
          setSavedMessage("");
          closePracticeCompletely();
        }}
        className="mt-5 rounded-lg bg-[#667CC9] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#596FB5]"
      >
        Ок
      </button>

    </div>

  </div>
)}

    {/* ПЛЕЕР */}
    <div className="relative z-10 aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl">

      {/* ФОТО-ФОН */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={practice.image}
          alt=""
          className="h-full w-full object-cover blur-[1px]"
        />
      </div>

      {/* КРЕСТИК */}
      <button
        onClick={() => {
        if (audioRef.current) {
          audioRef.current.pause();
        }

        finishListeningSegment();
        setIsPlaying(false);
        setIsFinishConfirmOpen(true);
        }}

        className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 shadow-sm backdrop-blur-sm transition hover:bg-white"
        aria-label="Закрыть"
      >
        <span className="relative block h-4 w-4">
          <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#172B70]" />
          <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#172B70]" />
        </span>
      </button>

      {/* СОДЕРЖИМОЕ */}
      <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/60 px-7 pb-3 pt-3 shadow-lg backdrop-blur-sm">

        {/* НАЗВАНИЕ */}
        <div>
          <h2 className="text-2xl font-semibold leading-tight text-[#172B70]">
            {practice.title}
          </h2>

          <p className="mt-2 text-sm text-[#7180A0]">
            {practice.duration}
          </p>
        </div>
                {/* AUDIO */}
        <audio
          ref={audioRef}
          src="/audio/Aerials.mp3"
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration);
          }}
          onTimeUpdate={(event) => {
            setCurrentTime(event.currentTarget.currentTime);
          }}
          onPlay={() => {
          setIsPlaying(true);

          if (playStartedAtRef.current === null) {
            playStartedAtRef.current = Date.now();
          }
        }}
          onPause={() => {
          setIsPlaying(false);
          finishListeningSegment();
        }}
          onEnded={() => {
          finishListeningSegment();

          setIsPlaying(false);

          if (getListenedSeconds() >= 60) {
            setIsPostReflectionOpen(true);
          } else {
            onClose();
          }
        }}
        />

        {/* УПРАВЛЕНИЕ */}
        <div className="mt-7">

          {/* PLAY / ПЕРЕМОТКА */}
          <div className="flex items-center justify-center gap-10">

            {/* -15 */}
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.max(
                    0,
                    audioRef.current.currentTime - 15
                  );
                }
              }}
              className="text-sm text-[#3E63B8]/70 transition-all duration-200 hover:scale-105 hover:text-[#3E63B8]"
              aria-label="Назад на 15 секунд"
            >
              <span className="relative flex h-6 w-8 items-center justify-center">
                <svg
                  className="absolute inset-0"
                  width="30"
                  height="17"
                  viewBox="0 0 36 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M33 12C31 6 25 3 18 3C11 3 5 6 3 12"
                    stroke="#3E63B8"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 12L3.5 7M3 12L7 10"
                    stroke="#3E63B8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="relative z-10 mt-1 text-[11px] text-[#3E63B8]">
                  15
                </span>
              </span>
            </button>

            {/* PLAY / PAUSE */}
            <button
              onClick={() => {
                if (!audioRef.current) return;

                if (audioRef.current.paused) {
                  audioRef.current.play();
                } else {
                  audioRef.current.pause();
                }
              }}
              className="text-3xl font-light text-[#172B70]/70 transition-all duration-200 hover:scale-105 hover:text-[#172B70]"
              aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
            >
              {isPlaying ? (
                <svg
                  width="20"
                  height="22"
                  viewBox="0 0 18 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    x1="5"
                    y1="3"
                    x2="5"
                    y2="17"
                    stroke="#172B70"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="13"
                    y1="3"
                    x2="13"
                    y2="17"
                    stroke="#172B70"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <span className="block h-0 w-0 border-y-[10px] border-l-[15px] border-y-transparent border-l-[#172B70] drop-shadow-sm" />
              )}
            </button>

            {/* +15 */}
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.min(
                    audioRef.current.duration || 0,
                    audioRef.current.currentTime + 15
                  );
                }
              }}
              className="text-sm text-[#3E63B8]/70 transition-all duration-200 hover:scale-105 hover:text-[#3E63B8]"
              aria-label="Вперёд на 15 секунд"
            >
              <span className="relative flex h-6 w-8 items-center justify-center">
                <svg
                  className="absolute inset-0"
                  width="30"
                  height="17"
                  viewBox="0 0 36 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 12C5 6 11 3 18 3C25 3 31 6 33 12"
                    stroke="#3E63B8"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                  <path
                    d="M33 12L32.5 7M33 12L29 10"
                    stroke="#3E63B8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="relative z-10 mt-1 text-[11px] text-[#3E63B8]">
                  15
                </span>
              </span>
            </button>

          </div>

          {/* ПРОГРЕСС */}
          <div className="mt-6">

            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={(event) => {
                const newTime = Number(event.target.value);

                if (audioRef.current) {
                  audioRef.current.currentTime = newTime;
                }

                setCurrentTime(newTime);
              }}
              className="meditation-range h-1 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background: `linear-gradient(
                  to right,
                  #3E63B8 0%,
                  #3E63B8 ${duration ? (currentTime / duration) * 100 : 0}%,
                  #D9E1F0 ${duration ? (currentTime / duration) * 100 : 0}%,
                  #D9E1F0 100%
                )`,
              }}
              aria-label="Позиция воспроизведения"
            />

            {/* ВРЕМЯ */}
            <div className="mt-2 flex justify-between text-xs text-[#F4F6FC]">
              <span>
                {formatTime(currentTime)}
              </span>

              <span>
                {formatTime(duration)}
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
);
}