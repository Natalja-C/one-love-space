"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { tags } from "../data/tags";
import { getRecommendations } from "../lib/recommendations";
import { categories } from "../data/meditations";
import PracticeModal from "../components/PracticeModal";
import PracticePlayer from "../components/PracticePlayer";
import { getUserStorageKey } from "../components/auth";

type DiaryEntry = {
  id: string;
  date: string;
  time: string;
  text: string;

  reflection?: {
    howIAm: string;
    whatAffectedMe: string;
    body: string;
    attention: string;
    needs: string;
    wish: string;
  };

  tags?: string[];

  recommendationData?: {
    manualTags: string[];
    reflectionTags: string[];
    detectedTags: string[];
    desiredTags: string[];
  };

  recommendation?: {
    type: "personal" | "suggestive" | "neutral";
    createdAt: string;

    practices: {
      practiceId: string;
      title: string;
      duration: string;
      image?: string;
      category?: string;

      score?: number;

      matchedTags?: string[];
      matchedDesiredStates?: string[];
    }[];
  };
};

const DIARY_KEY = "oneLoveSpaceDiaryEntries";
const getLocalDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getTagsFromReflection = (
  reflection: DiaryEntry["reflection"],
  text: string = ""
) => {
const reflectionText = [
  ...Object.values(reflection ?? {}),
  text,
]
  .join(" ")
  .toLowerCase();

  return tags
    .filter((tag) => {
      const terms = [tag.title, ...tag.relatedTerms];

      return terms.some((term) =>
        reflectionText.includes(term.toLowerCase())
      );
    })
    .map((tag) => tag.id);
};

const getReflectionTagsFromOptions = (
  bodyOptions: string[]
) => {
  const optionMap: Record<string, string> = {
    Напряжение: "tension",
    Усталость: "fatigue",
    Тяжесть: "overexertion",
    Лёгкость: "lightness",
    Тепло: "warmth",
    Спокойствие: "calm",
  };

  return bodyOptions
    .map((option) => optionMap[option])
    .filter(Boolean);
};

const getDesiredTagsFromOptions = (
  needsOptions: string[]
) => {
  const optionMap: Record<string, string> = {
    Успокоиться: "calm",
    Расслабиться: "relaxation",
    "Восстановить силы": "support",
    "Почувствовать опору": "support",
    "Почувствовать безопасность": "safety",
    "Разобраться в происходящем": "clarity",
    "Почувствовать поддержку": "care",
    "Побыть с собой": "acceptance",
  };

  return needsOptions
    .map((option) => optionMap[option])
    .filter(Boolean);
};

const formatTime = (time: number) => {
  if (!time || !Number.isFinite(time)) {
    return "0:00";
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function Diary() {
const today = new Date();

const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
const [calendarYear, setCalendarYear] = useState(today.getFullYear());
const [selectedDay, setSelectedDay] = useState(today.getDate());
const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const daysInMonth = new Date(
  calendarYear,
  calendarMonth + 1,
  0
).getDate();

const firstDayOfMonth = new Date(
  calendarYear,
  calendarMonth,
  1
).getDay();

const calendarStartOffset =
  firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

const goToPreviousMonth = () => {
  if (calendarMonth === 0) {
    setCalendarMonth(11);
    setCalendarYear((previous) => previous - 1);
  } else {
    setCalendarMonth((previous) => previous - 1);
  }

  setSelectedDay(1);
};

const goToNextMonth = () => {
  if (calendarMonth === 11) {
    setCalendarMonth(0);
    setCalendarYear((previous) => previous + 1);
  } else {
    setCalendarMonth((previous) => previous + 1);
  }

  setSelectedDay(1);
};

const goToToday = () => {
  setCalendarMonth(today.getMonth());
  setCalendarYear(today.getFullYear());
  setSelectedDay(today.getDate());
};

const [entryText, setEntryText] = useState("");
const [questionsOpen, setQuestionsOpen] = useState(false);

const [selectedTags, setSelectedTags] = useState<string[]>([]);
const [showTagPicker, setShowTagPicker] = useState(false);

const [showTags, setShowTags] = useState(false);
const [openDayEntryTagsId, setOpenDayEntryTagsId] =
  useState<string | null>(null);

const [reflection, setReflection] = useState({
  howIAm: "",
  whatAffectedMe: "",
  body: "",
  attention: "",
  needs: "",
  wish: "",
});

const [bodyOptions, setBodyOptions] = useState<string[]>([]);
const [needsOptions, setNeedsOptions] = useState<string[]>([]);

const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
const [isHydrated, setIsHydrated] = useState(false);
const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
const [isEditMode, setIsEditMode] = useState(false);
const [editEntryText, setEditEntryText] = useState("");
const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

const [recommendationModal, setRecommendationModal] =
  useState<NonNullable<DiaryEntry["recommendation"]> | null>(null);

const [isRecommendationLoading, setIsRecommendationLoading] =
  useState(false);

const [openQuestion, setOpenQuestion] = useState<string | null>(null);
const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);

const [isDayEntriesOpen, setIsDayEntriesOpen] = useState(false);
const [openedFromDayEntries, setOpenedFromDayEntries] = useState(false);

const allPractices = categories.flatMap(
  (category) => category.practices
);

const [selectedPractice, setSelectedPractice] =
  useState<
    | ((typeof allPractices)[number] & {
        diaryEntryId?: string | null;
        beforeTags?: string[];
      })
    | null
  >(null);

const [isPlayerOpen, setIsPlayerOpen] = useState(false);

const audioRef = useRef(null);
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

const [recommendationSource, setRecommendationSource] = useState<{
  entryId: string;
  beforeTags: string[];
} | null>(null);

const toggleQuestion = (questionId: string) => {
  setOpenQuestion((previous) =>
    previous === questionId ? null : questionId
  );
};

const completeQuestion = (questionId: string) => {
  setAnsweredQuestions((previous) =>
    previous.includes(questionId)
      ? previous
      : [...previous, questionId]
  );

  setOpenQuestion(null);
};

const skipQuestion = (questionId: string) => {
  setAnsweredQuestions((previous) =>
    previous.filter((id) => id !== questionId)
  );

  setReflection((previous) => {
    switch (questionId) {
      case "howIAm":
        return {
          ...previous,
          howIAm: "",
        };

      case "whatAffectedMe":
        return {
          ...previous,
          whatAffectedMe: "",
        };

      case "body":
        return {
          ...previous,
          body: "",
        };

      case "attention":
        return {
          ...previous,
          attention: "",
        };

      case "needs":
        return {
          ...previous,
          needs: "",
        };

      case "wish":
        return {
          ...previous,
          wish: "",
        };

      default:
        return previous;
    }
  });

  if (questionId === "body") {
    setBodyOptions([]);
  }

  if (questionId === "needs") {
    setNeedsOptions([]);
  }

  setOpenQuestion(null);
};

const historyRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  const storedEntries = localStorage.getItem(
  getUserStorageKey(DIARY_KEY)
);

  if (storedEntries) {
    try {
      setDiaryEntries(JSON.parse(storedEntries));
    } catch {
      setDiaryEntries([]);
    }
  }

  setIsHydrated(true);
}, []);


  /* СОХРАНЕНИЕ ЗАПИСЕЙ */
useEffect(() => {
  if (!isHydrated) {
    return;
  }

  localStorage.setItem(
  getUserStorageKey(DIARY_KEY),
  JSON.stringify(diaryEntries)
);
}, [diaryEntries, isHydrated]);

/* ЗАКРЫТИЕ СПИСКА ТЕГОВ ПРИ КЛИКЕ СНАРУЖ */

useEffect(() => {
  if (!showTagPicker) {
    return;
  }

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (!target.closest("[data-tag-picker]")) {
      setShowTagPicker(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showTagPicker]);

/* СОХРАНИТЬ НОВУЮ ЗАПИСЬ */
const handleSaveEntry = () => {
  const now = new Date();

const savedReflection = {
  ...reflection,
  body: [
    reflection.body.trim(),
    bodyOptions.join(", "),
  ]
    .filter(Boolean)
    .join(" · "),

  needs: [
    reflection.needs.trim(),
    needsOptions.join(", "),
  ]
    .filter(Boolean)
    .join(" · "),
};

const manualTags = [...selectedTags];

const reflectionTags = getReflectionTagsFromOptions(
  bodyOptions
);

const desiredTags = getDesiredTagsFromOptions(
  needsOptions
);

const detectedTags = getTagsFromReflection(
  {
    howIAm: reflection.howIAm,
    whatAffectedMe: reflection.whatAffectedMe,
    body: reflection.body,
    attention: "",
    needs: "",
    wish: "",
  },
  entryText
);

const allEntryTags = Array.from(
  new Set([
    ...manualTags,
    ...reflectionTags,
    ...detectedTags,
    ...desiredTags,
  ])
);

const recommendationResult = getRecommendations({
  manualTags,
  reflectionTags,
  detectedTags,
  desiredTags,
});

console.log(
  "ONE LOVE SPACE RECOMMENDATION:",
  recommendationResult
);

const storedRecommendationPractices =
  recommendationResult.recommendations.map((item: any) => {

    const practice =
      item.practice ?? item;

    return {
      practiceId: practice.id,
      title: practice.title,
      duration: practice.duration,
      image: practice.image,
      category: practice.category,

      score:
        typeof item.score === "number"
          ? item.score
          : undefined,

      matchedTags:
        Array.isArray(item.matchedTags)
          ? item.matchedTags
          : undefined,

      matchedDesiredStates:
        Array.isArray(item.matchedDesiredStates)
          ? item.matchedDesiredStates
          : undefined,
    };
  });

const storedRecommendation: NonNullable<
  DiaryEntry["recommendation"]
> = {
  type: recommendationResult.type as
    | "personal"
    | "suggestive"
    | "neutral",

  createdAt: now.toISOString(),

  practices: storedRecommendationPractices,
};

  const newEntry: DiaryEntry = {
    id: `${now.getTime()}`,
    date: getLocalDateString(now),
    time: now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    text: entryText.trim(),
    reflection: savedReflection,
    tags: allEntryTags,

recommendationData: {
  manualTags,
  reflectionTags,
  detectedTags,
  desiredTags,
},
recommendation: storedRecommendation,

  };

  setDiaryEntries((previousEntries) =>
    [...previousEntries, newEntry].sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime()
    )
  );

setIsRecommendationLoading(true);

setRecommendationSource({
  entryId: newEntry.id,
  beforeTags: [
    ...manualTags,
    ...reflectionTags,
    ...detectedTags,
  ],
});

setTimeout(() => {
  setIsRecommendationLoading(false);
  setRecommendationModal(storedRecommendation);
}, 4000);
  
  /* ОЧИЩАЕМ ФОРМУ ПОСЛЕ СОХРАНЕНИЯ */
  setSelectedDay(now.getDate());
  setEntryText("");

  setReflection({
    howIAm: "",
    whatAffectedMe: "",
    body: "",
    attention: "",
    needs: "",
    wish: "",
  });

  setAnsweredQuestions([]);
  setOpenQuestion(null);
  setBodyOptions([]);
  setNeedsOptions([]);
  setSelectedTags([]);
  setQuestionsOpen(false);
};

/* УДАЛИТЬ ЗАПИСЬ */
const handleDeleteEntry = (id: string) => {
  setDiaryEntries((previousEntries) =>
    previousEntries.filter((entry) => entry.id !== id)
  );

  setSelectedEntry(null);
  setIsEditMode(false);
  setIsDeleteConfirmOpen(false);
};

  {/* ИЗМЕНИТЬ ЗАПИСЬ */}
const handleUpdateEntry = () => {
  if (!selectedEntry) {
    return;
  }

  const updatedText = editEntryText.trim();

  setDiaryEntries((previousEntries) =>
    previousEntries.map((entry) =>
      entry.id === selectedEntry.id
        ? {
            ...entry,
            text: updatedText,
            reflection: { ...reflection },
            tags: getTagsFromReflection(reflection, updatedText),
          }
        : entry
    )
  );

  setSelectedEntry(null);

  setIsEditMode(false);
};

  /* ЗАПИСИ ВЫБРАННОГО ДНЯ */
const selectedDateEntries = diaryEntries
  .filter((entry) => {
    const entryDate = new Date(`${entry.date}T00:00:00`);

    return (
      entryDate.getFullYear() === calendarYear &&
      entryDate.getMonth() === calendarMonth &&
      entryDate.getDate() === selectedDay
    );
  })
  .sort((a, b) => b.time.localeCompare(a.time));

  /* ПОСЛЕДНИЕ ЗАПИСИ */
  const latestEntries = [...diaryEntries]
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();

      return dateB - dateA;
    })
    .slice(0, 3);

    const latestRecommendationEntry = [...diaryEntries]
  .filter(
    (entry) =>
      entry.recommendation &&
      entry.recommendation.practices.length > 0
  )
  .sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`).getTime();
    const dateB = new Date(`${b.date}T${b.time}`).getTime();

    return dateB - dateA;
  })[0];

const latestRecommendation =
  latestRecommendationEntry?.recommendation;

      const openEntry = (entry: DiaryEntry, editMode = false) => {
    setSelectedEntry(entry);
    setShowTags(false);
    setEditEntryText(entry.text);

    setReflection({
      howIAm: "",
      whatAffectedMe: "",
      body: "",
      attention: "",
      needs: "",
      wish: "",
      ...entry.reflection,
    });

    setIsEditMode(editMode);
    setIsDeleteConfirmOpen(false);
  };

const openRecommendedPractice = (practiceId: string) => {
  const fullPractice = allPractices.find(
  (practice) =>
    practice.id === practiceId ||
    practice.title === practiceId
);

  if (!fullPractice) {
    return;
  }

  setSelectedPractice({
    ...fullPractice,
    diaryEntryId: recommendationSource?.entryId ?? null,
    beforeTags: recommendationSource?.beforeTags ?? [],
  });
};

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#334A78] via-[#3E4E7D] to-[#465A9A] pb-24 text-[#172B70] page-fade">


      {/* ОСНОВНАЯ ОБЛАСТЬ ДНЕВНИКА */}
      <div className="mx-auto max-w-6xl px-6 py-10">


        {/* ЗАГОЛОВОК ДНЕВНИКА */}
        <section className="mb-5 flex flex-col items-center">

        <img
        src="/diary-title.png"
        alt="Дневник состояний"
        className="h-auto w-[360px] max-w-full brightness-[1.3] saturate-[0.75]"
        />

        </section>


        {/* НОВАЯ РЕФЛЕКСИЯ */}
        <section className="rounded-3xl border border-[#D9E1F0] bg-white p-8 shadow-[0_4px_16px_rgba(23,43,112,0.08)]">

        <h1 className="mb-3 text-2xl font-medium text-[#172B70]">
        Что со мной сейчас происходит?
        </h1>

      <p className="mb-5 max-w-5xl text-[14px] leading-6 text-[#6875A8]">
      Здесь ты можешь спокойно остановиться и рассказать, что с тобой происходит. Пусть это будут всего несколько слов, мысль, эмоция или просто то, каким ты сейчас ощущаешь своё состояние.
      </p>


          {/* ПОЛЕ ДЛЯ ЗАПИСИ */}
<textarea
  value={entryText}
  onChange={(e) => setEntryText(e.target.value)}
  className="
    min-h-32 w-full resize-none rounded-2xl
    border border-[#E1E4F0]
    bg-[#FCFCFE]
    p-4
    text-[15px]
    leading-6
    text-[#172B70]
    outline-none
    transition
    placeholder:font-[family-name:var(--font-monroe)]
    placeholder:text-[15px]
    placeholder:text-[#8B98B5]
    focus:border-[#9AA8D0]
    focus:ring-2 focus:ring-[#667CC9]/10
  "
  placeholder="Напиши здесь то, чем хочется поделиться..."
/>


          {/* ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ */}
<div className="mt-5 flex flex-wrap items-start gap-4">

  <button
    type="button"
    onClick={() => {
      setQuestionsOpen((previous) => {
        if (!previous) {
          setReflection({
            howIAm: "",
            whatAffectedMe: "",
            body: "",
            attention: "",
            needs: "",
            wish: "",
          });

          setAnsweredQuestions([]);
          setOpenQuestion(null);
          setBodyOptions([]);
          setNeedsOptions([]);
        }

        return !previous;
      });
    }}
    className="rounded-xl border border-[#E0E6F2] bg-[#EAF0F9] px-4 py-2.5 text-[13px] font-medium text-[#667CC9] transition hover:bg-[#E4EBF7]"
  >
    Мне проще ответить на вопросы
  </button>

  <div className="relative" data-tag-picker>

    <button
      type="button"
      onClick={() => setShowTagPicker((previous) => !previous)}
      className="rounded-xl border border-[#E0E6F2] bg-[#EAF0F9] px-4 py-2.5 text-[13px] font-medium text-[#667CC9] transition hover:bg-[#E4EBF7]"
    >
      Выбрать тег
    </button>

    {showTagPicker && (
      <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-[#E6E8F1] bg-white p-3 shadow-[0_12px_30px_rgba(23,43,112,0.12)]">
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">

          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  setSelectedTags((previous) =>
                    isSelected
                      ? previous.filter((id) => id !== tag.id)
                      : [...previous, tag.id]
                  );
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? "bg-[#EEEAF7] text-[#526083]"
                    : "text-[#6875A8] hover:bg-[#F7F8FC]"
                }`}
              >
                <span>#{tag.title}</span>

                {isSelected && (
                  <span className="text-[#667CC9]">✓</span>
                )}
              </button>
            );
          })}

        </div>
      </div>
    )}

  </div>

</div>

{/* ВОПРОСЫ ДНЕВНИКА */}
{questionsOpen && (
  <div className="mt-5 border-t border-[#E8EBF3] pt-5">

    <div className="mb-4">
      <h2 className="text-xl font-medium text-[#172B70]">
        Небольшая рефлексия
      </h2>

      <p className="mt-2 max-w-4xl text-[14px] leading-6 text-[#6875A8]">
        Ниже несколько вопросов, которые помогут немного лучше разобраться
        в своём состоянии. Можно ответить лишь на те, которые откликаются сейчас.
      </p>
    </div>


    {/* ВОПРОС 1 */}
    <div className="mb-2 rounded-2xl border border-transparent">

      <button
        type="button"
        onClick={() => toggleQuestion("howIAm")}
        className="flex w-full items-center justify-between rounded-2xl px-1 py-1.5 text-left transition hover:bg-[#F8F9FC]"
      >
        <span className="text-[16px] font-medium text-[#172B70]">
          Как я сейчас?
        </span>

        {answeredQuestions.includes("howIAm") ? (
  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF1FA] text-[13px] font-medium text-[#667CC9]">
  ✓
</span>
) : (
  <span className="text-[12px] text-[#8B98B5]">
    Ответить
  </span>
)}
      </button>

      {openQuestion === "howIAm" && (
        <div className="mt-1 px-1 pb-2">

          <textarea
            value={reflection.howIAm}
            onChange={(e) =>
              setReflection((previous) => ({
                ...previous,
                howIAm: e.target.value,
              }))
            }
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-[#FCFCFE] p-3 text-[14px] leading-5 text-[#172B70] outline-none transition placeholder:text-[#8B98B5] focus:border-[#9AA8D0] focus:ring-2 focus:ring-[#667CC9]/10"
            placeholder="Несколько слов, эмоция или то, каким Вы сейчас ощущаете своё состояние..."
          />

<div className="mt-2 flex items-center justify-end gap-2">

  <button
    type="button"
    onClick={() => skipQuestion("howIAm")}
    className="h-8 rounded-xl border border-[#E0E6F2] bg-[#F8F9FC] px-3 text-[12px] font-medium text-[#8B98B5] transition hover:bg-[#F0F2F8] hover:text-[#6875A8]"
  >
    Пропустить
  </button>

  <button
    type="button"
    onClick={() => {
      if (reflection.howIAm.trim() !== "") {
  completeQuestion("howIAm");
}
    }}
    aria-label="Сохранить ответ"
    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#667CC9] text-[15px] font-medium text-white transition hover:bg-[#5A70BD]"
  >
    ✓
  </button>

</div>

        </div>
      )}

    </div>


    {/* ВОПРОС 2 */}
    <div className="mb-2 rounded-2xl border border-transparent">

      <button
        type="button"
        onClick={() => toggleQuestion("whatAffectedMe")}
        className="flex w-full items-center justify-between rounded-2xl px-1 py-1.5 text-left transition hover:bg-[#F8F9FC]"
      >
        <span className="text-[16px] font-medium text-[#172B70]">
          Что сегодня больше всего повлияло на моё состояние?
        </span>

        {reflection.whatAffectedMe.trim() !== "" ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF1FA] text-[13px] font-medium text-[#667CC9]">
  ✓
</span>
        ) : (
          <span className="text-[12px] text-[#8B98B5]">
            Ответить
          </span>
        )}
      </button>

      {openQuestion === "whatAffectedMe" && (
        <div className="mt-1 px-1 pb-2">

          <textarea
            value={reflection.whatAffectedMe}
            onChange={(e) =>
              setReflection((previous) => ({
                ...previous,
                whatAffectedMe: e.target.value,
              }))
            }
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-[#FCFCFE] p-3 text-[14px] leading-5 text-[#172B70] outline-none transition placeholder:text-[#8B98B5] focus:border-[#9AA8D0] focus:ring-2 focus:ring-[#667CC9]/10"
            placeholder="Можно написать несколько слов или оставить вопрос без ответа..."
          />

        <div className="mt-2 flex items-center justify-end gap-2">

  <button
    type="button"
    onClick={() => skipQuestion("whatAffectedMe")}
    className="h-8 rounded-xl border border-[#E0E6F2] bg-[#F8F9FC] px-3 text-[12px] font-medium text-[#8B98B5] transition hover:bg-[#F0F2F8] hover:text-[#6875A8]"
  >
    Пропустить
  </button>

  <button
    type="button"
    onClick={() => {
      if (reflection.whatAffectedMe.trim() !== "") {
  completeQuestion("whatAffectedMe");
}
    }}
    aria-label="Сохранить ответ"
    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#667CC9] text-[15px] font-medium text-white transition hover:bg-[#5A70BD]"
  >
    ✓
  </button>

</div>

        </div>
      )}

    </div>


    {/* ВОПРОС 3 */}
    <div className="mb-2 rounded-2xl border border-transparent">

      <button
        type="button"
        onClick={() => toggleQuestion("body")}
        className="flex w-full items-center justify-between rounded-2xl px-1 py-1.5 text-left transition hover:bg-[#F8F9FC]"
      >
        <span className="text-[16px] font-medium text-[#172B70]">
          Что сейчас чувствует моё тело?
        </span>

        {reflection.body.trim() !== "" || bodyOptions.length > 0 ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF1FA] text-[13px] font-medium text-[#667CC9]">
  ✓
</span>
        ) : (
          <span className="text-[12px] text-[#8B98B5]">
            Ответить
          </span>
        )}
      </button>

      {openQuestion === "body" && (
        <div className="mt-1 px-1 pb-2">

          <textarea
            value={reflection.body}
            onChange={(e) =>
              setReflection((previous) => ({
                ...previous,
                body: e.target.value,
              }))
            }
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-[#FCFCFE] p-3 text-[14px] leading-5 text-[#172B70] outline-none transition placeholder:text-[#8B98B5] focus:border-[#9AA8D0] focus:ring-2 focus:ring-[#667CC9]/10"
            placeholder="Например: напряжение, усталость, лёгкость, тепло..."
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              "Напряжение",
              "Усталость",
              "Тяжесть",
              "Лёгкость",
              "Тепло",
              "Спокойствие",
            ].map((option) => {
              const isSelected = bodyOptions.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setBodyOptions((previous) =>
                      isSelected
                        ? previous.filter((item) => item !== option)
                        : [...previous, option]
                    );
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
                    isSelected
                      ? "border-[#8B72B5] bg-[#EEEAF7] text-[#526083]"
                      : "border-[#E0E6F2] bg-[#F8F9FC] text-[#6875A8] hover:bg-[#F0F2F8]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">

  <button
    type="button"
    onClick={() => skipQuestion("body")}
    className="h-8 rounded-xl border border-[#E0E6F2] bg-[#F8F9FC] px-3 text-[12px] font-medium text-[#8B98B5] transition hover:bg-[#F0F2F8] hover:text-[#6875A8]"
  >
    Пропустить
  </button>

  <button
    type="button"
    onClick={() => {
     if (
  reflection.body.trim() !== "" ||
  bodyOptions.length > 0
) {
  completeQuestion("body");
}
    }}
    aria-label="Сохранить ответ"
    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#667CC9] text-[15px] font-medium text-white transition hover:bg-[#5A70BD]"
  >
    ✓
  </button>

</div>

        </div>
      )}

    </div>


    {/* ВОПРОС 4 */}
    <div className="mb-2 rounded-2xl border border-transparent">

      <button
        type="button"
        onClick={() => toggleQuestion("attention")}
        className="flex w-full items-center justify-between rounded-2xl px-1 py-1.5 text-left transition hover:bg-[#F8F9FC]"
      >
        <span className="text-[16px] font-medium text-[#172B70]">
          Где сейчас находится моё внимание?
        </span>

        {reflection.attention !== "" ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF1FA] text-[13px] font-medium text-[#667CC9]">
  ✓
</span>
        ) : (
          <span className="text-[12px] text-[#8B98B5]">
            Ответить
          </span>
        )}
      </button>

      {openQuestion === "attention" && (
        <div className="mt-1 px-1 pb-2">

          <div className="flex flex-wrap gap-2">
            {[
              "В прошлом",
              "В будущем",
              "В настоящем",
              "Постоянно переключается",
              "Не знаю / сложно сказать",
            ].map((option) => {
              const isSelected = reflection.attention === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setReflection((previous) => ({
                      ...previous,
                      attention: isSelected ? "" : option,
                    }))
                  }
                  className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
                    isSelected
                      ? "border-[#8B72B5] bg-[#EEEAF7] text-[#526083]"
                      : "border-[#E0E6F2] bg-[#F8F9FC] text-[#6875A8] hover:bg-[#F0F2F8]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">

  <button
    type="button"
    onClick={() => skipQuestion("attention")}
    className="h-8 rounded-xl border border-[#E0E6F2] bg-[#F8F9FC] px-3 text-[12px] font-medium text-[#8B98B5] transition hover:bg-[#F0F2F8] hover:text-[#6875A8]"
  >
    Пропустить
  </button>

  <button
    type="button"
    onClick={() => {
      if (reflection.attention !== "") {
  completeQuestion("attention");
}
    }}
    aria-label="Сохранить ответ"
    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#667CC9] text-[15px] font-medium text-white transition hover:bg-[#5A70BD]"
  >
    ✓
  </button>

</div>

        </div>
      )}

    </div>


    {/* ВОПРОС 5 */}
    <div className="mb-2 rounded-2xl border border-transparent">

      <button
        type="button"
        onClick={() => toggleQuestion("needs")}
        className="flex w-full items-center justify-between rounded-2xl px-1 py-1.5 text-left transition hover:bg-[#F8F9FC]"
      >
        <span className="text-[16px] font-medium text-[#172B70]">
          Что мне сейчас нужно больше всего?
        </span>

        {reflection.needs.trim() !== "" || needsOptions.length > 0 ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF1FA] text-[13px] font-medium text-[#667CC9]">
  ✓
</span>
        ) : (
          <span className="text-[12px] text-[#8B98B5]">
            Ответить
          </span>
        )}
      </button>

      {openQuestion === "needs" && (
        <div className="mt-1 px-1 pb-2">

          <textarea
            value={reflection.needs}
            onChange={(e) =>
              setReflection((previous) => ({
                ...previous,
                needs: e.target.value,
              }))
            }
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-[#FCFCFE] p-3 text-[14px] leading-5 text-[#172B70] outline-none transition placeholder:text-[#8B98B5] focus:border-[#9AA8D0] focus:ring-2 focus:ring-[#667CC9]/10"
            placeholder="Можно написать своими словами..."
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              "Успокоиться",
              "Расслабиться",
              "Восстановить силы",
              "Почувствовать опору",
              "Почувствовать безопасность",
              "Разобраться в происходящем",
              "Почувствовать поддержку",
              "Побыть с собой",
            ].map((option) => {
              const isSelected = needsOptions.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setNeedsOptions((previous) =>
                      isSelected
                        ? previous.filter((item) => item !== option)
                        : [...previous, option]
                    );
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
                    isSelected
                      ? "border-[#8B72B5] bg-[#EEEAF7] text-[#526083]"
                      : "border-[#E0E6F2] bg-[#F8F9FC] text-[#6875A8] hover:bg-[#F0F2F8]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">

  <button
    type="button"
    onClick={() => skipQuestion("needs")}
    className="h-8 rounded-xl border border-[#E0E6F2] bg-[#F8F9FC] px-3 text-[12px] font-medium text-[#8B98B5] transition hover:bg-[#F0F2F8] hover:text-[#6875A8]"
  >
    Пропустить
  </button>

  <button
    type="button"
    onClick={() => {
      if (
  reflection.needs.trim() !== "" ||
  needsOptions.length > 0
) {
  completeQuestion("needs");
}
    }}
    aria-label="Сохранить ответ"
    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#667CC9] text-[15px] font-medium text-white transition hover:bg-[#5A70BD]"
  >
    ✓
  </button>

</div>

        </div>
      )}

    </div>


    {/* ВОПРОС 6 */}
    <div className="mb-1 rounded-2xl border border-transparent">

      <button
        type="button"
        onClick={() => toggleQuestion("wish")}
        className="flex w-full items-center justify-between rounded-2xl px-1 py-1.5 text-left transition hover:bg-[#F8F9FC]"
      >
        <span className="text-[16px] font-medium text-[#172B70]">
          Что я хочу пожелать себе сегодня?
        </span>

        {reflection.wish.trim() !== "" ? (
         <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF1FA] text-[13px] font-medium text-[#667CC9]">
  ✓
</span>
        ) : (
          <span className="text-[12px] text-[#8B98B5]">
            Ответить
          </span>
        )}
      </button>

      {openQuestion === "wish" && (
        <div className="mt-1 px-1 pb-2">

          <textarea
            value={reflection.wish}
            onChange={(e) =>
              setReflection((previous) => ({
                ...previous,
                wish: e.target.value,
              }))
            }
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-[#FCFCFE] p-3 text-[14px] leading-5 text-[#172B70] outline-none transition placeholder:text-[#8B98B5] focus:border-[#9AA8D0] focus:ring-2 focus:ring-[#667CC9]/10"
            placeholder="Например, несколько слов для себя..."
          />

          <div className="mt-2 flex items-center justify-end gap-2">

  <button
    type="button"
    onClick={() => skipQuestion("wish")}
    className="h-8 rounded-xl border border-[#E0E6F2] bg-[#F8F9FC] px-3 text-[12px] font-medium text-[#8B98B5] transition hover:bg-[#F0F2F8] hover:text-[#6875A8]"
  >
    Пропустить
  </button>

  <button
    type="button"
    onClick={() => {
      if (reflection.wish.trim() !== "") {
  completeQuestion("wish");
}
    }}
    aria-label="Сохранить ответ"
    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#667CC9] text-[15px] font-medium text-white transition hover:bg-[#5A70BD]"
  >
    ✓
  </button>

</div>

        </div>
      )}

    </div>
<div className="mt-3 flex justify-start border-t border-[#EEEAF5] pt-3">
  <button
    type="button"
    onClick={() => setQuestionsOpen(false)}
    className="rounded-xl px-4 py-2 text-sm text-[#8B98B5] transition hover:bg-[#F5F7FC] hover:text-[#526EBA]"
  >
    Свернуть рефлексию
  </button>
</div>

  </div>
)}

          {/* СОХРАНИТЬ */}
          <div className="mt-5 flex justify-end">

            <button
            type="button"
           onClick={handleSaveEntry}
            className="rounded-xl bg-[#526EBA] px-7 py-3 font-medium text-white transition hover:bg-[#465FA8]"
          >
            Сохранить запись
            </button>

          </div>

        </section>


{/* ПОСЛЕДНИЕ 3 ЗАПИСИ */}
<section className="mt-10">

  <div className="grid gap-5 md:grid-cols-3">

    {latestEntries.length > 0 ? (
      latestEntries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => {
  setOpenedFromDayEntries(false);
  openEntry(entry, false);
}}
          className="flex h-[150px] w-full flex-col justify-start rounded-4xl bg-[#f6f5fa]/40 p-5 text-left shadow-sm transition hover:bg-[#f6f5fa]/45 hover:shadow-md"
        >

          <p className="text-sm font-medium text-[#e5dff2]/90">
            {entry.date === getLocalDateString(today)
            
              ? `Сегодня · ${entry.time}`
              : `${entry.date} · ${entry.time}`}
              
          </p>

          <p className="mt-3 line-clamp-6 italic leading-6 text-[#f5f6fa]">
            {entry.text || "Сегодня я просто хочу быть."}
          </p>

        </button>
      ))
    ) : (
      <div className="mt-2 flex min-h-[90px] w-full items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 text-center shadow-[0_4px_18px_rgba(23,43,112,0.08)]">
        <p className="text-[16px] font-light leading-6 text-white/90">
          Здесь будут храниться последние записи дневника
        </p>
      </div>
    )}

  </div>

</section>


     {/* ПОСЛЕДНЯЯ РЕКОМЕНДАЦИЯ */}
<section className="mt-10 rounded-3xl border border-[#D9E1F0] bg-white p-8 shadow-sm">

  <div className="mb-5 flex items-center gap-3">

    <h2 className="text-2xl font-semibold text-[#172B70]">
      Рекомендации для Вас
    </h2>

    {/* НАШ ЛИСТИК*/}
    <img
      src="/little-leaf.png"
      alt=""
      aria-hidden="true"
      className="h-8 w-auto"
    />

  </div>


  {latestRecommendationEntry && latestRecommendation ? (
    <>

      <p className="mb-5 text-sm text-[#6875A8]">
        Последние рекомендации на основе рефлексии от{" "}
        {new Date(
          `${latestRecommendationEntry.date}T00:00:00`
        ).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
        })}
      </p>


      <div className="mx-auto grid max-w-[980px] gap-6 md:grid-cols-3">

        {latestRecommendation.practices.map((practice) => (

          <div
            key={practice.practiceId}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#E4E7F0] bg-[#F8F9FC]"
          >

            {practice.image && (
            <img
              src={practice.image}
              alt=""
              className="h-32 w-full object-cover"
            />
          )}

            <div className="flex flex-1 flex-col p-4">

              <h3 className="text-base font-semibold leading-6 text-[#172B70]">
                {practice.title}
              </h3>

              <p className="mt-1 text-sm text-[#6875A8]">
                Медитация · {practice.duration}
              </p>

              <div className="mt-auto pt-5">

                <button
                  type="button"
                  onClick={() =>
    openRecommendedPractice(practice.practiceId)
  }
                  className="text-sm font-medium text-[#526EBA] transition hover:text-[#465FA8]"
                >
                  Начать практику →
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>


      <p className="mt-5 text-sm leading-6 text-[#8B98B5]">
        Эти рекомендации связаны с Вашей последней сохранённой
        рефлексией. К более ранним рекомендациям можно
        вернуться через историю дневника.
      </p>

    </>
  ) : (

    <div className="rounded-2xl bg-[#F8F9FC] px-6 py-7">

      <p className="text-sm leading-6 text-[#6875A8]">
        Персональные рекомендации появятся здесь после сохранения
        рефлексии в Дневнике состояний.
      </p>

    </div>

  )}

</section>

        {/* КАЛЕНДАРЬ И ЗАПИСЬ ДНЯ */}
<section className="mt-10 rounded-3xl border border-[#D9E1F0] bg-white p-8 shadow-sm">

  <div className="grid gap-8 md:grid-cols-2">

    {/* ИСТОРИЯ ДНЕВНИКА */}
    <div>

      <div className="mb-6 flex items-center justify-between">

        <h2 className="text-2xl font-semibold text-[#172B70]">
          История дневника
        </h2>

        <div className="relative">

  <button
    type="button"
    onClick={() =>
      setIsYearPickerOpen((previous) => !previous)
    }
    className="text-lg font-medium text-[#3E63B8] transition hover:text-[#526EBA]"
  >
    {calendarYear}
  </button>

  {isYearPickerOpen && (
    <div className="absolute right-0 top-9 z-20 max-h-52 w-28 overflow-y-auto rounded-xl border border-[#E4E7F0] bg-white p-2 shadow-lg">

      {Array.from(
        { length: 11 },
        (_, index) => today.getFullYear() - 5 + index
      ).map((year) => (
        <button
          key={year}
          type="button"
          onClick={() => {
            setCalendarYear(year);
            setIsYearPickerOpen(false);
            setSelectedDay(1);
          }}
          className={`w-full rounded-lg px-3 py-2 text-sm transition ${
            year === calendarYear
              ? "bg-[#E9F0FC] text-[#172B70]"
              : "text-[#6875A8] hover:bg-[#F5F7FC]"
          }`}
        >
          {year}
        </button>
      ))}

    </div>
  )}

</div>

      </div>

<div className="rounded-2xl border border-[#E4E7F0] bg-[#FBFCFE] p-4">

      {/* НАВИГАЦИЯ ПО МЕСЯЦУ */}
      <div className="mb-5 flex items-center justify-between">

        <button
          onClick={goToPreviousMonth}
          className="rounded-xl px-3 py-2 text-[#3E63B8] transition hover:bg-[#F5F7FC]"
        >
          ←
        </button>

        <h3 className="text-lg font-medium text-[#172B70]">
          {monthNames[calendarMonth]}
        </h3>

        <button
          onClick={goToNextMonth}
          className="rounded-xl px-3 py-2 text-[#3E63B8] transition hover:bg-[#F5F7FC]"
        >
          →
        </button>

      </div>

      <div className="mb-3 text-center">
  <button
    type="button"
    onClick={goToToday}
    className="text-[12px] font-medium text-[#667CC9] transition hover:text-[#526EBA]"
  >
    Сегодня
  </button>
</div>

      {/* КАЛЕНДАРЬ */}
      <div className="grid grid-cols-7 gap-1 text-center">

        <div className="py-2 text-xs font-medium text-[#8B98B5]">Пн</div>
        <div className="py-2 text-xs font-medium text-[#8B98B5]">Вт</div>
        <div className="py-2 text-xs font-medium text-[#8B98B5]">Ср</div>
        <div className="py-2 text-xs font-medium text-[#8B98B5]">Чт</div>
        <div className="py-2 text-xs font-medium text-[#8B98B5]">Пт</div>
        <div className="py-2 text-xs font-medium text-[#8B98B5]">Сб</div>
        <div className="py-2 text-xs font-medium text-[#8B98B5]">Вс</div>

        {Array.from({ length: calendarStartOffset }).map((_, index) => (
  <div key={`empty-${index}`} />
))}


        {Array.from({ length: daysInMonth }).map((_, index) => {

          const day = index + 1;
          const hasEntry = diaryEntries.some((entry) => {

            const entryDate = new Date(entry.date);

            return (
              entryDate.getFullYear() === calendarYear &&
              entryDate.getMonth() === calendarMonth &&
              entryDate.getDate() === day
            );
          });
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-sm transition ${
                isSelected
                  ? "bg-[#E9F0FC] text-[#172B70]"
                  : "text-[#172B70] hover:bg-[#F5F7FC]"
              }`}
            >

              <span className="flex h-5 items-center justify-center">
  {day}
</span>

<span className="flex h-3 items-center justify-center">
  {hasEntry && (
    <span className="text-[11px] leading-none text-[#8B72B5]">
      ♥
    </span>
  )}
</span>

            </button>
          );
        })}

      </div>

    </div>
</div>

    {/* ЗАПИСИ ВЫБРАННОГО ДНЯ */}
<div className="rounded-2xl border border-[#E4E7F0] bg-[#FBFCFE] p-6">

  <h3 className="text-xl font-semibold text-[#172B70]">
    {selectedDay} августа
  </h3>

  {selectedDateEntries.length > 0 ? (
<div className="mt-5">

<div
  ref={historyRef}
  className="max-h-[420px] space-y-4 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#9A9BCF_transparent]"
    onScroll={(e) => {
      const element = e.currentTarget;

      const hasMore =
        element.scrollHeight > element.clientHeight;

      const atBottom =
        element.scrollTop + element.clientHeight >=
        element.scrollHeight - 5;

    }}
  >

    {selectedDateEntries.slice(0, 3).map((entry) => (
<div
  key={entry.id}
  onClick={() => {
    setOpenedFromDayEntries(false);
    openEntry(entry, false);
  }}
  className="cursor-pointer rounded-2xl border border-[#E8E8F2] bg-white p-5 text-left shadow-sm transition hover:bg-[#F7F8FC]"
>

  <div className="min-w-0">

    {/* ВРЕМЯ */}
    <p className="text-xs font-medium text-[#8B72B5]">
      {entry.time}
    </p>


    {/* ОСНОВНАЯ ЗАПИСЬ */}
    <p className="mt-3 text-sm italic leading-6 text-[#42547E]">
      {entry.text || "Сегодня я просто хочу быть."}
    </p>


    {/* ОТВЕТЫ О СОСТОЯНИИ */}
    {entry.reflection &&
      Object.values(entry.reflection).some(
        (value) => value.trim() !== ""
      ) && (
        <div className="mt-4 border-t border-[#EEEAF5] pt-4">

          <div className="flex items-center justify-between gap-3">

  <p className="text-sm font-medium text-[#8B72B5]">
    Как я себя чувствую
  </p>

  {entry.tags && entry.tags.length > 0 && (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();

        setOpenDayEntryTagsId((currentId) =>
          currentId === entry.id ? null : entry.id
        );
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-[#8B72B5] transition hover:bg-[#F5F2FA] hover:text-[#667CC9]"
      aria-label={
        openDayEntryTagsId === entry.id
          ? "Скрыть теги"
          : "Показать теги"
      }
    >
      #
    </button>
  )}

</div>


{openDayEntryTagsId === entry.id &&
  entry.tags &&
  entry.tags.length > 0 && (
    <div
      className="mt-2 rounded-xl bg-[#F8F6FC] px-3 py-2"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="space-y-1">

        {entry.tags.map((tagId) => {
          const tag = tags.find(
            (item) => item.id === tagId
          );

          if (!tag) {
            return null;
          }

          return (
            <p
              key={tag.id}
              className="text-xs text-[#6875A8]"
            >
              #{tag.title}
            </p>
          );
        })}

      </div>
    </div>
  )}


<div className="mt-3 space-y-3">

            {entry.reflection.howIAm && (
              <div>
                <p className="text-xs text-[#8A94B1]">
                  Как я сейчас?
                </p>

                <p className="mt-1 text-sm leading-5 text-[#566587]">
                  {entry.reflection.howIAm}
                </p>
              </div>
            )}


            {entry.reflection.whatAffectedMe && (
              <div>
                <p className="text-xs text-[#8A94B1]">
                  Что сегодня больше всего повлияло на моё состояние?
                </p>

                <p className="mt-1 text-sm leading-5 text-[#566587]">
                  {entry.reflection.whatAffectedMe}
                </p>
              </div>
            )}


            {entry.reflection.body && (
              <div>
                <p className="text-xs text-[#8A94B1]">
                  Что сейчас чувствует моё тело?
                </p>

                <p className="mt-1 text-sm leading-5 text-[#566587]">
                  {entry.reflection.body}
                </p>
              </div>
            )}


            {entry.reflection.attention && (
              <div>
                <p className="text-xs text-[#8A94B1]">
                  Где сейчас находится моё внимание?
                </p>

                <p className="mt-1 text-sm leading-5 text-[#566587]">
                  {entry.reflection.attention}
                </p>
              </div>
            )}


            {entry.reflection.needs && (
              <div>
                <p className="text-xs text-[#8A94B1]">
                  Что мне сейчас нужно больше всего?
                </p>

                <p className="mt-1 text-sm leading-5 text-[#566587]">
                  {entry.reflection.needs}
                </p>
              </div>
            )}


            {entry.reflection.wish && (
              <div>
                <p className="text-xs text-[#8A94B1]">
                  Что я хочу пожелать себе сегодня?
                </p>

                <p className="mt-1 text-sm leading-5 text-[#566587]">
                  {entry.reflection.wish}
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    {/* РЕКОМЕНДАЦИИ */}
    {entry.recommendation &&
      entry.recommendation.practices.length > 0 && (
        <div className="mt-4 flex justify-end border-t border-[#F0EDF6] pt-3">

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              setRecommendationSource({
              entryId: entry.id,
              beforeTags: [
                ...(entry.recommendationData?.manualTags ?? []),
                ...(entry.recommendationData?.reflectionTags ?? []),
                ...(entry.recommendationData?.detectedTags ?? []),
              ],
            });

            setRecommendationModal(
              entry.recommendation ?? null
            );
            }}
            className="text-sm font-medium text-[#667CC9] transition hover:text-[#526EBA]"
          >
            Рекомендации →
          </button>

        </div>
      )}

  </div>

</div>
 
    ))}

  </div>

{selectedDateEntries.length > 3 && (
  <button
    type="button"
    onClick={() => setIsDayEntriesOpen(true)}
    className="mt-4 text-sm font-medium text-[#667CC9] transition hover:text-[#526EBA]"
  >
    Все записи этого дня →
  </button>
)}

</div>


  ) : (
    <p className="mt-5 text-sm leading-6 text-[#6875A8]">
      В этот день Вы пока ничего не записывали.
    </p>
  )}

</div>

  </div>

</section>

      </div>

{/* МОДАЛЬНОЕ ОКНО ЗАПИСИ */}
{selectedEntry && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B70]/20 px-6 backdrop-blur-[3px]"
    onClick={() => {
      setSelectedEntry(null);
      setIsEditMode(false);
      setIsDeleteConfirmOpen(false);
    }}
  >
    <div
      className="relative flex h-[390px] w-[520px] max-w-[calc(100vw-2rem)] flex-col rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(23,43,112,0.18)]"
      onClick={(e) => e.stopPropagation()}
    >

    {/* НАЗАД К СПИСКУ ВСЕХ ЗАПИСЕЙ */}
        {openedFromDayEntries && (
          <button
            type="button"
            onClick={() => {
              setSelectedEntry(null);
              setIsEditMode(false);
              setIsDeleteConfirmOpen(false);
              setIsDayEntriesOpen(true);
              setOpenedFromDayEntries(false);
            }}
            className="absolute right-14 top-6 flex items-center gap-1 rounded-xl px-2 py-1 text-sm text-[#8B72B5] transition hover:bg-[#F5F7FC] hover:text-[#526EBA]"
          >
            ← Все записи дня
          </button>
        )}

    {/* КРЕСТИК */}
    <button
            type="button"
            onClick={() => {
              setSelectedEntry(null);
              setIsEditMode(false);
              setIsDeleteConfirmOpen(false);
            }}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#8B98B5] transition hover:bg-[#F5F7FC] hover:text-[#526EBA]"
            aria-label="Закрыть"
          >
            ×
          </button>


      {/* ДАТА И ВРЕМЯ */}
      <div className="shrink-0 border-b border-[#E5E2EF] pb-4 pr-10">

        <div className="flex items-center gap-2 text-sm font-medium text-[#8B72B5]">

          {/* ИКОНКА КАЛЕНДАРЯ */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect
              x="4"
              y="5"
              width="16"
              height="15"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />

            <path
              d="M8 3.5V7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            <path
              d="M16 3.5V7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            <path
              d="M4 9H20"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>

          <span>
            {selectedEntry.date === getLocalDateString(today)
              ? `Сегодня · ${selectedEntry.time}`
              : `${selectedEntry.date} · ${selectedEntry.time}`}
          </span>

        </div>

      </div>


      {/* СОДЕРЖИМОЕ ЗАПИСИ */}
      <div
  className={`diary-scroll mt-5 min-h-0 flex-1 pr-3 ${
    isEditMode ? "overflow-hidden" : "overflow-y-auto"
  }`}
>

{isEditMode ? (
  <textarea
    value={editEntryText}
    onChange={(e) => setEditEntryText(e.target.value)}
    className={`${
      isDeleteConfirmOpen ? "h-[140px]" : "h-[210px]"
    } w-full shrink-0 resize-none overflow-y-auto rounded-2xl border border-[#EEEAF5] bg-[#FEFDFE] p-4 text-base italic leading-7 text-[#344B91] outline-none transition focus:border-[#B7A8D6]`}
  />
) : (
  <div>

{/* ОСНОВНОЙ ТЕКСТ */}
<div>

  <p className="whitespace-pre-wrap text-sm italic leading-6 text-[#42547E]">
    {selectedEntry.text || "Сегодня я просто хочу быть."}
  </p>

</div>


{/* КАК Я СЕБЯ ЧУВСТВУЮ */}
{selectedEntry.reflection &&
  Object.values(selectedEntry.reflection).some(
    (value) => value.trim() !== ""
  ) && (
    <div className="mt-4 border-t border-[#EEEAF5] pt-4">

      {/* ЗАГОЛОВОК + ТЕГИ + РЕКОМЕНДАЦИИ */}
      <div className="flex items-center justify-between gap-4">

        <p className="text-sm font-medium text-[#8B72B5]">
          Как я себя чувствую
        </p>

        <div className="flex items-center gap-2">

          {/* ТЕГИ */}
          {selectedEntry.tags &&
            selectedEntry.tags.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setShowTags((previous) => !previous)
                }
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-[#8B72B5] transition hover:bg-[#F5F2FA] hover:text-[#667CC9]"
                aria-label={
                  showTags
                    ? "Скрыть теги"
                    : "Показать теги"
                }
              >
                #
              </button>
            )}

        </div>

      </div>


      {/* РАСКРЫТЫЕ ТЕГИ */}
      {showTags &&
        selectedEntry.tags &&
        selectedEntry.tags.length > 0 && (
          <div className="mt-2 rounded-xl bg-[#F8F6FC] px-3 py-2">

            <div className="space-y-1">

              {selectedEntry.tags.map((tagId) => {
                const tag = tags.find(
                  (item) => item.id === tagId
                );

                if (!tag) {
                  return null;
                }

                return (
                  <p
                    key={tag.id}
                    className="text-xs text-[#6875A8]"
                  >
                    #{tag.title}
                  </p>
                );
              })}

            </div>

          </div>
        )}


      {/* ОТВЕТЫ */}
      <div className="mt-3 space-y-3">

        {selectedEntry.reflection.howIAm && (
          <div>

            <p className="text-xs text-[#8A94B1]">
              Как я сейчас?
            </p>

            <p className="mt-1 text-sm leading-5 text-[#566587]">
              {selectedEntry.reflection.howIAm}
            </p>

          </div>
        )}


        {selectedEntry.reflection.whatAffectedMe && (
          <div>

            <p className="text-xs text-[#8A94B1]">
              Что сегодня больше всего повлияло на моё состояние?
            </p>

            <p className="mt-1 text-sm leading-5 text-[#566587]">
              {selectedEntry.reflection.whatAffectedMe}
            </p>

          </div>
        )}


        {selectedEntry.reflection.body && (
          <div>

            <p className="text-xs text-[#8A94B1]">
              Что сейчас чувствует моё тело?
            </p>

            <p className="mt-1 text-sm leading-5 text-[#566587]">
              {selectedEntry.reflection.body}
            </p>

          </div>
        )}


        {selectedEntry.reflection.attention && (
          <div>

            <p className="text-xs text-[#8A94B1]">
              Где сейчас находится моё внимание?
            </p>

            <p className="mt-1 text-sm leading-5 text-[#566587]">
              {selectedEntry.reflection.attention}
            </p>

          </div>
        )}


        {selectedEntry.reflection.needs && (
          <div>

            <p className="text-xs text-[#8A94B1]">
              Что мне сейчас нужно больше всего?
            </p>

            <p className="mt-1 text-sm leading-5 text-[#566587]">
              {selectedEntry.reflection.needs}
            </p>

          </div>
        )}


        {selectedEntry.reflection.wish && (
          <div>

            <p className="text-xs text-[#8A94B1]">
              Что я хочу пожелать себе сегодня?
            </p>

            <p className="mt-1 text-sm leading-5 text-[#566587]">
              {selectedEntry.reflection.wish}
            </p>

          </div>
        )}

      </div>

    </div>
  )}

  </div>
)}

  </div>

{!isEditMode && (
  <div className="mt-5 flex shrink-0 items-center justify-between">

    {/* РЕКОМЕНДАЦИИ */}
    {selectedEntry.recommendation &&
    selectedEntry.recommendation.practices.length > 0 ? (
      <button
        type="button"
        onClick={() => {
          const recommendation = selectedEntry.recommendation;

if (!recommendation) {
  return;
}

setRecommendationSource({
  entryId: selectedEntry.id,
  beforeTags: [
    ...(selectedEntry.recommendationData?.manualTags ?? []),
    ...(selectedEntry.recommendationData?.reflectionTags ?? []),
    ...(selectedEntry.recommendationData?.detectedTags ?? []),
  ],
});

setSelectedEntry(null);
setRecommendationModal(recommendation);
        }}
        className="text-sm text-[#8A94B1] transition hover:text-[#667CC9]"
      >
        Рекомендации →
      </button>
    ) : (
      <div />
    )}

    {/* РЕДАКТИРОВАТЬ */}
    <button
      type="button"
      onClick={() => setIsEditMode(true)}
      className="rounded-xl px-4 py-2 text-sm text-[#8B72B5] transition hover:bg-[#F5F7FC] hover:text-[#526EBA]"
    >
      Редактировать
    </button>

  </div>
)}

      {/* КНОПКИ РЕДАКТИРОВАНИЯ */}
      {isEditMode && !isDeleteConfirmOpen && (
        <div className="mt-5 flex shrink-0 items-center justify-between gap-4">

          {/* УДАЛИТЬ */}
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="rounded-xl px-3 py-2 text-sm text-[#B79BB2] transition hover:bg-[#F7EFF5] hover:text-[#A98AA5]"
          >
            Удалить запись
          </button>


          <div className="flex items-center gap-3">

            {/* ОТМЕНА */}
            <button
              type="button"
              onClick={() => {
  setIsEditMode(false);
  setIsDeleteConfirmOpen(false);

  setEditEntryText(
    selectedEntry?.text ?? ""
  );
}}
              className="rounded-xl px-4 py-2 text-sm text-[#8B98B5] transition hover:bg-[#F5F7FC] hover:text-[#526EBA]"
            >
              Отмена
            </button>


            {/* СОХРАНИТЬ */}
            <button
              type="button"
              onClick={handleUpdateEntry}
              className="rounded-xl bg-[#526EBA] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#465FA8]"
            >
              Сохранить
            </button>

          </div>

        </div>
      )}


      {/* ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ */}
      {isDeleteConfirmOpen && (
        <div
  className={`mt-5 pr-3 ${
    isEditMode ? "shrink-0" : "min-h-0 flex-1 overflow-y-auto"
  }`}
>

          <p className="text-sm leading-6 text-[#526083]">
            Удаление этой записи может повлиять на рекомендации,
            связанные с этой рефлексией.
          </p>

          <div className="mt-4 flex items-center justify-end gap-3">

            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="rounded-xl px-4 py-2 text-sm text-[#8B98B5] transition hover:bg-white hover:text-[#526EBA]"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={() => handleDeleteEntry(selectedEntry.id)}
              className="rounded-xl bg-[#B79BB2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#A98AA5]"
            >
              Удалить
            </button>

          </div>

        </div>
      )}

    </div>
  </div>
)}

{/* МОДАЛЬНОЕ ОКНО ВСЕХ ЗАПИСЕЙ ДНЯ */}
{isDayEntriesOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B70]/20 px-6 backdrop-blur-[3px]"
    onClick={() => setIsDayEntriesOpen(false)}
  >
    <div
      className="relative flex max-h-[80vh] w-[620px] max-w-[calc(100vw-2rem)] flex-col rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(23,43,112,0.18)]"
      onClick={(e) => e.stopPropagation()}
    >

      {/* КРЕСТИК */}
      <button
        type="button"
        onClick={() => setIsDayEntriesOpen(false)}
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#8B98B5] transition hover:bg-[#F5F7FC] hover:text-[#526EBA]"
        aria-label="Закрыть"
      >
        ×
      </button>

      {/* ЗАГОЛОВОК */}
      <div className="shrink-0 border-b border-[#E5E2EF] pb-5 pr-10">

        <h3 className="text-xl font-semibold text-[#172B70]">
          Записи за {selectedDay} августа
        </h3>

        <p className="mt-2 text-sm text-[#8B98B5]">
          {selectedDateEntries.length}{" "}
          {selectedDateEntries.length === 1
            ? "запись"
            : selectedDateEntries.length < 5
              ? "записи"
              : "записей"}
        </p>

      </div>

      {/* СПИСОК ЗАПИСЕЙ */}
      <div className="diary-scroll mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">

        {selectedDateEntries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => {
  setIsDayEntriesOpen(false);
  setOpenedFromDayEntries(true);
  openEntry(entry, false);
}}
            className="w-full rounded-2xl border border-[#E8E8F2] bg-[#FBFCFE] p-4 text-left transition hover:bg-[#F5F7FC]"
          >

            <div className="flex items-start justify-between gap-4">

              <span className="text-xs font-medium text-[#8B72B5]">
                {entry.time}
              </span>

              {entry.reflection &&
                Object.values(entry.reflection).some(
                  (value) => value.trim() !== ""
                ) && (
                  <span className="text-[11px] text-[#8B72B5]">
                    Рефлексия
                  </span>
                )}

            </div>

            <p className="mt-2 line-clamp-2 text-sm italic leading-6 text-[#172B70]">
              {entry.text || "Сегодня я просто хочу быть."}
            </p>

          </button>
        ))}

      </div>

    </div>
  </div>
)}

{isRecommendationLoading && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 px-4 backdrop-blur-[3px]">

    <div className="recommendation-loading-modal w-full max-w-[360px] rounded-2xl border border-[#E0E2F0] bg-white px-8 py-8 text-center shadow-[0_18px_50px_rgba(54,63,110,0.16)]">

      <div className="mx-auto flex h-16 w-16 items-center justify-center">

        <div className="recommendation-heart relative h-12 w-12">

          <div className="absolute inset-0 flex items-center justify-center text-[46px] leading-none text-[#D8DCEC]">
            ♡
          </div>

          <div className="recommendation-heart-fill absolute inset-x-0 bottom-0 overflow-hidden">
            <div className="absolute bottom-0 left-0 flex h-12 w-12 items-center justify-center text-[46px] leading-none text-[#667CC9]">
              ♥
            </div>
          </div>

        </div>

      </div>

      <p className="mt-4 text-sm leading-6 text-[#6875A8]">
        Сейчас для Вас формируется рекомендация
      </p>

    </div>

  </div>
)}

{recommendationModal && !selectedPractice && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B70]/20 px-4 backdrop-blur-[3px]">

    <div className="recommendation-result-modal relative w-full max-w-[760px] rounded-[28px] border border-[#E0E2F0] bg-white px-8 py-8 shadow-[0_24px_70px_rgba(54,63,110,0.18)]">

      {/* ЗАКРЫТЬ */}
      <button
        type="button"
        onClick={() => {
          setRecommendationModal(null);
          setRecommendationSource(null);
        }}
        className="absolute right-5 top-4 text-2xl font-light text-[#8991B0] transition hover:text-[#626FA9]"
        aria-label="Закрыть"
      >
        ×
      </button>

          {/* ЗАГОЛОВОК */}
          <div className="pr-8">
            <h2 className="text-2xl font-medium text-[#626FA9]">
              {recommendationModal.type === "personal"
                ? "Практики, подобранные для Вас"
                : recommendationModal.type === "suggestive"
                  ? "Можно начать с этих практик"
                  : "Небольшая практика для паузы"}
            </h2>

            <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#7580A5]">
              {recommendationModal.type === "personal"
                ? "На основе Вашей записи мы подобрали практики, которые могут соответствовать тому, на что Вы обратили внимание."
                : recommendationModal.type === "suggestive"
                  ? "В записи пока недостаточно информации для более точного подбора. Поэтому мы предлагаем несколько практик, с которых можно начать."
                  : "Если сейчас не хочется подробно описывать своё состояние, можно просто выбрать одну из этих нейтральных практик."}
            </p>
          </div>

      {/* ПРАКТИКИ */}
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {recommendationModal.practices.map((practice) => (
<div
  key={practice.practiceId}
  className="flex flex-col overflow-hidden rounded-2xl border border-[#E4E5F0] bg-[#FAFAFD]"
>
  {practice.image && (
    <div className="aspect-[4/3] w-full overflow-hidden">
      <img
        src={practice.image}
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
  )}

  <div className="flex flex-1 flex-col px-4 pb-5 pt-3">

    <div>
      <p className="text-base font-medium leading-6 text-[#596B91]">
        {practice.title}
      </p>

      <p className="mt-1 text-sm text-[#9299B5]">
        {practice.duration}
      </p>
    </div>

    <div className="mt-auto pt-5">
      <button
        type="button"
        onClick={() => {
          openRecommendedPractice(practice.practiceId);
        }}
        className="text-sm font-medium text-[#667CC9] transition hover:text-[#596FB5]"
      >
        Начать практику →
      </button>
    </div>

  </div>
</div>

        ))}
      </div>

      {/* ДРУГОЙ ВЫБОР */}
      <div className="mt-6 text-center">
        <Link
          href="/meditations"
          className="text-sm font-medium text-[#667CC9] transition hover:text-[#596FB5]"
        >
          Мне хочется чего-то другого →
        </Link>
      </div>

            {/* ПОДСКАЗКА */}
      <p className="mt-4 text-center text-sm leading-6 text-[#858EAD]">
        К этим рекомендациям можно будет вернуться позже — они
        сохранятся в Дневнике состояний.
      </p>

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
    </main>
  );
}
