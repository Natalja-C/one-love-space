"use client";

import { useRef, useState } from "react";
import { categories } from "../data/meditations";
import { tags } from "../data/tags";
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

export default function Search() {
const [filtersOpen, setFiltersOpen] = useState(false);
const [selectedPractice, setSelectedPractice] = useState(null);
const [isPlayerOpen, setIsPlayerOpen] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [selectedCategories, setSelectedCategories] = useState([]);
const [selectedDurations, setSelectedDurations] = useState([]);

const [allCategoriesSelected, setAllCategoriesSelected] = useState(false);
const [allDurationsSelected, setAllDurationsSelected] = useState(false);

const [appliedCategories, setAppliedCategories] = useState([]);
const [appliedDurations, setAppliedDurations] = useState([]);

const [appliedAllCategories, setAppliedAllCategories] = useState(false);
const [appliedAllDurations, setAppliedAllDurations] = useState(false);
const [hasAppliedFilters, setHasAppliedFilters] = useState(false);

const [searchQuery, setSearchQuery] = useState("");
const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
const [hasSearch, setHasSearch] = useState(false);
const hasActiveFilters =
  appliedAllCategories ||
  appliedAllDurations ||
  appliedCategories.length > 0 ||
  appliedDurations.length > 0;

const audioRef = useRef(null);

const toggleCategory = (category) => {
  setAllCategoriesSelected(false);

  setSelectedCategories((current) =>
    current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]
  );
};
const toggleDuration = (duration) => {
  setAllDurationsSelected(false);

  setSelectedDurations((current) =>
    current.includes(duration)
      ? current.filter((item) => item !== duration)
      : [...current, duration]
  );
};
const clearCategories = () => {
  setSelectedCategories([]);
  setAllCategoriesSelected((current) => !current);
};

const clearDurations = () => {
  setSelectedDurations([]);
  setAllDurationsSelected((current) => !current);
};
const resetFilters = () => {
  setSelectedCategories([]);
  setSelectedDurations([]);
  setAllCategoriesSelected(false);
  setAllDurationsSelected(false);
};
const applyFilters = () => {
  setAppliedCategories(selectedCategories);
  setAppliedDurations(selectedDurations);

  setAppliedAllCategories(allCategoriesSelected);
  setAppliedAllDurations(allDurationsSelected);

  setSearchQuery("");
  setAppliedSearchQuery("");
  setHasSearch(false);

  setHasAppliedFilters(true);
  setFiltersOpen(false);
};
const applySearch = () => {
  const query = searchQuery.trim();

  setAppliedSearchQuery(query);
  setHasSearch(query.length > 0);
};
const allPractices = categories.flatMap((category) => category.practices);

const normalizedSuggestionQuery = searchQuery.trim().toLowerCase();

const [sortOrder, setSortOrder] = useState("default");

const allSuggestionItems = [
  ...allPractices.map((practice) => ({
    type: "practice",
    value: practice.title,
    id: practice.title,
  })),

  ...tags.map((tag) => ({
    type: "tag",
    value: tag.title,
    id: tag.id,
  })),
];

const filteredSuggestions =
  normalizedSuggestionQuery.length >= 3
    ? allSuggestionItems
        .filter((item) =>
          item.value.toLowerCase().includes(normalizedSuggestionQuery)
        )
        .filter(
          (item, index, array) =>
            array.findIndex(
              (other) =>
                other.type === item.type &&
                other.value.toLowerCase() === item.value.toLowerCase()
            ) === index
        )
        .slice(0, 5)
    : [];

const hasSearchCriteria =
hasSearch ||
  appliedAllCategories ||
  appliedAllDurations ||
  appliedCategories.length > 0 ||
  appliedDurations.length > 0;

  let selectedTagTitle = null;
  
const filteredPractices = hasSearchCriteria
  ? allPractices.filter((practice) => {
  // КАТЕГОРИЯ
const matchesCategory =
  appliedCategories.length === 0 ||
  appliedCategories.some((category) =>
    categories.find((item) => item.title === category)?.practices.includes(practice)
  );

  // ДЛИТЕЛЬНОСТЬ
  const minutes = parseInt(practice.duration, 10);

  // ПОИСК ПО СЛОВАМ
const normalizedQuery = appliedSearchQuery.trim().toLowerCase();

const searchTerms = normalizedQuery
  .split(/\s+/)
  .filter(Boolean);

const selectedTags = searchTerms.map((term) =>
  term.startsWith("#")
    ? tags.find(
        (tag) => `#${tag.title}` === term
      )
    : tags.find(
        (tag) =>
          tag.title.toLowerCase() === term ||
          tag.relatedTerms.some(
            (relatedTerm) =>
              relatedTerm.toLowerCase() === term
          )
      )
);

const tagTitles = selectedTags
  .filter(Boolean)
  .map((tag) => `#${tag.title}`);

selectedTagTitle =
  tagTitles.length > 0
    ? tagTitles.join(", ")
    : null;

const exactPracticeTitleMatch =
  allPractices.some(
    (item) =>
      item.title.toLowerCase() === normalizedQuery
  );

const matchesSearch =
  normalizedQuery === "" ||
  (
    exactPracticeTitleMatch
      ? practice.title.toLowerCase() === normalizedQuery
      : searchTerms.some((term, index) => {
          const selectedTag = selectedTags[index];

          return selectedTag
            ? practice.tags?.includes(selectedTag.id)
            : practice.title.toLowerCase().includes(term) ||
              practice.shortDescription.toLowerCase().includes(term);
        })
  );
  
const matchesDuration =
  appliedDurations.length === 0 ||
  appliedDurations.some((duration) => {
      if (duration === "1–5 минут") {
        return minutes >= 1 && minutes <= 5;
      }

      if (duration === "5–10 минут") {
        return minutes >= 5 && minutes <= 10;
      }

      if (duration === "10–20 минут") {
        return minutes >= 10 && minutes <= 20;
      }

      if (duration === "20–30 минут") {
        return minutes >= 20 && minutes <= 30;
      }

      if (duration === "30+ минут") {
        return minutes >= 30;
      }

      return true;
    });

    return matchesCategory && matchesDuration && matchesSearch;
  })
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
  : [];

return (
  <main className="relative min-h-screen overflow-hidden bg-[#F5F7FC] pb-28 page-fade">

    <img
      src="/search-page-branch.svg"
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 right-[-40px] w-[760px] opacity-70"
    />

    <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
      
      <h1 className="text-3xl ml-23 font-medium text-[#172B70]">
        Поиск
      </h1>

      <div className="mt-2 ml-22 flex items-center gap-3">

          <p className="max-w-[720px] text-sm leading-6 text-[#7180A0]">
            Здесь можно найти практику по названию, ключевым словам или своему состоянию
          </p>

        </div>

      {/* ПОИСК */}
      <div className="mt-3 ml-11 flex items-center gap-3">

        <div className="relative w-[720px] ml-11 flex items-center rounded-2xl border border-[#D9E1F0] bg-white px-5 py-3 shadow-sm">

          <span className="mr-3 text-xl text-[#7180A0]">
            ⌕
          </span>

<input
  type="text"
  value={searchQuery}
  onChange={(event) => setSearchQuery(event.target.value)}
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      applySearch();
    }
  }}
  maxLength={100}
  placeholder="Что я ищу?"
  className="w-full bg-transparent pr-10 text-base text-[#172B70] outline-none placeholder:text-[#8B98B5]"
/>
<button
  type="button"
  onClick={applySearch}
  className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#3E63B8] transition hover:bg-[#F8FAFD]"
  aria-label="Искать"
>
  →
</button>

{filteredSuggestions.length > 0 &&
  searchQuery.trim() !== appliedSearchQuery.trim() && (
  <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-[#D9E1F0] bg-white p-2 shadow-lg">
    {filteredSuggestions.map((suggestion) => (
  <button
    key={`${suggestion.type}-${suggestion.id}`}
    type="button"
    onClick={() => {
      if (suggestion.type === "practice") {
        setSearchQuery(suggestion.value);
        setAppliedSearchQuery(suggestion.value);
        setHasSearch(true);
      }

      if (suggestion.type === "tag") {
        setSearchQuery(`#${suggestion.value}`);
        setAppliedSearchQuery(`#${suggestion.value}`);
        setHasSearch(true);
      }
    }}
    className="block w-full rounded-xl px-4 py-2 text-left text-sm text-[#596B91] transition hover:bg-[#F7F9FD]"
  >
    {suggestion.type === "tag"
      ? `#${suggestion.value}`
      : suggestion.value}
  </button>
))}
  </div>
)}

        </div>
<button
  onClick={() => setFiltersOpen(!filtersOpen)}
  className="rounded-2xl border border-[#D9E1F0] bg-white px-5 py-4 text-sm font-medium text-[#3E63B8] shadow-sm transition hover:bg-[#F8FAFD]"
>
<span className="relative flex items-center gap-2">
  <svg
    width="16"
    height="14"
    viewBox="0 0 16 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <line
      x1="1"
      y1="2"
      x2="15"
      y2="2"
      stroke="#3E63B8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="1"
      y1="7"
      x2="15"
      y2="7"
      stroke="#3E63B8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="1"
      y1="12"
      x2="15"
      y2="12"
      stroke="#3E63B8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>

  Фильтр

  {hasActiveFilters && (
    <span className="absolute -right-2.5 -top-0.5 h-[5px] w-[5px] rounded-full bg-[#3E63B8]" />
  )}
</span>
</button>
      </div>
      
{filtersOpen && (
  <div className="mt-4 w-full max-w-[850px] rounded-2xl border border-[#D9E1F0] bg-white p-6 shadow-sm">


{/* КАТЕГОРИЯ */}
<div>
  <h3 className="text-sm font-medium text-[#172B70]">
    Категория
  </h3>

  <div className="mt-3 flex flex-wrap gap-2">

    {/* ВСЕ */}
    <button
      onClick={clearCategories}
      className={`rounded-xl px-4 py-2 text-sm transition ${
        allCategoriesSelected
          ? "bg-[#E9F0FC] text-[#172B70]"
          : "bg-[#F8FAFD] text-[#7180A0] hover:bg-[#EEF2FA]"
      }`}
    >
      Все
    </button>

    {/* КАТЕГОРИИ */}
    {categories.map((category) => {
      const isSelected = selectedCategories.includes(category.title);

      return (
        <button
          key={category.title}
          onClick={() => toggleCategory(category.title)}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            allCategoriesSelected
              ? "bg-[#F8FAFD] text-[#B8C2D5]"
              : isSelected
                ? "bg-[#E9F0FC] text-[#172B70]"
                : "bg-[#F8FAFD] text-[#7180A0] hover:bg-[#EEF2FA]"
          }`}
        >
          {category.title}
        </button>
      );
    })}

  </div>
</div>

{/* ДЛИТЕЛЬНОСТЬ */}
<div className="mt-6">
  <h3 className="text-sm font-medium text-[#172B70]">
    Длительность
  </h3>

  <div className="mt-3 flex flex-wrap gap-2">

    {/* ВСЕ */}
    <button
      onClick={clearDurations}
      className={`rounded-xl px-4 py-2 text-sm transition ${
        allDurationsSelected
          ? "bg-[#E9F0FC] text-[#172B70]"
          : "bg-[#F8FAFD] text-[#7180A0] hover:bg-[#EEF2FA]"
      }`}
    >
      Все
    </button>

    {[
      "1–5 минут",
      "5–10 минут",
      "10–20 минут",
      "20–30 минут",
      "30+ минут",
    ].map((duration) => {
      const isSelected = selectedDurations.includes(duration);

      return (
        <button
          key={duration}
          onClick={() => toggleDuration(duration)}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            allDurationsSelected
              ? "bg-[#F8FAFD] text-[#B8C2D5]"
              : isSelected
                ? "bg-[#E9F0FC] text-[#172B70]"
                : "bg-[#F8FAFD] text-[#7180A0] hover:bg-[#EEF2FA]"
          }`}
        >
          {duration}
        </button>
      );
    })}

  </div>
</div>

<div className="mt-6 flex items-center justify-between">

  <button
    onClick={resetFilters}
    className="text-sm font-medium text-[#7180A0] transition hover:text-[#3E63B8]"
  >
    Сбросить фильтры
  </button>

  <button
    onClick={applyFilters}
    className="rounded-xl bg-[#E9F0FC] px-5 py-2 text-sm font-medium text-[#3E63B8] transition hover:bg-[#D9E1F0]"
  >
    Применить
  </button>

</div>

  </div>
)}
{(hasAppliedFilters || hasSearch) && (
  <div className="mt-10 w-full max-w-[850px]">

<div className="mb-4 flex items-center justify-between">

  {/* КОЛИЧЕСТВО РЕЗУЛЬТАТОВ */}
  <h2 className="text-lg ml-22 font-medium text-[#172B70]">
  Найдено: {filteredPractices.length}{" "}
  {filteredPractices.length === 1
    ? "практика"
    : filteredPractices.length < 5
      ? "практики"
      : "практик"}

  {selectedTagTitle && (
    <span className="ml-2 text-sm font-normal text-[#7180A0]">
      · по тегу {selectedTagTitle}
    </span>
  )}
</h2>

  {/* СОРТИРОВКА */}
  <select
    value={sortOrder}
    onChange={(event) => setSortOrder(event.target.value)}
    className="relative left-[88px] rounded-lg border border-[#D9E1F0] bg-white px-3 py-2 text-sm text-[#596B91] outline-none transition focus:border-[#3E63B8]"
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
    {/* РЕЗУЛЬТАТЫ */}
    <div className="mt-4 max-w-[760px] divide-y divide-[#D9E1F0]">

{filteredPractices.map((practice) => (
  <button
    key={practice.title}
    onClick={() => setSelectedPractice(practice)}
    className="flex w-full ml-22 gap-4 py-4 text-left transition-colors hover:bg-[#F7F9FD]"
  >

          {/* ФОТО 4:3 */}
          <div className="h-20 w-[107px] shrink-0 overflow-hidden rounded-xl bg-[#E9F0FC]">
            <img
              src={practice.image}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          {/* ИНФОРМАЦИЯ */}
          <div className="min-w-0">

            <h3 className="font-medium text-[#172B70]">
              {practice.title}
            </h3>

            <p className="mt-1 text-xs text-[#7180A0]">
              Медитация · {practice.duration}
            </p>

            <p className="mt-2 text-sm leading-5 text-[#596B91]">
              {practice.shortDescription}
            </p>

          </div>

        </button>
      ))}

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