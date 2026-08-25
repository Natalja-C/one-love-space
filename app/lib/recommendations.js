import { categories } from "../data/meditations";

/* ================================================== */
/* ВЕСА РЕКОМЕНДАЦИЙ */
/* ================================================== */

const WEIGHTS = {
  manual: 3,
  reflection: 2,
  detected: 1,
  desired: 1,
};

const MIN_PERSONAL_SCORE = 3;
const MAX_RECOMMENDATIONS = 3;


/* ================================================== */
/* НЕЙТРАЛЬНЫЕ ПРАКТИКИ */
/* ================================================== */

const NEUTRAL_PRACTICES = [
  "Пауза на 3 минуты",
  "Один спокойный вдох",
  "Пять минут тишины",
  "Тело и дыхание",
];


/* ================================================== */
/* ВСЕ ПРАКТИКИ ОДНИМ МАССИВОМ */
/* ================================================== */

const allPractices = categories.flatMap((category) =>
  category.practices.map((practice) => ({
    ...practice,
    category: category.title,
  }))
);


/* ================================================== */
/* ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ */
/* ================================================== */

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function countMatches(sourceTags, practiceTags) {
  return unique(sourceTags).filter((tag) =>
    practiceTags.includes(tag)
  );
}


/* ================================================== */
/* ОЦЕНКА ПРАКТИК ПО НАШЕЙ ФОРМУЛЕ */
/* ================================================== */

function getScoredPractices({
  manualTags = [],
  reflectionTags = [],
  detectedTags = [],
  desiredTags = [],
}) {
  return allPractices
    .map((practice) => {
      const practiceTags = practice.tags ?? [];
      const practiceDesiredStates =
        practice.desiredStates ?? [];

      const manualMatches = countMatches(
        manualTags,
        practiceTags
      );

      const reflectionMatches = countMatches(
        reflectionTags,
        practiceTags
      );

      const detectedMatches = countMatches(
        detectedTags,
        practiceTags
      );

      const desiredMatches = countMatches(
        desiredTags,
        practiceDesiredStates
      );

      const score =
        manualMatches.length * WEIGHTS.manual +
        reflectionMatches.length * WEIGHTS.reflection +
        detectedMatches.length * WEIGHTS.detected +
        desiredMatches.length * WEIGHTS.desired;

      const matchedTags = unique([
        ...manualMatches,
        ...reflectionMatches,
        ...detectedMatches,
      ]);

      return {
        practice,
        score,

        matches: {
          manual: manualMatches,
          reflection: reflectionMatches,
          detected: detectedMatches,
          desired: desiredMatches,
        },

        matchedTags,
        matchedDesiredStates: desiredMatches,

        totalMatches:
          matchedTags.length + desiredMatches.length,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      /* Сначала — итоговая релевантность */
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      /* При равном score — больше совпадений */
      if (b.totalMatches !== a.totalMatches) {
        return b.totalMatches - a.totalMatches;
      }

      /* Длительность не влияет на релевантность */
      return 0;
    });
}


/* ================================================== */
/* ПЕРСОНАЛЬНАЯ РЕКОМЕНДАЦИЯ */
/* ================================================== */

export function getPersonalRecommendations({
  manualTags = [],
  reflectionTags = [],
  detectedTags = [],
  desiredTags = [],
  limit = MAX_RECOMMENDATIONS,
}) {
  const scoredPractices = getScoredPractices({
    manualTags,
    reflectionTags,
    detectedTags,
    desiredTags,
  });

  return scoredPractices
    .filter((item) => item.score >= MIN_PERSONAL_SCORE)
    .slice(0, limit);
}


/* ================================================== */
/* МЯГКИЕ РЕКОМЕНДАЦИИ ПО НЕБОЛЬШОЙ РЕФЛЕКСИИ */
/* ================================================== */

export function getSuggestiveRecommendations({
  reflectionTags = [],
  detectedTags = [],
  limit = MAX_RECOMMENDATIONS,
}) {
  const sourceTags = unique([
    ...reflectionTags,
    ...detectedTags,
  ]);

  if (sourceTags.length === 0) {
    return [];
  }

  const matchedPractices = allPractices
    .map((practice) => {
      const practiceTags = practice.tags ?? [];

      const matchedTags = countMatches(
        sourceTags,
        practiceTags
      );

      return {
        practice,
        matchedTags,
        totalMatches: matchedTags.length,
      };
    })
    .filter((item) => item.totalMatches > 0)
    .sort((a, b) => {
      if (b.totalMatches !== a.totalMatches) {
        return b.totalMatches - a.totalMatches;
      }

      return 0;
    });

  return matchedPractices.slice(0, limit);
}


/* ================================================== */
/* НЕЙТРАЛЬНЫЕ РЕКОМЕНДАЦИИ */
/* ================================================== */

export function getNeutralRecommendations(limit = 3) {
  const neutralPractices = allPractices.filter((practice) =>
    NEUTRAL_PRACTICES.includes(practice.title)
  );

  return neutralPractices.slice(
    0,
    Math.min(limit, neutralPractices.length)
  );
}


/* ================================================== */
/* ДОБОР НЕЙТРАЛЬНЫМИ ПРАКТИКАМИ */
/* ================================================== */

function fillWithNeutralPractices(
  recommendations,
  limit = MAX_RECOMMENDATIONS
) {
  if (recommendations.length >= limit) {
    return recommendations.slice(0, limit);
  }

  const selectedTitles = new Set(
    recommendations.map((item) =>
      item.practice
        ? item.practice.title
        : item.title
    )
  );

  const neutralPractices = getNeutralRecommendations(
    MAX_RECOMMENDATIONS
  ).filter(
    (practice) => !selectedTitles.has(practice.title)
  );

  const result = [...recommendations];

  for (const practice of neutralPractices) {
    if (result.length >= limit) {
      break;
    }

    result.push(practice);
  }

  return result;
}


/* ================================================== */
/* ОБЩАЯ ТОЧКА ВХОДА */
/* ================================================== */

/**
 * @param {{
 *   manualTags?: string[],
 *   reflectionTags?: string[],
 *   detectedTags?: string[],
 *   desiredTags?: string[],
 *   limit?: number
 * }} [params]
 */

export function getRecommendations({
  manualTags = [],
  reflectionTags = [],
  detectedTags = [],
  desiredTags = [],
  limit = MAX_RECOMMENDATIONS,
} = {}) {
  const hasPersonalData =
    manualTags.length > 0 ||
    reflectionTags.length > 0 ||
    detectedTags.length > 0 ||
    desiredTags.length > 0;


  /* ---------------------------------------------- */
  /* ДАННЫХ НЕТ — НЕЙТРАЛЬНЫЕ ПРАКТИКИ */
  /* ---------------------------------------------- */

  if (!hasPersonalData) {
    return {
      type: "neutral",
      recommendations: getNeutralRecommendations(limit),
    };
  }


  /* ---------------------------------------------- */
  /* СЧИТАЕМ ВСЕ СОВПАДЕНИЯ,
     ВКЛЮЧАЯ SCORE 1–2 */
  /* ---------------------------------------------- */

  const scoredPractices = getScoredPractices({
    manualTags,
    reflectionTags,
    detectedTags,
    desiredTags,
  });


  /* ---------------------------------------------- */
  /* СОВПАДЕНИЙ НЕТ — НЕЙТРАЛЬНЫЕ ПРАКТИКИ */
  /* ---------------------------------------------- */

  if (scoredPractices.length === 0) {
    return {
      type: "neutral",
      recommendations: getNeutralRecommendations(limit),
    };
  }


  /* ---------------------------------------------- */
  /* ЕСТЬ ЛИ ХОТЯ БЫ ОДНО СИЛЬНОЕ СОВПАДЕНИЕ */
  /* ---------------------------------------------- */

  const hasStrongMatch = scoredPractices.some(
    (item) => item.score >= MIN_PERSONAL_SCORE
  );


  /* ---------------------------------------------- */
  /* БЕРЁМ ДО ТРЁХ ЛУЧШИХ ПРАКТИК,
     ВКЛЮЧАЯ БОЛЕЕ МЯГКИЕ SCORE 1–2 */
  /* ---------------------------------------------- */

  const selectedRecommendations =
    scoredPractices.slice(0, limit);


  /* ---------------------------------------------- */
  /* ЕСЛИ СОВПАДЕНИЙ МЕНЬШЕ ТРЁХ —
     ДОБИРАЕМ НЕЙТРАЛЬНЫМИ ПРАКТИКАМИ */
  /* ---------------------------------------------- */

  const completedRecommendations =
    fillWithNeutralPractices(
      selectedRecommendations,
      limit
    );


  /* ---------------------------------------------- */
  /* ТИП ПОДАЧИ */
  /* ---------------------------------------------- */

  return {
    type: hasStrongMatch
      ? "personal"
      : "suggestive",

    recommendations: completedRecommendations,
  };
}