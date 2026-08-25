"use client";

import { useEffect, useRef, useState } from "react";
import { tags } from "../data/tags";
import { categories } from "../data/meditations";
import PracticePlayer from "../components/PracticePlayer";
import { getUserStorageKey } from "../components/auth";

export default function Fullness() {

  const allPractices = categories.flatMap(
  (category) => category.practices
);

const [selectedPractice, setSelectedPractice] =
  useState(null);

const [isPlayerOpen, setIsPlayerOpen] = useState(false);

const audioRef = useRef(null);

const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

useEffect(() => {
  if (!isPlayerOpen || !audioRef.current) return;

  audioRef.current.currentTime = 0;
  setCurrentTime(0);
  setIsPlaying(false);
  setDuration(0);
}, [isPlayerOpen]);

const formatTime = (time) => {
  if (!time || !Number.isFinite(time)) {
    return "0:00";
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const [practiceHistory, setPracticeHistory] = useState([]);
const [pathPeriod, setPathPeriod] = useState("month");
const [selectedPathMonth, setSelectedPathMonth] = useState(() => {
  const date = new Date();

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  };
});
const [diaryEntries, setDiaryEntries] = useState([]);
const [selectedDiaryEntry, setSelectedDiaryEntry] =
  useState(null);

const [historyMonth, setHistoryMonth] = useState(
  new Date().getMonth()
);

const [historyYear, setHistoryYear] = useState(
  new Date().getFullYear()
);

const [expandedHistoryId, setExpandedHistoryId] =
  useState(null);

useEffect(() => {
  const storedHistory = localStorage.getItem(
  getUserStorageKey("oneLoveSpacePracticeHistory")
);

  if (storedHistory) {
    try {
      const parsedHistory = JSON.parse(storedHistory);

      if (Array.isArray(parsedHistory)) {
        setPracticeHistory(parsedHistory);
      }
    } catch {
      setPracticeHistory([]);
    }
  }

  const storedDiaryEntries = localStorage.getItem(
  getUserStorageKey("oneLoveSpaceDiaryEntries")
);

  if (storedDiaryEntries) {
    try {
      const parsedDiaryEntries = JSON.parse(storedDiaryEntries);

      if (Array.isArray(parsedDiaryEntries)) {
        setDiaryEntries(parsedDiaryEntries);
      }
    } catch {
      setDiaryEntries([]);
    }
  }
}, []);

const now = new Date();

const threeMonthsAgo = new Date(
  now.getFullYear(),
  now.getMonth() - 2,
  1
);

const totalListenedSeconds = practiceHistory
  .filter((entry) => {
    const completedAt = new Date(entry.completedAt);

    return completedAt >= threeMonthsAgo && completedAt <= now;
  })
  .reduce(
    (total, entry) => total + (entry.listenedSeconds || 0),
    0
  );

const currentMonthListenedSeconds = practiceHistory
  .filter((entry) => {
    const completedAt = new Date(entry.completedAt);

    return (
      completedAt.getMonth() === now.getMonth() &&
      completedAt.getFullYear() === now.getFullYear()
    );
  })
  .reduce(
    (total, entry) => total + (entry.listenedSeconds || 0),
    0
  );

const formatPracticeTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }

  return `${minutes} мин`;
};

const getTagTitle = (tagId) => {
  const tag = tags.find((item) => item.id === tagId);
  const title = tag?.title ?? tagId;

  return title.charAt(0).toUpperCase() + title.slice(1);
};

const getMonthLabel = (date, short = false) => {
  const label = new Intl.DateTimeFormat("ru-RU", {
    month: short ? "short" : "long",
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
};

const getPathData = () => {
  // МЕСЯЦ — по неделям
  if (pathPeriod === "month") {
    const year = selectedPathMonth.year;
    const month = selectedPathMonth.month;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeksCount = Math.ceil(daysInMonth / 7);

    return Array.from({ length: weeksCount }, (_, index) => {
      const startDay = index * 7 + 1;
      const endDay = Math.min(startDay + 6, daysInMonth);

      const start = new Date(year, month, startDay, 0, 0, 0);
      const end = new Date(year, month, endDay, 23, 59, 59);

      const entries = practiceHistory.filter((entry) => {
        const completedAt = new Date(entry.completedAt);

        return completedAt >= start && completedAt <= end;
      });

      const seconds = entries.reduce(
        (total, entry) => total + (entry.listenedSeconds || 0),
        0
      );

      return {
        label: `${startDay}–${endDay}`,
        seconds,
        count: entries.length,
      };
    });
  }

  // 3 МЕСЯЦА
  if (pathPeriod === "3months") {
    return [2, 1, 0].map((monthsBack) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - monthsBack,
        1
      );

      const entries = practiceHistory.filter((entry) => {
        const completedAt = new Date(entry.completedAt);

        return (
          completedAt.getMonth() === date.getMonth() &&
          completedAt.getFullYear() === date.getFullYear()
        );
      });

      return {
        label: getMonthLabel(date),
        seconds: entries.reduce(
          (total, entry) => total + (entry.listenedSeconds || 0),
          0
        ),
        count: entries.length,
      };
    });
  }

  // ГОД — последние 12 месяцев
  if (pathPeriod === "year") {
    return Array.from({ length: 12 }, (_, index) => {
      const monthsBack = 11 - index;

      const date = new Date(
        now.getFullYear(),
        now.getMonth() - monthsBack,
        1
      );

      const entries = practiceHistory.filter((entry) => {
        const completedAt = new Date(entry.completedAt);

        return (
          completedAt.getMonth() === date.getMonth() &&
          completedAt.getFullYear() === date.getFullYear()
        );
      });

      return {
        label: getMonthLabel(date, true),
        seconds: entries.reduce(
          (total, entry) => total + (entry.listenedSeconds || 0),
          0
        ),
        count: entries.length,
      };
    });
  }

  // ВСЁ ВРЕМЯ — адаптивно:
// если история пока только в одном месяце — показываем недели,
// если месяцев несколько — показываем месяцы.

if (practiceHistory.length === 0) {
  return [];
}

const sortedDates = practiceHistory
  .map((entry) => new Date(entry.completedAt))
  .sort((a, b) => a - b);

const firstDate = sortedDates[0];

const isSameMonth =
  firstDate.getMonth() === now.getMonth() &&
  firstDate.getFullYear() === now.getFullYear();

// Пока вся история находится в текущем месяце — показываем недели
if (isSameMonth) {
  const year = now.getFullYear();
  const month = now.getMonth();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const weeksCount = Math.ceil(daysInMonth / 7);

  return Array.from({ length: weeksCount }, (_, index) => {
    const startDay = index * 7 + 1;
    const endDay = Math.min(startDay + 6, daysInMonth);

    const start = new Date(
      year,
      month,
      startDay,
      0,
      0,
      0
    );

    const end = new Date(
      year,
      month,
      endDay,
      23,
      59,
      59
    );

    const entries = practiceHistory.filter((entry) => {
      const completedAt = new Date(entry.completedAt);

      return completedAt >= start && completedAt <= end;
    });

    return {
      label: `${startDay}–${endDay}`,
      seconds: entries.reduce(
        (total, entry) =>
          total + (entry.listenedSeconds || 0),
        0
      ),
      count: entries.length,
    };
  });
}

// Когда история охватывает несколько месяцев — показываем месяцы
const months = [];

let cursor = new Date(
  firstDate.getFullYear(),
  firstDate.getMonth(),
  1
);

const lastMonth = new Date(
  now.getFullYear(),
  now.getMonth(),
  1
);

while (cursor <= lastMonth) {
  const date = new Date(cursor);

  const entries = practiceHistory.filter((entry) => {
    const completedAt = new Date(entry.completedAt);

    return (
      completedAt.getMonth() === date.getMonth() &&
      completedAt.getFullYear() === date.getFullYear()
    );
  });

  months.push({
    label: getMonthLabel(date, true),
    seconds: entries.reduce(
      (total, entry) =>
        total + (entry.listenedSeconds || 0),
      0
    ),
    count: entries.length,
  });

  cursor.setMonth(cursor.getMonth() + 1);
}

return months;
};

const pathData = getPathData();

const pathTotalSeconds = pathData.reduce(
  (total, item) => total + item.seconds,
  0
);

const pathPracticeCount = pathData.reduce(
  (total, item) => total + item.count,
  0
);

const pathPeriodLabel =
  pathPeriod === "month"
    ? "в этом месяце"
    : pathPeriod === "3months"
    ? "за последние 3 месяца"
    : pathPeriod === "year"
    ? "за последние 12 месяцев"
    : "за всё время";

const getReturnWord = (count) => {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "раз";
  }

  if (lastOne === 1) {
    return "раз";
  }

  if (lastOne >= 2 && lastOne <= 4) {
    return "раза";
  }

  return "раз";
};

const observationPeriodText =
  pathPeriod === "month"
    ? "В этом месяце"
    : pathPeriod === "3months"
    ? "За последние 3 месяца"
    : pathPeriod === "year"
    ? "За последние 12 месяцев"
    : "За всё время";

const latestPeriod =
  pathData[pathData.length - 1];

const previousPeriod =
  pathData[pathData.length - 2];
const monthGenitive = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
][selectedPathMonth.month];
const monthPrepositional = {
  Январь: "январе",
  Февраль: "феврале",
  Март: "марте",
  Апрель: "апреле",
  Май: "мае",
  Июнь: "июне",
  Июль: "июле",
  Август: "августе",
  Сентябрь: "сентябре",
  Октябрь: "октябре",
  Ноябрь: "ноябре",
  Декабрь: "декабре",
  "Янв.": "январе",
  "Февр.": "феврале",
  "Мар.": "марте",
  "Апр.": "апреле",
  "Авг.": "августе",
  "Сент.": "сентябре",
  "Окт.": "октябре",
  "Нояб.": "ноябре",
  "Дек.": "декабре",
};

const isWeeklyPath =
  pathPeriod === "month" ||
  (pathPeriod === "all" &&
    pathData.length > 0 &&
    /^\d/.test(pathData[0].label));
let pathObservation;

if (pathPracticeCount === 0) {
  pathObservation = {
    title: "Пока здесь тихо",
    text: "Когда появятся первые практики, здесь начнёт складываться Ваш путь.",
  };
} else if (pathPracticeCount === 1) {
  pathObservation = {
    title: "Начало пути",
    text: `${observationPeriodText} появилась первая практика — ${formatPracticeTime(
      pathTotalSeconds
    )} времени для себя.`,
  };
} else if (pathPracticeCount <= 3) {
  pathObservation = {
    title: "Практика уже складывается",
    text: `${observationPeriodText} Вы возвращались к практике ${pathPracticeCount} ${getReturnWord(
      pathPracticeCount
    )} и провели в ней ${formatPracticeTime(
      pathTotalSeconds
    )}.`,
  };
} else if (
  latestPeriod &&
  previousPeriod
) {
  const latestSeconds = latestPeriod.seconds;
  const previousSeconds = previousPeriod.seconds;

if (latestSeconds > previousSeconds * 1.15) {
  pathObservation = {
    title: "Ритм практики меняется",
    text: isWeeklyPath
      ? `С ${latestPeriod.label.replace("–", " по ")} ${monthGenitive} Вы провели в практике больше времени, чем с ${previousPeriod.label.replace("–", " по ")}.`
      : `В ${monthPrepositional[latestPeriod.label] ?? latestPeriod.label} Вы провели в практике больше времени, чем в ${monthPrepositional[previousPeriod.label] ?? previousPeriod.label}.`,
  };
} else if (latestSeconds < previousSeconds * 0.85) {
  pathObservation = {
    title: "Ритм практики меняется",
    text: isWeeklyPath
      ? `С ${latestPeriod.label.replace("–", " по ")} ${monthGenitive} времени в практике было меньше, чем с ${previousPeriod.label.replace("–", " по ")}.`
      : `В ${monthPrepositional[latestPeriod.label] ?? latestPeriod.label} времени в практике было меньше, чем в ${monthPrepositional[previousPeriod.label] ?? previousPeriod.label}.`,
  };
} else {
  pathObservation = {
    title: "Ритм остаётся похожим",
    text: isWeeklyPath
      ? `С ${previousPeriod.label.replace("–", " по ")} и с ${latestPeriod.label.replace("–", " по ")} ${monthGenitive} время в практике было примерно одинаковым.`
      : `В ${monthPrepositional[previousPeriod.label] ?? previousPeriod.label} и ${monthPrepositional[latestPeriod.label] ?? latestPeriod.label} время в практике было примерно одинаковым.`,
  };
}

} else {
  pathObservation = {
    title: "Практика уже складывается",
    text: `${observationPeriodText} Вы возвращались к практике ${pathPracticeCount} ${getReturnWord(
      pathPracticeCount
    )} и провели в ней ${formatPracticeTime(
      pathTotalSeconds
    )}.`,
  };
}

  const chartWidth = 900;
const chartBottom = 145;
const chartAmplitude = 90;

const maxPathSeconds = Math.max(
  ...pathData.map((item) => item.seconds),
  1
);

const chartPoints =
  pathData.length > 0
    ? pathData.map((item, index) => {
        const x =
          pathData.length === 1
            ? chartWidth / 2
            : index * (chartWidth / (pathData.length - 1));

        const y =
          chartBottom -
          (item.seconds / maxPathSeconds) * chartAmplitude;

        return { x, y };
      })
    : [];

const createSmoothPath = (points) => {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];

    const middleX = (previous.x + current.x) / 2;

    path += `
      C ${middleX} ${previous.y},
        ${middleX} ${current.y},
        ${current.x} ${current.y}
    `;
  }

  return path;
};

const chartLinePath = createSmoothPath(chartPoints);

const chartAreaPath =
  chartPoints.length > 1
    ? `
        ${chartLinePath}
        L ${chartPoints[chartPoints.length - 1].x} 180
        L ${chartPoints[0].x} 180
        Z
      `
    : "";

const stateLabels = {
  lighter: "Стало легче",
  same: "Почти не изменилось",
  harder: "Стало сложнее",
  unclear: "Не могу определить",
};

const recentStateEntries = practiceHistory.filter((entry) => {
  if (!entry.stateChange) {
    return false;
  }

  const completedAt = new Date(entry.completedAt);

  return completedAt >= threeMonthsAgo && completedAt <= now;
});

const totalStateEntries = recentStateEntries.length;

const stateDistribution = [
  "lighter",
  "same",
  "harder",
  "unclear",
].map((state) => {
  const count = recentStateEntries.filter(
    (entry) => entry.stateChange === state
  ).length;

  const value =
    totalStateEntries > 0
      ? Math.round((count / totalStateEntries) * 100)
      : 0;

  return {
    id: state,
    label: stateLabels[state],
    value,
    count,
  };
});

const dominantState = stateDistribution.reduce(
  (highest, current) =>
    current.value > highest.value ? current : highest,
  stateDistribution[0]
);

const stateObservation =
  totalStateEntries === 0
    ? {
        title: "Пока наблюдений немного",
        text: "Со временем здесь смогут появиться закономерности, основанные на Ваших отметках.",
      }
    : dominantState.id === "lighter"
    ? {
        title: "Чаще становится легче",
        text: "После практик Вы чаще отмечали, что состояние становилось легче.",
      }
    : dominantState.id === "same"
    ? {
        title: "Состояние чаще остаётся похожим",
        text: "После практик Вы чаще отмечали, что состояние почти не изменилось.",
      }
    : dominantState.id === "harder"
    ? {
        title: "Иногда после практики бывает сложнее",
        text: "Среди Ваших отметок чаще встречается ощущение, что после практики состояние становилось сложнее.",
      }
    : {
        title: "Изменение не всегда легко определить",
        text: "После практик Вы чаще отмечали, что Вам сложно определить, изменилось ли состояние.",
      };

const linkedBeforeAfterEntries = recentStateEntries.filter(
  (entry) =>
    Array.isArray(entry.beforeTags) &&
    entry.beforeTags.length > 0
);

const beforeAfterGroups = {};

linkedBeforeAfterEntries.forEach((entry) => {
  const uniqueTags = [...new Set(entry.beforeTags)];

  uniqueTags.forEach((tag) => {
    if (!beforeAfterGroups[tag]) {
      beforeAfterGroups[tag] = {
        total: 0,
        lighter: 0,
        same: 0,
        harder: 0,
        unclear: 0,
      };
    }

    beforeAfterGroups[tag].total += 1;

    if (entry.stateChange) {
      beforeAfterGroups[tag][entry.stateChange] += 1;
    }
  });
});

const beforeAfterStats = Object.entries(beforeAfterGroups)
  .map(([tag, data]) => {
    const changes = [
      { id: "lighter", count: data.lighter },
      { id: "same", count: data.same },
      { id: "harder", count: data.harder },
      { id: "unclear", count: data.unclear },
    ];

    const maxCount = Math.max(
      ...changes.map((item) => item.count)
    );

    const dominantChanges = changes.filter(
      (item) => item.count === maxCount
    );

    const hasClearDominant =
      maxCount > 0 && dominantChanges.length === 1;

    const dominantChange = hasClearDominant
      ? dominantChanges[0]
      : null;

    return {
      tag,
      total: data.total,
      dominantCount: dominantChange?.count ?? 0,
      dominantId: dominantChange?.id ?? null,
      dominantLabel: dominantChange
        ? stateLabels[dominantChange.id]
        : "Изменения разные",
    };
  })
  .sort((a, b) => b.total - a.total)
  .slice(0, 3);

const strongestBeforeAfterObservation =
  beforeAfterStats.find(
    (item) => item.dominantId && item.total >= 3
  );

const beforeAfterObservation =
  strongestBeforeAfterObservation
    ? {
        title: `Когда Вы отмечали ${getTagTitle(
          strongestBeforeAfterObservation.tag
        ).toLowerCase()}`,
        text: `После практик, начатых с этой отметки, Вы чаще выбирали «${strongestBeforeAfterObservation.dominantLabel.toLowerCase()}».`,
      }
    : {
        title: "Пока наблюдений немного",
        text: "Со временем здесь смогут появиться закономерности, основанные на связанных отметках до и после практики.",
      };

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

const selectedMonthHistory = practiceHistory
  .filter((entry) => {
    const completedAt = new Date(entry.completedAt);

    return (
      completedAt.getMonth() === historyMonth &&
      completedAt.getFullYear() === historyYear
    );
  })
  .sort(
    (a, b) =>
      new Date(b.completedAt).getTime() -
      new Date(a.completedAt).getTime()
  );

const formatHistoryTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours} ч ${minutes} мин ${remainingSeconds} сек`;
  }

  return `${minutes} мин ${remainingSeconds} сек`;
};

const openHistoryPractice = (entry) => {
  const fullPractice = allPractices.find(
    (practice) =>
      practice.id === entry.practiceId ||
      practice.title === entry.practiceId
  );

  if (!fullPractice) {
    return;
  }

  setSelectedPractice(fullPractice);
  setIsPlayerOpen(true);
};

const openDiaryEntry = (entry) => {
  const linkedDiaryEntry = diaryEntries.find(
    (diaryEntry) => diaryEntry.id === entry.diaryEntryId
  );

  if (!linkedDiaryEntry) {
    return;
  }

  setSelectedDiaryEntry(linkedDiaryEntry);
};

  return (
 <main
  className="min-h-screen page-fade"
  style={{
  background: `
  linear-gradient(
    145deg,
    #7775B4 0%,
    #7D79B8 55%,
    #8984C1 100%
  )
`,
  }}
>
  <div className="mx-auto max-w-6xl px-6 py-10">

{/* ВЕРХ MY FULLNESS */}
<section className="pb-2">

  <div className="flex items-center gap-3">

    <h1
      className="text-[42px] font-medium leading-none tracking-[0.01em] text-[#F4F1FF]"
      style={{
        fontFamily: '"Cormorant Garamond", serif',
      }}
    >
      My Fullness
    </h1>

    {/* СЕРДЦЕ */}
    <svg
      width="34"
      height="30"
      viewBox="0 0 24 24"
      fill="#FFE8A3"
      aria-hidden="true"
      className="mt-1"
    >
      <path
        d="M12 20.2S4.5 15.7 4.5 9.6C4.5 6.7 6.3 5 8.7 5C10.2 5 11.4 5.8 12 7C12.6 5.8 13.8 5 15.3 5C17.7 5 19.5 6.7 19.5 9.6C19.5 15.7 12 20.2 12 20.2Z"
        stroke="#FFE8A3"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>

  </div>

<div className="mt-7 max-w-[800px]">

  <p
    className="text-[18px] font-light leading-7 tracking-[0.01em] text-[#E8E4F4]"
    style={{
      fontFamily: '"Cormorant Garamond", serif',
    }}
  >
    Здесь нет правильных и неправильных результатов.
    <br />
    Это пространство, где Вы можете наблюдать за тем, как складывается Ваша практика.
  </p>

</div>

</section>


<section className="mt-14">
  <h2 className="text-2xl font-semibold text-[#F0EEFF]">
    Мой путь
  </h2>

  <p className="mt-2 text-[#DDD9EE]">
    Как складывается Ваша практика со временем.
  </p>

  <div className="mt-7 rounded-[28px] border border-white/10 bg-[#AAA5D8]/20 px-8 py-3 shadow-[0_18px_50px_rgba(46,39,92,0.10)] backdrop-blur-sm">
<div className="absolute right-8 top-4 flex justify-end">
  <div className="flex rounded-full border border-white/10 bg-[#8F8ABD]/20 p-1">
    {[
      { id: "month", label: "Месяц" },
      { id: "3months", label: "3 месяца" },
      { id: "year", label: "Год" },
      { id: "all", label: "Всё время" },
    ].map((period) => (
      <button
        key={period.id}
        type="button"
        onClick={() => setPathPeriod(period.id)}
        className={`rounded-full px-4 py-1.5 text-[13px] transition ${
          pathPeriod === period.id
            ? "bg-[#F0EEFF] text-[#66618F]"
            : "text-[#DDD9EE] hover:text-[#F4F1FF]"
        }`}
      >
        {period.label}
      </button>
    ))}
  </div>
</div>

    {/* ВРЕМЯ */}
    <div className="flex items-end justify-between gap-8">

      <div>
        <p className="text-sm text-[#DDD9EE]">
          Время в практике
        </p>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-light tracking-tight text-[#F0EEFF]">
            {formatPracticeTime(pathTotalSeconds)}
          </span>
        </div>

        {pathPeriod === "month" ? (
  <div className="mt-2 flex items-center gap-2 text-sm text-[#DDD9EE]">
    <button
      type="button"
      onClick={() => {
        setSelectedPathMonth((current) => {
          const previous = new Date(
            current.year,
            current.month - 1,
            1
          );

          return {
            year: previous.getFullYear(),
            month: previous.getMonth(),
          };
        });
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center transition hover:text-[#F4F1FF]"
      aria-label="Предыдущий месяц"
    >
      ‹
    </button>

    <span className="w-[120px] text-center">
      {new Intl.DateTimeFormat("ru-RU", {
        month: "long",
        year: "numeric",
      }).format(
        new Date(
          selectedPathMonth.year,
          selectedPathMonth.month,
          1
        )
      )}
    </span>

    <button
      type="button"
      disabled={
        selectedPathMonth.year === now.getFullYear() &&
        selectedPathMonth.month === now.getMonth()
      }
      onClick={() => {
        setSelectedPathMonth((current) => {
          const next = new Date(
            current.year,
            current.month + 1,
            1
          );

          return {
            year: next.getFullYear(),
            month: next.getMonth(),
          };
        });
      }}
              className="flex h-7 w-7 shrink-0 items-center justify-center transition hover:text-[#F4F1FF] disabled:cursor-default disabled:opacity-25"
              aria-label="Следующий месяц"
            >
              ›
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#DDD9EE]">
            {pathPeriodLabel}
          </p>
        )}
      </div>

    </div>

    {/* ГРАФИК */}
    <div className="relative mt-5 h-[140px]">

      {/* горизонтальные направляющие */}
      <div className="absolute inset-0 flex flex-col justify-between">
        <div className="border-t border-[#E6E2FA]/10" />
        <div className="border-t border-[#E6E2FA]/10" />
        <div className="border-t border-[#E6E2FA]/10" />
      </div>

      <svg
        viewBox="0 0 900 180"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="pathFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9D4FF" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#D9D4FF" stopOpacity="0" />
          </linearGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* мягкое заполнение под линией */}
        <path
          d={chartAreaPath}
          fill="url(#pathFill)"
        />

        {/* линия пути */}
        <path
          d={chartLinePath}
          fill="none"
          stroke="#DDD9FF"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#softGlow)"
        />
      </svg>

      {/* МЕСЯЦЫ */}
      <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[13px] text-[#C8C3DF]">
        {pathData.map((item, index) => (
          <span key={`${item.label}-${index}`}>
            {item.label}
          </span>
        ))}
      </div>

    </div>

    {/* НАБЛЮДЕНИЕ */}
    <div className="mt-8 border-t border-[#E6E2FA]/10 pt-4">

        <div className="flex items-center gap-2">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 18h6M10 22h4M8.5 14.5C7 13.4 6 11.6 6 9.5a6 6 0 0 1 12 0c0 2.1-1 3.9-2.5 5-1 .8-1.5 1.7-1.5 2.5h-4c0-.8-.5-1.7-1.5-2.5Z"
              fill="#FFE8A3"
              stroke="#FFE8A3"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#C9C5DF]">
            ЧТО МОЖНО ЗАМЕТИТЬ
          </p>
        </div>

        <p className="mt-2 text-base font-medium text-[#F0EEFF]">
          {pathObservation.title}
        </p>

        <p className="mt-1 max-w-2xl leading-7 text-[#E0DDF2]">
          {pathObservation.text}
        </p>

    </div>

  </div>
</section>

<section className="mt-14">
  <h2 className="text-2xl font-semibold text-[#F0EEFF]">
    Моё состояние
  </h2>

  <p className="mt-2 text-[#DDD9EE]">
    Наблюдения, которые постепенно складываются из Ваших отметок.
  </p>

  <div className="mt-7 grid grid-cols-[1.15fr_0.85fr] gap-5">

    {/* ПОСЛЕ ПРАКТИКИ */}
    <div className="rounded-[28px] border border-white/10 bg-[#AAA5D8]/20 px-8 py-7 shadow-[0_18px_50px_rgba(46,39,92,0.10)] backdrop-blur-sm">

      <p className="text-sm font-medium text-[#DDD9EE]">
        После практики
      </p>

      <p className="mt-1 text-[13px] text-[#C8C3DF]">
        По Вашим отметкам за последние 3 месяца
      </p>

      <div className="mt-7 space-y-5">

        {stateDistribution.map((item) => (
          <div key={item.label}>

            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm text-[#E3E0F2]">
                {item.label}
              </span>

              <span className="text-sm text-[#D7D3EC]">
                {item.value}%
              </span>
            </div>

            <div className="h-[5px] overflow-hidden rounded-full bg-[#D7D3F0]/10">
              <div
                className="h-full rounded-full bg-[#DDD9FF]/70 shadow-[0_0_10px_rgba(221,217,255,0.40)]"
                style={{ width: `${item.value}%` }}
              />
            </div>

          </div>
        ))}

      </div>
    </div>


    {/* ЧТО МОЖНО ЗАМЕТИТЬ */}
    <div className="rounded-[28px] border border-white/10 bg-[#AAA5D8]/20 px-8 py-7 shadow-[0_18px_50px_rgba(46,39,92,0.10)] backdrop-blur-sm">

            <div className="flex items-center gap-2">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 18h6M10 22h4M8.5 14.5C7 13.4 6 11.6 6 9.5a6 6 0 0 1 12 0c0 2.1-1 3.9-2.5 5-1 .8-1.5 1.7-1.5 2.5h-4c0-.8-.5-1.7-1.5-2.5Z"
            fill="#FFE8A3"
            stroke="#FFE8A3"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D8D4EA]">
          Что можно заметить
        </p>
      </div>

          <div className="mt-6">

            <p className="text-base font-medium text-[#F0EEFF]">
              {stateObservation.title}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#D6D2E9]">
              {stateObservation.text}
            </p>

          </div>

    </div>

  </div>
{/* ДО И ПОСЛЕ */}
<div className="mt-5 rounded-[28px] border border-white/10 bg-[#AAA5D8]/20 px-8 py-7 shadow-[0_18px_50px_rgba(46,39,92,0.10)] backdrop-blur-sm">

  <div className="flex items-start justify-between gap-10">

    {/* ЛЕВАЯ ЧАСТЬ */}
    <div className="min-w-0 flex-1">

      <p className="text-sm font-medium text-[#DDD9EE]">
        До и после
      </p>

      <p className="mt-1 text-[13px] text-[#C8C3DF]">
        Когда есть отметка состояния до практики и после неё
      </p>

      <div className="mt-7 space-y-6">

  {beforeAfterStats.length > 0 ? (
    beforeAfterStats.map((item) => (
      <div key={item.tag}>

        <div className="flex items-center gap-4">

          <span className="w-[145px] text-sm text-[#F0EEFF]">
            {getTagTitle(item.tag)}
          </span>

          <div className="relative h-px flex-1 bg-[#D7D3F0]/20">
            <span className="absolute -left-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#DDD9F5]" />
            <span className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#EEEAFE] shadow-[0_0_10px_rgba(238,234,254,0.65)]" />
          </div>

          <span className="w-[155px] text-right text-sm text-[#F4F1FF]">
            {item.dominantLabel}
          </span>

        </div>

        <p className="mt-2 pl-[161px] text-[13px] text-[#C8C3DF]">
          {item.dominantId
            ? `${item.dominantCount} из ${item.total} связанных наблюдений`
            : `${item.total} связанных наблюдений`}
        </p>

      </div>
    ))
  ) : (
    <p className="text-sm leading-6 text-[#C8C3DF]">
      Пока нет связанных наблюдений до и после практики.
    </p>
  )}

  </div>
</div>


    {/* ВЕРТИКАЛЬНЫЙ РАЗДЕЛИТЕЛЬ */}
    <div className="self-stretch border-l border-[#E6E2FA]/10" />


    {/* НАБЛЮДЕНИЕ */}
    <div className="w-[330px] shrink-0">

      <div className="flex items-center gap-2">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 18h6M10 22h4M8.5 14.5C7 13.4 6 11.6 6 9.5a6 6 0 0 1 12 0c0 2.1-1 3.9-2.5 5-1 .8-1.5 1.7-1.5 2.5h-4c0-.8-.5-1.7-1.5-2.5Z"
            fill="#FFE8A3"
            stroke="#FFE8A3"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D8D4EA]">
          Что можно заметить
        </p>
      </div>

     <p className="mt-6 text-base font-medium text-[#F4F1FF]">
        {beforeAfterObservation.title}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#DDD9EE]">
        {beforeAfterObservation.text}
      </p>

    </div>

  </div>

</div>

</section>

{/* ИСТОРИЯ ПРАКТИК */}
<section className="mt-14 pb-20">

  <h2 className="text-2xl font-semibold text-[#F0EEFF]">
    История практик
  </h2>

  <p className="mt-2 text-[#DDD9EE]">
    Практики и наблюдения, которые сохранялись со временем.
  </p>


  <div className="mt-7 rounded-[28px] border border-white/10 bg-[#AAA5D8]/20 px-8 py-6 shadow-[0_18px_50px_rgba(46,39,92,0.10)] backdrop-blur-sm">

    {/* ВЕРХ МЕСЯЦА */}
    <div className="flex items-start justify-between gap-6">

      <div>
        <p className="text-lg font-medium text-[#F4F1FF]">
          {monthNames[historyMonth]} {historyYear}
        </p>

        <p className="mt-1 text-[13px] text-[#C8C3DF]">
          Практики за выбранный месяц
        </p>
      </div>


      {/* ВЫБОР МЕСЯЦА И ГОДА */}
      <div className="flex items-center gap-3">

        <select
          value={historyMonth}
          onChange={(event) => {
            setHistoryMonth(Number(event.target.value));
            setExpandedHistoryId(null);
          }}
          className="rounded-lg border border-[#D8D1F0]/40 bg-[#F5F1FA] px-3 py-1.5 text-sm text-[#5F5A91] outline-none"
        >
          {monthNames.map((month, index) => (
            <option
              key={month}
              value={index}
              className="text-[#5F5A91]"
            >
              {month}
            </option>
          ))}
        </select>

        <select
          value={historyYear}
          onChange={(event) => {
            setHistoryYear(Number(event.target.value));
            setExpandedHistoryId(null);
          }}
          className="rounded-lg border border-[#D8D1F0]/40 bg-[#F5F1FA] px-3 py-1.5 text-sm text-[#5F5A91] outline-none"
        >
          <option value={2026} className="text-[#5F5A91]">
            2026
          </option>
          <option value={2025} className="text-[#5F5A91]">
            2025
          </option>
          <option value={2024} className="text-[#5F5A91]">
            2024
          </option>
        </select>

      </div>

    </div>


    {/* СПИСОК ПРАКТИК ТЕКУЩЕГО МЕСЯЦА */}
  
      <div className="history-scroll mt-5 max-h-[270px] overflow-y-auto pr-2">

        <div className="divide-y divide-[#E6E2FA]/10">

          {selectedMonthHistory.length > 0 ? (
            selectedMonthHistory.map((entry) => {
              const completedAt =
                new Date(entry.completedAt);

              const dateLabel =
                completedAt.toLocaleDateString(
                  "ru-RU",
                  {
                    day: "numeric",
                    month: "long",
                  }
                );

              const timeLabel =
                completedAt.toLocaleTimeString(
                  "ru-RU",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

              const isExpanded =
                expandedHistoryId === entry.id;

              return (
                <div key={entry.id}>

{/* СТРОКА */}
<button
  type="button"
  onClick={() =>
    setExpandedHistoryId(
      isExpanded
        ? null
        : entry.id
    )
  }
  className="flex w-full items-center gap-3 py-3 text-left"
>
  <span
    className={`shrink-0 text-sm font-medium ${
      isExpanded ? "text-[#FFF8E3]" : "text-[#D8D4EF]"
    }`}
  >
    {dateLabel}
  </span>

  <span
    className={
      isExpanded ? "text-[#FFF8E3]" : "text-[#C8C3DF]"
    }
  >
    ·
  </span>

  <span
    className={`shrink-0 text-sm ${
      isExpanded ? "text-[#FFF8E3]" : "text-[#DDD9EE]"
    }`}
  >
    {timeLabel}
  </span>

  <span
    className={
      isExpanded ? "text-[#FFF8E3]" : "text-[#C8C3DF]"
    }
  >
    ·
  </span>

  <span
    className={`min-w-0 flex-1 text-base font-medium ${
      isExpanded ? "text-[#FFF8E3]" : "text-[#F4F1FF]"
    }`}
  >
    {entry.title}
  </span>

  <span
    className={`shrink-0 text-sm ${
      isExpanded ? "text-[#FFF8E3]" : "text-[#DDD9EE]"
    }`}
  >
    {formatHistoryTime(
      entry.listenedSeconds || 0
    )}
  </span>

  <span
    className={`ml-2 shrink-0 text-sm ${
      isExpanded ? "text-[#FFF8E3]" : "text-[#D8D4EF]/80"
    }`}
  >
    {isExpanded ? "▴" : "▾"}
  </span>
</button>


{/* РАСКРЫТАЯ РЕФЛЕКСИЯ */}
{isExpanded && (
  <div className="pb-5 pl-0 pt-4">

    {entry.stateChange && (
      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-[#FFF8E3]">
          После практики:
        </span>

        <span className="font-medium text-[#FFF8E3]">
          {stateLabels[
            entry.stateChange
          ]?.toLowerCase() ?? entry.stateChange}
        </span>
      </div>
    )}

    <div className="mt-5">
      <p className="text-[12px] uppercase tracking-[0.1em] text-[#FFF8E3]">
        Рефлексия
      </p>

      <p className="mt-2 text-sm leading-6 text-[#FFF8E3]">
        {entry.reflection
          ? entry.reflection
          : "Не оставлена."}
      </p>
    </div>

    <div className="mt-3 flex items-center gap-3 border-t border-[#E6E2FA]/10 pt-3">
  <button
    type="button"
    onClick={() => openHistoryPractice(entry)}
    className="rounded-lg border border-[#FFF8E3]/30 bg-[#FFF8E3]/5 px-3 py-1.5 text-sm text-[#FFF8E3] transition hover:border-[#FFF8E3]/45 hover:bg-[#FFF8E3]/10"
  >
    Открыть практику
  </button>

  {entry.diaryEntryId && (
    <button
      type="button"
      onClick={() => openDiaryEntry(entry)}
      className="rounded-lg border border-[#FFF8E3]/30 bg-[#FFF8E3]/5 px-3 py-1.5 text-sm text-[#FFF8E3] transition hover:border-[#FFF8E3]/45 hover:bg-[#FFF8E3]/10"
    >
      Посмотреть запись до практики
    </button>
  )}
</div>

  </div>
)}
                </div>
              );
            })
          ) : (
            <p className="py-5 text-sm text-[#C8C3DF]">
              В этом месяце практики пока не отмечены.
            </p>
          )}

        </div>

    </div>

  </div>

</section>

    </div>

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

{selectedDiaryEntry && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2F2B5A]/35 px-6 backdrop-blur-[2px]"
    onClick={() => setSelectedDiaryEntry(null)}
  >
    <div
      className="relative w-full max-w-[620px] rounded-[28px] border border-white/20 bg-[#F5F2FA] px-8 py-7 shadow-[0_24px_70px_rgba(37,32,78,0.28)]"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setSelectedDiaryEntry(null)}
        className="absolute right-6 top-5 text-xl text-[#7771A2] transition hover:text-[#514B7C]"
        aria-label="Закрыть"
      >
        ×
      </button>

      <p className="text-sm text-[#8983A8]">
        Запись до практики
      </p>

      <p className="mt-1 text-sm text-[#77719A]">
        {selectedDiaryEntry.date} · {selectedDiaryEntry.time}
      </p>

      <div className="mt-6">
        <p className="whitespace-pre-wrap text-[16px] leading-7 text-[#514D70]">
          {selectedDiaryEntry.text ||
            "Сегодня я просто хочу быть."}
        </p>
      </div>
      {Array.isArray(selectedDiaryEntry.tags) &&
  selectedDiaryEntry.tags.length > 0 && (
    <div className="mt-5">
      <p className="mb-3 text-sm text-[#8983A8]">
        Моё состояние
      </p>

      <div className="flex flex-wrap gap-2">
        {selectedDiaryEntry.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[#8D87B5]/20 bg-[#E9E5F3] px-3 py-1.5 text-sm text-[#625D87]"
          >
            {getTagTitle(tag)}
          </span>
        ))}
      </div>
    </div>
  )}

    </div>
  </div>
)}

    </main>
  );
}