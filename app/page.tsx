"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categories } from "./data/meditations";
import PracticeModal from "./components/PracticeModal";
import PracticePlayer from "./components/PracticePlayer";
import { tags } from "./data/tags";
import { getRecommendations } from "./lib/recommendations";
import { useRouter } from "next/navigation";
import {
  getUserStorageKey,
  isAuthenticated,
} from "./components/auth";

const formatTime = (time: number) => {
  if (!time || !Number.isFinite(time)) {
    return "0:00";
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const DIARY_KEY = "oneLoveSpaceDiaryEntries";

const getLocalDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const getTagsFromText = (text: string) => {
  const normalizedText = text.toLowerCase();

  return tags
    .filter((tag) => {
      const terms = [tag.title, ...tag.relatedTerms];

      return terms.some((term) =>
        normalizedText.includes(term.toLowerCase())
      );
    })
    .map((tag) => tag.id);
};

type HomeRecommendationPractice = {
  practiceId: string;
  title: string;
  duration: string;
  image?: string;
};

type HomeRecommendation = {
  type: "personal" | "suggestive" | "neutral";
  createdAt: string;
  practices: HomeRecommendationPractice[];
};

type StoredDiaryEntry = {
  id: string;
  date: string;
  time: string;
  recommendation?: HomeRecommendation;
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

export default function Home() {
  const router = useRouter();

  useEffect(() => {
  if (!isAuthenticated()) {
    router.replace("/welcome");
  }
  }, [router]);
  const allPractices = categories.flatMap(
  (category) => category.practices
  );
  const [recommendedPractices, setRecommendedPractices] =
  useState<typeof allPractices>([]);

  const [selectedPractice, setSelectedPractice] =
  useState<
    | ((typeof allPractices)[number] & {
        diaryEntryId?: string | null;
        beforeTags?: string[];
      })
    | null
  >(null);
  
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isHomeVisible, setIsHomeVisible] = useState(false);

const audioRef = useRef(null);
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

const [homeDiaryText, setHomeDiaryText] = useState("");
const [homeDiarySaved, setHomeDiarySaved] = useState(false);
const [homeSelectedTags, setHomeSelectedTags] = useState<string[]>([]);
const [homeTagPickerOpen, setHomeTagPickerOpen] = useState(false);
const [homeQuestionsOpen, setHomeQuestionsOpen] = useState(false);

const [latestRecommendation, setLatestRecommendation] =
  useState<HomeRecommendation | null>(null);

const [latestRecommendationDate, setLatestRecommendationDate] =
  useState<string | null>(null);

const [homeRecommendationModal, setHomeRecommendationModal] =
useState<HomeRecommendation | null>(null);

const [isRecommendationLoading, setIsRecommendationLoading] =
  useState(false);

useEffect(() => {
  const savedEntries = localStorage.getItem(
  getUserStorageKey(DIARY_KEY)
);

  if (!savedEntries) {
    setLatestRecommendation(null);
    setLatestRecommendationDate(null);
    return;
  }

  try {
    const entries: StoredDiaryEntry[] =
      JSON.parse(savedEntries);

    const latestEntryWithRecommendation = [...entries]
      .filter(
        (entry) =>
          entry.recommendation &&
          entry.recommendation.practices.length > 0
      )
      .sort((a, b) => {
        const dateA = new Date(
          `${a.date}T${a.time}`
        ).getTime();

        const dateB = new Date(
          `${b.date}T${b.time}`
        ).getTime();

        return dateB - dateA;
      })[0];

    if (!latestEntryWithRecommendation?.recommendation) {
      setLatestRecommendation(null);
      setLatestRecommendationDate(null);
      return;
    }

    setLatestRecommendation(
      latestEntryWithRecommendation.recommendation
    );

    setLatestRecommendationDate(
      latestEntryWithRecommendation.date
    );
  } catch (error) {
    console.error(
      "Не удалось загрузить рекомендации:",
      error
    );
  }
}, []);

const [recommendationSource, setRecommendationSource] = useState<{
  entryId: string;
  beforeTags: string[];
} | null>(null);

const [homeReflection, setHomeReflection] = useState({
  howIAm: "",
  whatAffectedMe: "",
  body: "",
  attention: "",
  needs: "",
  wish: "",
});

const [homeBodyOptions, setHomeBodyOptions] = useState<string[]>([]);
const [homeNeedsOptions, setHomeNeedsOptions] = useState<string[]>([]);

const [homeOpenQuestion, setHomeOpenQuestion] = useState<string | null>(null);
const [homeAnsweredQuestions, setHomeAnsweredQuestions] = useState<string[]>([]);

const chooseRandomPractices = () => {
  const shuffled = [...allPractices].sort(
    () => Math.random() - 0.5
  );

  setRecommendedPractices(shuffled.slice(0, 4));
};

useEffect(() => {
  chooseRandomPractices();
}, []);

useEffect(() => {
  const shouldAnimate = sessionStorage.getItem("animateHome");

  if (shouldAnimate === "true") {
    sessionStorage.removeItem("animateHome");
    setIsHomeVisible(true);
    return;
  }

  setIsHomeVisible(true);
}, []);

const handleHomeDiarySave = () => {
  const now = new Date();

  let previousEntries = [];

  const storedEntries = localStorage.getItem(
  getUserStorageKey(DIARY_KEY)
);

  if (storedEntries) {
    try {
      previousEntries = JSON.parse(storedEntries);
    } catch {
      previousEntries = [];
    }
  }

const savedReflection = {
  ...homeReflection,

  body: [
    homeReflection.body.trim(),
    homeBodyOptions.join(", "),
  ]
    .filter(Boolean)
    .join(" · "),

  needs: [
    homeReflection.needs.trim(),
    homeNeedsOptions.join(", "),
  ]
    .filter(Boolean)
    .join(" · "),
};

const manualTags = [...homeSelectedTags];

const reflectionTags =
  getReflectionTagsFromOptions(homeBodyOptions);

const desiredTags =
  getDesiredTagsFromOptions(homeNeedsOptions);

/*
  Здесь анализируем только свободный текст.
  Не подмешиваем выбранные кнопками body/needs повторно,
  чтобы один сигнал не получил двойной вес.
*/
const detectedTags = getTagsFromText(
  [
    homeDiaryText,
    homeReflection.howIAm,
    homeReflection.whatAffectedMe,
    homeReflection.body,
  ]
    .filter(Boolean)
    .join(" ")
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

const savedRecommendation: HomeRecommendation = {
  type: recommendationResult.type as HomeRecommendation["type"],
  createdAt: now.toISOString(),

  practices: recommendationResult.recommendations.map(
    (item: any) => {
      const practice = item.practice ?? item;

      return {
        practiceId: practice.id,
        title: practice.title,
        duration: practice.duration,
        image: practice.image,
      };
    }
  ),
};

  const newEntry = {
  id: `${now.getTime()}`,

  date: getLocalDateString(now),

  time: now.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }),

  text: homeDiaryText.trim(),

  reflection: savedReflection,

  tags: allEntryTags,

  recommendationData: {
    manualTags,
    reflectionTags,
    detectedTags,
    desiredTags,
  },

  recommendation: savedRecommendation,
};

setRecommendationSource({
  entryId: newEntry.id,
  beforeTags: [
    ...manualTags,
    ...reflectionTags,
    ...detectedTags,
  ],
});

  localStorage.setItem(
  getUserStorageKey(DIARY_KEY),
  JSON.stringify([...previousEntries, newEntry])
);

  setHomeDiaryText("");
  setHomeSelectedTags([]);
  setHomeTagPickerOpen(false);
  setIsRecommendationLoading(true);
setTimeout(() => {
  setLatestRecommendation(savedRecommendation);
  setLatestRecommendationDate(newEntry.date);

  setIsRecommendationLoading(false);
  setHomeRecommendationModal(savedRecommendation);
}, 4000);
  setHomeReflection({
  howIAm: "",
  whatAffectedMe: "",
  body: "",
  attention: "",
  needs: "",
  wish: "",
});

setHomeBodyOptions([]);
setHomeNeedsOptions([]);
setHomeAnsweredQuestions([]);
setHomeOpenQuestion(null);
setHomeQuestionsOpen(false);
};


const toggleHomeTag = (tagId: string) => {
  setHomeSelectedTags((previousTags) =>
    previousTags.includes(tagId)
      ? previousTags.filter((id) => id !== tagId)
      : [...previousTags, tagId]
  );
};

const toggleHomeQuestion = (questionId: string) => {
  setHomeOpenQuestion((previous) =>
    previous === questionId ? null : questionId
  );
};

const completeHomeQuestion = (questionId: string) => {
  setHomeAnsweredQuestions((previous) =>
    previous.includes(questionId)
      ? previous
      : [...previous, questionId]
  );

  setHomeOpenQuestion(null);
};

const skipHomeQuestion = (questionId: string) => {
  setHomeAnsweredQuestions((previous) =>
    previous.filter((id) => id !== questionId)
  );

  setHomeReflection((previous) => {
    switch (questionId) {
      case "howIAm":
        return { ...previous, howIAm: "" };
      case "whatAffectedMe":
        return { ...previous, whatAffectedMe: "" };
      case "body":
        return { ...previous, body: "" };
      case "attention":
        return { ...previous, attention: "" };
      case "needs":
        return { ...previous, needs: "" };
      case "wish":
        return { ...previous, wish: "" };
      default:
        return previous;
    }
  });

  if (questionId === "body") {
    setHomeBodyOptions([]);
  }

  if (questionId === "needs") {
    setHomeNeedsOptions([]);
  }

  setHomeOpenQuestion(null);
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
    <main
  className={`min-h-screen bg-[#F5F7FC] pb-24 text-[#172B70] transition-opacity duration-[1000ms] ${
    isHomeVisible ? "opacity-100" : "opacity-0"
  }`}
>

      
      {/* ОСНОВНАЯ ОБЛАСТЬ */}
      <div className="mx-auto max-w-6xl px-6 py-10">


        {/* ДНЕВНИК + РЕКОМЕНДАЦИИ */}
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">


          {/* ДНЕВНИК СОСТОЯНИЙ */}
          <div
            id="diary"
            className="relative overflow-hidden rounded-3xl border border-[#D9E1F0] bg-[#E7F0FC] p-8 shadow-[0_4px_16px_rgba(23,43,112,0.12)]"
          >

            <div className="relative z-10">


              {/* КРАСИВЫЙ ЗАГОЛОВОК ДНЕВНИКА */}
              <div className="mb-7 flex justify-center">

                <img
                  src="/diary-title.png"
                  alt="Дневник состояний"
                  className="h-auto w-[360px] max-w-full"
                />

              </div>


              <h1 className="mb-5 text-xl font-medium text-[#172B70]">
                Что со мной сейчас происходит?
              </h1>


              <p className="mb-4 text-sm leading-6 text-[#6875A8]">

                <span className="font-medium text-[#172B70]">
                  Здесь можно оставить всё, чем хочется поделиться:
                </span>{" "}

                несколько слов, мысль, эмоцию или просто отметить своё состояние.

              </p>


              <textarea
                value={homeDiaryText}
                onChange={(event) => setHomeDiaryText(event.target.value)}
                className="min-h-36 w-full resize-none rounded-2xl border border-[#D9E1F0] bg-white p-5 text-base text-[#172B70] outline-none placeholder:text-[#8B98B5] focus:border-[#3E63B8]"
                placeholder="Напишите всё, чем хочется поделиться..."
              />


              {/* ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ */}
              <div className="mt-5 flex flex-wrap items-center gap-4">

  <button
  type="button"
  onClick={() => setHomeQuestionsOpen((previous) => !previous)}
  className="rounded-xl border border-[#D3DFF1] bg-[#DFEAF8] px-4 py-2.5 text-sm font-medium text-[#3E63B8] transition hover:bg-[#D7E4F5]"
>
  Мне проще ответить на вопросы
</button>

  <button
  type="button"
  onClick={() => setHomeTagPickerOpen((previous) => !previous)}
  className="rounded-xl border border-[#D3DFF1] bg-[#DFEAF8] px-4 py-2.5 text-sm font-medium text-[#3E63B8] transition hover:bg-[#D7E4F5]"
>
  Выбрать тег
</button>

</div>

{homeTagPickerOpen && (
  <div className="mt-4 rounded-2xl bg-white/60 p-4">

    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = homeSelectedTags.includes(tag.id);

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleHomeTag(tag.id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              isSelected
                ? "border-[#B9AAD4] bg-[#EDE7F6] text-[#6F5A95]"
                : "border-[#D9E1F0] bg-white text-[#6875A8] hover:bg-[#F5F7FC]"
            }`}
          >
            #{tag.title}
          </button>
        );
      })}
    </div>

  </div>
)}

{/* КОМПАКТНАЯ РЕФЛЕКСИЯ НА ГЛАВНОЙ */}
{homeQuestionsOpen && (
  <div className="mt-4 rounded-2xl border border-[#D9E1F0] bg-white/70 px-5 py-4">

    <div className="mb-3">
      <p className="text-sm font-medium text-[#172B70]">
        Небольшая рефлексия
      </p>

      <p className="mt-1 text-xs leading-5 text-[#6875A8]">
        Можно ответить только на те вопросы, которые откликаются сейчас.
      </p>
    </div>


    {/* 1. КАК Я СЕЙЧАС */}
    <div className="border-t border-[#E8EBF3] py-2">

      <button
        type="button"
        onClick={() => toggleHomeQuestion("howIAm")}
        className="flex w-full items-center justify-between py-1.5 text-left"
      >
        <span className="text-sm text-[#172B70]">
          Как я сейчас?
        </span>

        {homeAnsweredQuestions.includes("howIAm") ? (
          <span className="text-xs text-[#667CC9]">✓</span>
        ) : (
          <span className="text-xs text-[#8B98B5]">Ответить</span>
        )}
      </button>

      {homeOpenQuestion === "howIAm" && (
        <div className="pb-2 pt-1">

          <textarea
            value={homeReflection.howIAm}
            onChange={(event) =>
              setHomeReflection((previous) => ({
                ...previous,
                howIAm: event.target.value,
              }))
            }
            placeholder="Несколько слов или эмоция..."
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-white p-3 text-sm leading-5 text-[#172B70] outline-none placeholder:text-[#8B98B5] focus:border-[#9AA8D0]"
          />

          <div className="mt-2 flex justify-end gap-2">

            <button
              type="button"
              onClick={() => skipHomeQuestion("howIAm")}
              className="px-3 py-1.5 text-xs text-[#8B98B5]"
            >
              Пропустить
            </button>

            <button
              type="button"
              onClick={() => {
                if (homeReflection.howIAm.trim() !== "") {
                  completeHomeQuestion("howIAm");
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#667CC9] text-xs text-white"
            >
              ✓
            </button>

          </div>

        </div>
      )}

    </div>


    {/* 2. ЧТО ПОВЛИЯЛО */}
    <div className="border-t border-[#E8EBF3] py-2">

      <button
        type="button"
        onClick={() => toggleHomeQuestion("whatAffectedMe")}
        className="flex w-full items-center justify-between py-1.5 text-left"
      >
        <span className="text-sm text-[#172B70]">
          Что сегодня больше всего повлияло на моё состояние?
        </span>

        {homeAnsweredQuestions.includes("whatAffectedMe") ? (
          <span className="text-xs text-[#667CC9]">✓</span>
        ) : (
          <span className="text-xs text-[#8B98B5]">Ответить</span>
        )}
      </button>

      {homeOpenQuestion === "whatAffectedMe" && (
        <div className="pb-2 pt-1">

          <textarea
            value={homeReflection.whatAffectedMe}
            onChange={(event) =>
              setHomeReflection((previous) => ({
                ...previous,
                whatAffectedMe: event.target.value,
              }))
            }
            placeholder="Можно написать несколько слов..."
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-white p-3 text-sm leading-5 text-[#172B70] outline-none placeholder:text-[#8B98B5] focus:border-[#9AA8D0]"
          />

          <div className="mt-2 flex justify-end gap-2">

            <button
              type="button"
              onClick={() => skipHomeQuestion("whatAffectedMe")}
              className="px-3 py-1.5 text-xs text-[#8B98B5]"
            >
              Пропустить
            </button>

            <button
              type="button"
              onClick={() => {
                if (homeReflection.whatAffectedMe.trim() !== "") {
                  completeHomeQuestion("whatAffectedMe");
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#667CC9] text-xs text-white"
            >
              ✓
            </button>

          </div>

        </div>
      )}

    </div>


    {/* 3. ТЕЛО */}
    <div className="border-t border-[#E8EBF3] py-2">

      <button
        type="button"
        onClick={() => toggleHomeQuestion("body")}
        className="flex w-full items-center justify-between py-1.5 text-left"
      >
        <span className="text-sm text-[#172B70]">
          Что сейчас чувствует моё тело?
        </span>

        {homeAnsweredQuestions.includes("body") ? (
          <span className="text-xs text-[#667CC9]">✓</span>
        ) : (
          <span className="text-xs text-[#8B98B5]">Ответить</span>
        )}
      </button>

      {homeOpenQuestion === "body" && (
        <div className="pb-2 pt-1">

          <textarea
            value={homeReflection.body}
            onChange={(event) =>
              setHomeReflection((previous) => ({
                ...previous,
                body: event.target.value,
              }))
            }
            placeholder="Например: напряжение, усталость, лёгкость..."
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-white p-3 text-sm leading-5 text-[#172B70] outline-none placeholder:text-[#8B98B5] focus:border-[#9AA8D0]"
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

              const isSelected = homeBodyOptions.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setHomeBodyOptions((previous) =>
                      isSelected
                        ? previous.filter((item) => item !== option)
                        : [...previous, option]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    isSelected
                      ? "border-[#B9AAD4] bg-[#EEEAF7] text-[#526083]"
                      : "border-[#E0E6F2] bg-white text-[#6875A8]"
                  }`}
                >
                  {option}
                </button>
              );
            })}

          </div>

          <div className="mt-2 flex justify-end gap-2">

            <button
              type="button"
              onClick={() => skipHomeQuestion("body")}
              className="px-3 py-1.5 text-xs text-[#8B98B5]"
            >
              Пропустить
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  homeReflection.body.trim() !== "" ||
                  homeBodyOptions.length > 0
                ) {
                  completeHomeQuestion("body");
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#667CC9] text-xs text-white"
            >
              ✓
            </button>

          </div>

        </div>
      )}

    </div>


    {/* 4. ВНИМАНИЕ */}
    <div className="border-t border-[#E8EBF3] py-2">

      <button
        type="button"
        onClick={() => toggleHomeQuestion("attention")}
        className="flex w-full items-center justify-between py-1.5 text-left"
      >
        <span className="text-sm text-[#172B70]">
          Где сейчас находится моё внимание?
        </span>

        {homeAnsweredQuestions.includes("attention") ? (
          <span className="text-xs text-[#667CC9]">✓</span>
        ) : (
          <span className="text-xs text-[#8B98B5]">Ответить</span>
        )}
      </button>

      {homeOpenQuestion === "attention" && (
        <div className="pb-2 pt-1">

          <div className="flex flex-wrap gap-1.5">

            {[
              "В прошлом",
              "В будущем",
              "В настоящем",
              "Постоянно переключается",
              "Не знаю / сложно сказать",
            ].map((option) => {

              const isSelected =
                homeReflection.attention === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setHomeReflection((previous) => ({
                      ...previous,
                      attention: isSelected ? "" : option,
                    }))
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    isSelected
                      ? "border-[#B9AAD4] bg-[#EEEAF7] text-[#526083]"
                      : "border-[#E0E6F2] bg-white text-[#6875A8]"
                  }`}
                >
                  {option}
                </button>
              );
            })}

          </div>

          <div className="mt-2 flex justify-end gap-2">

            <button
              type="button"
              onClick={() => skipHomeQuestion("attention")}
              className="px-3 py-1.5 text-xs text-[#8B98B5]"
            >
              Пропустить
            </button>

            <button
              type="button"
              onClick={() => {
                if (homeReflection.attention !== "") {
                  completeHomeQuestion("attention");
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#667CC9] text-xs text-white"
            >
              ✓
            </button>

          </div>

        </div>
      )}

    </div>


    {/* 5. ПОТРЕБНОСТИ */}
    <div className="border-t border-[#E8EBF3] py-2">

      <button
        type="button"
        onClick={() => toggleHomeQuestion("needs")}
        className="flex w-full items-center justify-between py-1.5 text-left"
      >
        <span className="text-sm text-[#172B70]">
          Что мне сейчас нужно больше всего?
        </span>

        {homeAnsweredQuestions.includes("needs") ? (
          <span className="text-xs text-[#667CC9]">✓</span>
        ) : (
          <span className="text-xs text-[#8B98B5]">Ответить</span>
        )}
      </button>

      {homeOpenQuestion === "needs" && (
        <div className="pb-2 pt-1">

          <textarea
            value={homeReflection.needs}
            onChange={(event) =>
              setHomeReflection((previous) => ({
                ...previous,
                needs: event.target.value,
              }))
            }
            placeholder="Можно написать своими словами..."
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-white p-3 text-sm leading-5 text-[#172B70] outline-none placeholder:text-[#8B98B5] focus:border-[#9AA8D0]"
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

              const isSelected = homeNeedsOptions.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setHomeNeedsOptions((previous) =>
                      isSelected
                        ? previous.filter((item) => item !== option)
                        : [...previous, option]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    isSelected
                      ? "border-[#B9AAD4] bg-[#EEEAF7] text-[#526083]"
                      : "border-[#E0E6F2] bg-white text-[#6875A8]"
                  }`}
                >
                  {option}
                </button>
              );
            })}

          </div>

          <div className="mt-2 flex justify-end gap-2">

            <button
              type="button"
              onClick={() => skipHomeQuestion("needs")}
              className="px-3 py-1.5 text-xs text-[#8B98B5]"
            >
              Пропустить
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  homeReflection.needs.trim() !== "" ||
                  homeNeedsOptions.length > 0
                ) {
                  completeHomeQuestion("needs");
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#667CC9] text-xs text-white"
            >
              ✓
            </button>

          </div>

        </div>
      )}

    </div>


    {/* 6. ПОЖЕЛАНИЕ */}
    <div className="border-y border-[#E8EBF3] py-2">

      <button
        type="button"
        onClick={() => toggleHomeQuestion("wish")}
        className="flex w-full items-center justify-between py-1.5 text-left"
      >
        <span className="text-sm text-[#172B70]">
          Что я хочу пожелать себе сегодня?
        </span>

        {homeAnsweredQuestions.includes("wish") ? (
          <span className="text-xs text-[#667CC9]">✓</span>
        ) : (
          <span className="text-xs text-[#8B98B5]">Ответить</span>
        )}
      </button>

      {homeOpenQuestion === "wish" && (
        <div className="pb-2 pt-1">

          <textarea
            value={homeReflection.wish}
            onChange={(event) =>
              setHomeReflection((previous) => ({
                ...previous,
                wish: event.target.value,
              }))
            }
            placeholder="Несколько слов для себя..."
            className="min-h-16 w-full resize-none rounded-xl border border-[#E1E4F0] bg-white p-3 text-sm leading-5 text-[#172B70] outline-none placeholder:text-[#8B98B5] focus:border-[#9AA8D0]"
          />

          <div className="mt-2 flex justify-end gap-2">

            <button
              type="button"
              onClick={() => skipHomeQuestion("wish")}
              className="px-3 py-1.5 text-xs text-[#8B98B5]"
            >
              Пропустить
            </button>

            <button
              type="button"
              onClick={() => {
                if (homeReflection.wish.trim() !== "") {
                  completeHomeQuestion("wish");
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#667CC9] text-xs text-white"
            >
              ✓
            </button>

          </div>

        </div>
      )}

    </div>


    {/* СВЕРНУТЬ */}
    <div className="mt-3">

      <button
        type="button"
        onClick={() => {
          setHomeQuestionsOpen(false);
          setHomeOpenQuestion(null);
        }}
        className="text-xs text-[#8B98B5] transition hover:text-[#526EBA]"
      >
        Свернуть рефлексию
      </button>

    </div>

  </div>
)}

              {/* СОХРАНИТЬ */}
              <div className="mt-2 flex justify-end">

                <button
                type="button"
                 onClick={handleHomeDiarySave}
                className="rounded-xl bg-[#172B70]/92 px-7 py-3 font-medium text-white transition hover:bg-[#3E63B8]">
                  Сохранить запись
                </button>

              </div>

            </div>

          </div>


          {/* РЕКОМЕНДАЦИИ */}
          <div
            id="recommendations"
            className="rounded-3xl border border-[#D9E1F0] bg-white p-5 shadow-sm"
          >

            {/* ЗАГОЛОВОК */}
            <div className="mb-3 flex items-center gap-2">

              <h2 className="text-xl font-semibold text-[#172B70]">
                Рекомендации для Вас
              </h2>

              <img
                src="/little-leaf.png"
                alt=""
                aria-hidden="true"
                className="h-9 w-auto opacity-100"
              />

            </div>

{latestRecommendation &&
latestRecommendation.practices.length > 0 ? (
  <>

    <p className="mb-4 text-sm leading-5 text-[#7580A5]">
      Последние рекомендации на основе Вашей рефлексии
      {latestRecommendationDate && (
        <>
          {" "}от{" "}
          {new Date(
            `${latestRecommendationDate}T00:00:00`
          ).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
          })}
        </>
      )}
    </p>


    {/* ТРИ ПОСЛЕДНИЕ РЕКОМЕНДАЦИИ */}
    <div className="space-y-4">

{latestRecommendation.practices.map((practice) => (
  <div
    key={practice.practiceId}
    className="flex min-h-[126px] items-center gap-4 rounded-2xl border border-[#E4E7F0] bg-[#F8F9FC] p-4"
  >

    {practice.image && (
      <img
        src={practice.image}
        alt=""
        className="h-[82px] w-[108px] shrink-0 rounded-xl object-cover"
      />
    )}

    <div className="flex min-w-0 flex-1 flex-col">

      <h3 className="text-sm font-medium leading-5 text-[#172B70]">
        {practice.title}
      </h3>

      <p className="mt-1 text-xs text-[#7580A5]">
        Медитация · {practice.duration}
      </p>

      <button
        type="button"
        onClick={() =>
          openRecommendedPractice(practice.practiceId)
        }
        className="mt-3 w-fit text-xs font-medium text-[#667CC9] transition hover:text-[#526EBA]"
      >
        Перейти к практике →
      </button>

    </div>

  </div>
))}

    </div>

  </>
) : (

  <div className="rounded-2xl bg-[#F8F9FC] px-4 py-4">

    <p className="text-sm leading-6 text-[#7580A5]">
      Здесь появятся практики, которые могут откликнуться
      на Ваши записи в Дневнике состояний.
    </p>

  </div>

)}

          </div>

        </section>


{/* НЕСКОЛЬКО ДОСТУПНЫХ МЕДИТАЦИЙ */}

<div className="mt-16 mb-3 flex items-end justify-between">

  <h2 className="text-xl font-medium text-[#172B70]">
    Возможно, сейчас Вам захочется выбрать:
  </h2>

<button
  onClick={chooseRandomPractices}
  className="flex items-center gap-2 rounded-full border border-[#D9E1F0] bg-[#F5F7FC] px-3.5 py-1.5 text-[13px] font-medium text-[#3E63B8] shadow-sm transition hover:bg-[#E5ECF8] hover:text-[#172B70]"
>
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M20 11A8 8 0 0 0 6.34 5.34L4 8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 4V8H8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 13A8 8 0 0 0 17.66 18.66L20 16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 20V16H16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>

  <span>Обновить выбор</span>
</button>

</div>

<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

  {recommendedPractices.map((practice) => (
    <MeditationCard
      key={practice.title}
      image={practice.image}
      title={practice.title}
      duration={practice.duration}
      shortDescription={practice.shortDescription}
      onOpen={() => setSelectedPractice(practice)}
    />
  ))}

</div>

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

{/* ВСЕ МЕДИТАЦИИ */}
<section
  id="all-meditations"
  className="relative mt-12 overflow-hidden rounded-3xl border border-[#D9E1F0] bg-white px-8 py-6 shadow-sm"
>

  {/* ДЕКОРАТИВНАЯ ВЕТОЧКА */}
  <img
    src="/meditations-card-branch.svg"
    alt=""
    aria-hidden="true"
    className="pointer-events-none absolute bottom-[-18px] right-[-30px] w-[520px] opacity-60"
  />

  {/* СОДЕРЖИМОЕ */}
  <div className="relative z-10 max-w-[720px]">

    <h2 className="mb-3 text-3xl font-semibold text-[#172B70]">
      Все медитации
    </h2>

    <p className="mb-5 leading-7 text-[#596B91]">
      Здесь собраны медитации и практики осознанности, которые могут стать
      небольшим пространством для паузы, внимания к себе и своему состоянию.
    </p>

    <Link
      href="/meditations"
      className="inline-block rounded-xl bg-[#E9F0FC] px-6 py-3 font-medium text-[#3E63B8] transition hover:bg-[#D9E1F0]"
    >
      Перейти к медитациям →
    </Link>

  </div>

</section>


       {/* О ONE LOVE SPACE */}
<section
  id="about"
  className="mt-12 overflow-hidden rounded-3xl border border-[#D9E1F0] bg-white p-8 shadow-sm"
>
  <div className="mx-auto max-w-4xl">

{/* ЛОГОТИП И НАЗВАНИЕ */}
<div className="mb-9 flex flex-col items-center pt-4">

  <img
    src="/one-love-space-logo-about-us.svg"
    alt=""
    aria-hidden="true"
    className="h-auto w-[68px] opacity-75"
  />

  <h2 className="mt-3 text-3xl font-medium text-[#626FA9]">
    One Love Space
  </h2>

</div>

  {/* ТЕКСТ */}
  <div className="mt-7 space-y-5 text-base leading-7 text-[#596B91]">

    <p>
      One Love Space — пространство, в котором можно остановиться
      и немного внимательнее услышать себя.
    </p>

   <p>
  В разные периоды жизни нам могут быть нужны разные способы поддержать
  себя. Медитация может стать одним из них — не способом изменить всё
  вокруг или прийти к какому-то идеальному состоянию, а возможностью
  немного лучше слышать себя, замечать то, что обычно остаётся без
  внимания, и постепенно находить собственные способы справляться,
  принимать и отпускать. One Love Space создан как пространство,
  к которому можно возвращаться и находить в нём время для себя.
</p>

<p>
  Практика не обязательно должна быть долгой, чтобы иметь значение.
  Несколько минут, которые действительно находят место в повседневной
  жизни, могут оказаться ценнее редких попыток дождаться идеального
  момента для получасовой медитации. Постепенно практика может становиться
  естественной частью жизни — помогать внимательнее относиться к
  собственному опыту, быть немного бережнее к себе и замечать те
  небольшие вещи, которые легко теряются в повседневности. Поэтому
  в One Love Space есть разные практики, в том числе совсем короткие —
  чтобы каждый мог найти подходящий для себя формат и ритм.
</p>

<p>
  Мы не всегда можем сразу понять, что именно нам сейчас нужно.
  Поэтому записи в дневнике One Love Space могут стать чуть больше,
  чем просто способом сохранить свои мысли. Система рекомендаций
  опирается на состояние, которое отражается в Ваших словах, и мягко
  предлагает практики, которые могут оказаться подходящими. А что
  выбрать и к чему прислушаться — всегда остаётся за Вами.
</p>

  </div>

</div>

    {/* ФИНАЛЬНАЯ ФРАЗА */}
    <div className="mt-12 text-center">

      <p className="font-[family-name:var(--font-cormorant)] text-[28px] font-medium leading-9 text-[#526EBA]">
        One Love Space — это не место, куда нужно успеть.
        <br />
        Это место, куда можно возвращаться.
      </p>

    </div>


    {/* АВТОР */}
    <div className="mt-12 border-t border-[#E8EBF3] pt-10">

      <div className="flex flex-col gap-8 md:flex-row md:items-start">

        {/* ФОТО */}
        <div className="shrink-0">
          <img
            src="/natalja-author.jpg"
            alt="Наталья Ч."
            className="h-40 w-40 rounded-3xl object-cover shadow-sm"
          />
        </div>


        {/* ЦИТАТА */}
        <div className="min-w-0 flex-1">

          <div className="space-y-4 font-[family-name:var(--font-cormorant)] text-[20px] font-light italic leading-8 text-[#344B91]">

            <p>
              «Я создала этот проект как часть своей дипломной работы
              в институте. Изучая информационные технологии, я не могла
              и представить, что на последнем году учёбы параллельно начну
              учиться на преподавателя практик осознанности и именно благодаря
              этому родится идея создания One Love Space — пространства заботы
              о себе!
            </p>

            <p>
              Здесь я собрала всё то, чего мне самой не хватало в работе
              с платформами для медитаций. Здесь родилось личное пространство
              My Fullness, которое стало сердцем проекта и местом, где можно
              заметить, как регулярная практика отражается на состоянии
              и меняет его с течением времени.
            </p>

            <p>
              Если этот проект поможет хотя бы одному человеку чуть лучше
              понять себя, то всё это было не зря!»
            </p>

          </div>


          {/* ПОДПИСЬ */}
          <div className="mt-6 font-[family-name:var(--font-cormorant)] text-[#596B91]">

            <p className="text-lg">
              Наталья Ч.
            </p>

            <p className="mt-1 text-base font-[family-name:var(--font-cormorant)]">
              преподаватель практик осознанности (mindfulness),
              автор One Love Space
            </p>

          </div>

        </div>

      </div>

  </div>
</section>

      </div>

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

{homeRecommendationModal && !selectedPractice && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B70]/20 px-4 backdrop-blur-[3px]">

    <div className="recommendation-result-modal relative w-full max-w-[760px] rounded-[28px] border border-[#E0E2F0] bg-white px-8 py-8 shadow-[0_24px_70px_rgba(54,63,110,0.18)]">

      {/* ЗАКРЫТЬ */}
      <button
        type="button"
        onClick={() => setHomeRecommendationModal(null)}
        className="absolute right-5 top-4 text-2xl font-light text-[#8991B0] transition hover:text-[#626FA9]"
        aria-label="Закрыть"
      >
        ×
      </button>


      {/* ЗАГОЛОВОК */}
      <div className="pr-8">

        <h2 className="text-2xl font-medium text-[#626FA9]">
          {homeRecommendationModal.type === "personal"
            ? "Практики, подобранные для Вас"
            : homeRecommendationModal.type === "suggestive"
              ? "Можно начать с этих практик"
              : "Небольшая практика для паузы"}
        </h2>

        <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#7580A5]">
          {homeRecommendationModal.type === "personal"
            ? "На основе Вашей записи мы подобрали практики, которые могут соответствовать тому, на что Вы обратили внимание."
            : homeRecommendationModal.type === "suggestive"
              ? "В записи пока недостаточно информации для более точного подбора. Поэтому мы предлагаем несколько практик, с которых можно начать."
              : "Если сейчас не хочется подробно описывать своё состояние, можно просто выбрать одну из этих нейтральных практик."}
        </p>

      </div>


      {/* ПРАКТИКИ */}
      <div className="mt-6 grid gap-3 md:grid-cols-3">

        {homeRecommendationModal.practices.map((practice) => (

          <div
            key={practice.practiceId}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#E4E5F0] bg-[#FAFAFD]"
          >

            {practice.image && (
              <div className="h-28 w-full overflow-hidden">

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

              <div className="mt-auto pt-4">

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
        Запись и эти рекомендации сохранятся в Дневнике состояний —
        к ним можно будет вернуться позже.
      </p>

    </div>

  </div>
)}

    </main>
  );
}


/* КАРТОЧКА МЕДИТАЦИИ */
function MeditationCard({
  image,
  title,
  duration,
  shortDescription,
  onOpen,
}: {
  image: string;
  title: string;
  duration: string;
  shortDescription: string;
  onOpen: () => void;
}) {

  return (

    <div className="overflow-hidden rounded-3xl border border-[#D9E1F0] bg-white shadow-sm">

<div className="h-44 w-full overflow-hidden bg-[#E9F0FC]">
  <img
    src={image}
    alt=""
    className="h-full w-full object-cover"
  />
</div>

      <div className="p-5">

        <h3 className="font-semibold text-[#172B70]">
          {title}
        </h3>

        <p className="mt-2 text-sm text-[#60739B]">
          Медитация · {duration}
        </p>
        <p className="mt-3 min-h-[60px] text-sm leading-5 text-[#596B91]">
  {shortDescription}
</p>

<button 
onClick={onOpen}
className="mt-4 rounded-xl bg-[#E9F0FC] px-4 py-2 text-sm font-medium text-[#3E63B8] transition hover:bg-[#D9E1F0]">
  Перейти →
</button>

      </div>

    </div>

  );

}