"use client";

import { getRecommendations } from "../lib/recommendations";

export default function ProfilePage() {
  const tests = [
{
  name: "Смешанный тест: злость + напряжение + стресс → спокойствие",
  data: {
    manualTags: ["anger"],
    reflectionTags: ["tension"],
    detectedTags: ["stress"],
    desiredTags: ["calm"],
  },
},

{
  name: "AI видит много, пользователь выбрал одно",
  data: {
    manualTags: ["hurt"],
    reflectionTags: [],
    detectedTags: ["stress", "anxiety", "tension"],
    desiredTags: ["acceptance"],
  },
},

    {
      name: "Злость + напряжение → спокойствие",
      data: {
        manualTags: ["anger"],
        reflectionTags: ["tension"],
        detectedTags: [],
        desiredTags: ["calm"],
      },
    },

    {
      name: "Тревожность → спокойствие",
      data: {
        manualTags: ["anxiety"],
        reflectionTags: [],
        detectedTags: [],
        desiredTags: ["calm"],
      },
    },

    {
      name: "Усталость + переутомление → опора",
      data: {
        manualTags: [],
        reflectionTags: ["fatigue", "overexertion"],
        detectedTags: [],
        desiredTags: ["support"],
      },
    },

    {
      name: "Обида → принятие",
      data: {
        manualTags: ["hurt"],
        reflectionTags: [],
        detectedTags: [],
        desiredTags: ["acceptance"],
      },
    },

    {
      name: "Только AI распознал стресс",
      data: {
        manualTags: [],
        reflectionTags: [],
        detectedTags: ["stress"],
        desiredTags: [],
      },
    },

    {
      name: "Нет данных",
      data: {},
    },
  ];

  return (
    <main className="min-h-screen bg-[#F5F7FC] px-6 py-10 text-[#172B70]">

      <div className="mx-auto max-w-5xl">

        <h1 className="text-3xl font-semibold">
          Recommendation Test Lab
        </h1>

        <p className="mt-2 text-sm text-[#6875A8]">
          Временная страница для проверки алгоритма рекомендаций.
        </p>

        <div className="mt-8 space-y-8">

          {tests.map((test) => {
            const result = getRecommendations(test.data);

            return (
              <section
                key={test.name}
                className="rounded-3xl border border-[#D9E1F0] bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-medium">
                  {test.name}
                </h2>

                <p className="mt-2 text-sm text-[#8B98B5]">
                  Тип: {result.type}
                </p>

                <div className="mt-5 space-y-4">

                  {result.recommendations.length > 0 ? (
                    result.recommendations.map((item, index) => {
                      const practice =
                        result.type === "neutral"
                          ? item
                          : item.practice;

                      return (
                        <div
                          key={`${practice.title}-${index}`}
                          className="rounded-2xl bg-[#F7F8FC] p-4"
                        >
                          <p className="font-medium text-[#172B70]">
                            {index + 1}. {practice.title}
                          </p>

                          <p className="mt-1 text-sm text-[#6875A8]">
                            {practice.duration}
                          </p>

                          {result.type === "personal" && (
                            <div className="mt-3 text-sm leading-6 text-[#596B91]">
                              <p>
                                Score: {item.score}
                              </p>

                              <p>
                                Ручные совпадения:{" "}
                                {item.matches.manual.join(", ") || "—"}
                              </p>

                              <p>
                                Рефлексия:{" "}
                                {item.matches.reflection.join(", ") || "—"}
                              </p>

                              <p>
                                Текст / AI:{" "}
                                {item.matches.detected.join(", ") || "—"}
                              </p>

                              <p>
                                Желаемое состояние:{" "}
                                {item.matches.desired.join(", ") || "—"}
                              </p>
                            </div>
                          )}

                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[#8B98B5]">
                      Нет практик, прошедших минимальный порог.
                    </p>
                  )}

                </div>

              </section>
            );
          })}

        </div>

      </div>

    </main>
  );
}