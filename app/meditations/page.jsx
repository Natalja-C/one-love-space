"use client";

import { useEffect, useRef, useState } from "react";
import { categories } from "../data/meditations";
import PracticeModal from "../components/PracticeModal";
import PracticePlayer from "../components/PracticePlayer";

const formatTime = (time) => {
  if (!time || !Number.isFinite(time)) {
    return "0:00";
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};


export default function Meditations() {
  
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
const [sortOrder, setSortOrder] = useState("default");
  const audioRef = useRef(null);
  useEffect(() => {
  if (!isPlayerOpen || !audioRef.current) return;

  audioRef.current.currentTime = 0;
  setCurrentTime(0);
  setIsPlaying(false);
  setDuration(0);
}, [isPlayerOpen]);
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

  return (
    <main className="min-h-screen bg-[#F5F7FC] pb-28 text-[#172B70] page-fade">
      <div className="mx-auto max-w-6xl px-6 py-8">

{/* ЗАГОЛОВОК */}
<div className="mx-auto mb-8 flex w-full max-w-[1000px] items-center justify-between">

  <h1 className="text-3xl font-semibold text-[#172B70]">
    Медитации
  </h1>

</div>
      {/* КАТЕГОРИИ */}
      <div className="space-y-10">

        {categories.map((category) => (

          <section key={category.title}>

            <div className="mx-auto mb-4 flex w-full max-w-[1000px] items-center justify-between">

              <h2 className="text-xl font-semibold text-[#172B70]">
                {category.title}
              </h2>

<button
  onClick={() => {
    setSelectedCategory(category);
    setSortOrder("default");
  }}
  className="text-sm font-medium text-[#6F89B0] transition-colors hover:text-[#172B70]"
>
  Смотреть все →
</button>

            </div>


            {/* КАРТОЧКИ */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-[1000px] lg:grid-cols-4">

              {category.practices.slice(0, 4).map((practice) => (

                <button
  key={practice.title}
  onClick={() => setSelectedPractice(practice)}
  className="flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[#D9E1F0] bg-white p-0 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
>

                  {/* ФОТО */}
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#EEF2FA]">

                    <img
                      src={practice.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />

                  </div>


{/* ИНФОРМАЦИЯ */}
<div className="flex h-40 flex-col px-4 pb-4 pt-3">

  <h3 className="line-clamp-2 text-[15px] font-medium leading-5 text-[#3159A8]">
    {practice.title}
  </h3>

  <p className="mt-1 text-sm text-[#7180A0]">
    {practice.duration}
  </p>

  <p className="mt-2 text-sm leading-5 text-[#7180A0]">
    {practice.shortDescription}
  </p>

</div>
                </button>

              ))}

            </div>

          </section>

        ))}


      </div>
      {selectedCategory && (
  <div
    className="fixed inset-0 z-40 flex items-center justify-center bg-[#172B70]/60 p-6 backdrop-blur-sm"
    onClick={() => setSelectedCategory(null)}
  >
    <div
      className="relative flex h-[85vh] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >

      {/* ЗАГОЛОВОК */}
      <div className="flex items-center justify-between px-7 py-5">

        <h2 className="text-2xl font-semibold text-[#172B70]">
          {selectedCategory.title}
        </h2>

        <button
          onClick={() => setSelectedCategory(null)}
          className="text-sm font-medium text-[#3E63B8] transition-colors hover:text-[#172B70]"
        >
          ← Обратно
        </button>

      </div>


      {/* СОРТИРОВКА */}
      <div className="flex items-center justify-end px-7 pb-4">

        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className="rounded-lg border border-[#D9E1F0] bg-white px-3 py-2 text-sm text-[#596B91] outline-none transition focus:border-[#3E63B8]"
        >
          <option value="default">
            По умолчанию
          </option>

          <option value="asc">
            От коротких к длинным
          </option>

          <option value="desc">
            От длинных к коротким
          </option>
        </select>

      </div>


      {/* СПИСОК ПРАКТИК */}
      <div className="flex-1 overflow-y-auto px-7 pb-7">

        <div className="divide-y divide-[#E9EEF7] border-y border-[#E9EEF7]">

          {[...selectedCategory.practices]
            .sort((a, b) => {

              if (sortOrder === "default") {
                return 0;
              }

              const durationA = parseInt(a.duration, 10);
              const durationB = parseInt(b.duration, 10);

              return sortOrder === "asc"
                ? durationA - durationB
                : durationB - durationA;
            })
            .map((practice) => (

              <button
                key={practice.title}
                onClick={() => {
                  setSelectedPractice(practice);
                  setSelectedCategory(null);
                }}
                className="flex w-full items-center gap-5 py-4 text-left transition-colors hover:bg-[#F7F9FD]"
              >

                {/* МАЛЕНЬКОЕ ФОТО */}
                <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[#EEF2FA]">
                  <img
                    src={practice.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>


                {/* ТЕКСТ */}
                <div className="min-w-0">

                  <h3 className="text-base font-medium text-[#172B70]">
                    {practice.title}
                  </h3>

                  <p className="mt-1 text-sm text-[#7180A0]">
                    {practice.duration}
                  </p>

<p className="mt-2 text-sm leading-5 text-[#7180A0]">
  {practice.shortDescription}
</p>

                </div>

              </button>

            ))}

        </div>

      </div>

    </div>
  </div>
)}


{!isPlayerOpen && (
  <PracticeModal
    practice={selectedPractice}
    onClose={() => setSelectedPractice(null)}
    onListen={() => setIsPlayerOpen(true)}
    isPlayerOpen={isPlayerOpen}
  />
)}

{selectedPractice && isPlayerOpen && (
  <PracticePlayer
    practice={selectedPractice}
    audioRef={audioRef}
    isPlaying={isPlaying}
    setIsPlaying={setIsPlaying}
    currentTime={currentTime}
    setCurrentTime={setCurrentTime}
    duration={duration}
    setDuration={setDuration}
    onClose={() => {
      setIsPlayerOpen(false);
      setSelectedPractice(null);
    }}
    formatTime={formatTime}
  />
)}
  </div>
    </main>
  );
}