"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser, loginUser } from "./auth";

export default function WelcomeScreen() {
  const router = useRouter();
  const [showClearSky, setShowClearSky] = useState(false);
  const [showText, setShowText] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordWarning, setPasswordWarning] = useState("");
  const [passwordLimitFlash, setPasswordLimitFlash] = useState(false);
  const [confirmPasswordLimitFlash, setConfirmPasswordLimitFlash] = useState(false);
  const [authWarning, setAuthWarning] = useState("");

  const handleSubmit = () => {
  setAuthWarning("");

  if (isRegister) {
    if (!name.trim()) {
      setAuthWarning("Пожалуйста, введите ваше имя.");
      return;
    }

    if (!email.trim()) {
      setAuthWarning("Пожалуйста, введите электронную почту.");
      return;
    }

    if (password.length < 6) {
      setPasswordWarning(
        "Пароль должен состоять из латинских букв, цифр или специальных символов и содержать не менее 6 символов."
      );
      return;
    }

    if (password !== confirmPassword) {
      setAuthWarning("Пароли не совпадают.");
      return;
    }

    const result = registerUser(
  name.trim(),
  email.trim(),
  password
);

if (!result.success) {
  setAuthWarning(result.message ?? "Не удалось создать аккаунт.");
  return;
}

sessionStorage.setItem("animateHome", "true");
setIsLeaving(true);

setTimeout(() => {
  window.location.href = "/";
}, 900);

return;
}

/* ВХОД */
const result = loginUser(email.trim(), password);

if (!result.success) {
  setAuthWarning(result.message ?? "Не удалось войти.");
  return;
}

sessionStorage.setItem("animateHome", "true");
setIsLeaving(true);

setTimeout(() => {
  window.location.href = "/";
}, 900);
};

  useEffect(() => {
    setMounted(true);

    // Начинаем рассеивать облака
    const skyTimer = setTimeout(() => {
      setShowClearSky(true);
    }, 4000);

    // Исчезает фраза вместе с облаками
    const textTimer = setTimeout(() => {
      setShowText(false);
    }, 4300);

    // Появляется карточка входа
    const authTimer = setTimeout(() => {
    setShowAuth(true);
    }, 6500);

    return () => {
      clearTimeout(skyTimer);
      clearTimeout(textTimer);
      clearTimeout(authTimer);
    };
  }, []);

  return (
    <main
      className={`fixed inset-0 z-[100] h-screen w-full overflow-hidden bg-[#BFD9F2] transition-opacity duration-[900ms] ${
        mounted && !isLeaving ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* НЕБО С ОБЛАКАМИ */}
      <img
        src="/Cloudy-sky.png"
        alt=""
        className={`absolute inset-0 h-full w-full object-cover saturate-[0.82] contrast-[0.94] brightness-[1.03] transition-opacity duration-[3000ms] ${
          showClearSky ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* ЧИСТОЕ НЕБО */}
      <img
        src="/Clear-sky.png"
        alt=""
        className={`absolute inset-0 h-full w-full object-cover saturate-[0.82] contrast-[0.94] brightness-[1.03] transition-opacity duration-[3000ms] ${
          showClearSky ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* НАДПИСЬ И ЛИНИЯ */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-[2500ms] ${
          showText ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex flex-col items-center">

          <p className="px-6 text-center font-[family-name:var(--font-cormorant)] text-3xl font-light tracking-wide text-[#E8DDF5] drop-shadow-[0_1px_5px_rgba(255,255,255,0.29)] sm:text-4xl">
            Сделай глубокий вдох
          </p>

          {/* ДЕЛИКАТНАЯ ЛИНИЯ С ЛИСТИКОМ */}
          <svg
            width="360"
            height="55"
            viewBox="0 0 360 55"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mt-0 w-[300px] sm:w-[360px]"
            aria-hidden="true"
          >
            <path
              d="M8 24C55 40 104 38 143 27C158 23 169 20 180 27"
              stroke="#E8DDF5"
              strokeWidth="1.1"
              strokeLinecap="round"
            />

            <path
              d="M180 27C191 20 202 23 217 27C256 38 305 40 352 24"
              stroke="#E8DDF5"
              strokeWidth="1.1"
              strokeLinecap="round"
            />

            <path
              d="M180 28C171 23 166 15 171 10C179 11 183 18 180 28Z"
              stroke="#E8DDF5"
              strokeWidth="1.05"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M180 28C186 22 189 16 189 10"
              stroke="#E8DDF5"
              strokeWidth="1.05"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* ================================================== */}
      {/* КАРТОЧКА ВХОДА / РЕГИСТРАЦИИ */}
      {/* ================================================== */}

<div
  className={`absolute inset-0 z-20 flex items-center justify-center px-5 transition-all duration-[1300ms] ${
    showAuth
      ? "translate-y-0 opacity-100"
      : "pointer-events-none translate-y-4 opacity-0"
  }`}
>
        <div
          className="
            w-full max-w-[455px]
            rounded-[28px]
            border border-white/60
            bg-white/90
            px-8 py-8
            shadow-[0_20px_60px_rgba(63,83,145,0.18)]
            backdrop-blur-md
            sm:px-10 sm:py-9
          "
        >

          {/* ЛОГОТИП */}
          <div className="mb-3 flex -translate-y-2 justify-center">
<img
  src="/one-love-space-brand.svg"
  alt="One Love Space"
  className="h-auto w-[205px]"
/>
          </div>

{/* ЗАГОЛОВОК */}
<div className="mb-3 text-center">
  <h1 className="font-[family-name:var(--font-cormorant)] text-[34px] font-light leading-tight text-[#344B91]">
    Добро пожаловать
  </h1>

  <p className="mt-2 text-[15px] text-[#7D87B5]">
    Войти в своё пространство
  </p>
</div>

{/* ФОРМА */}
<div className="space-y-3">

  {/* ИМЯ — ТОЛЬКО РЕГИСТРАЦИЯ */}
  {isRegister && (
    <div className="relative">
      <svg
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8D96C2]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" />
      </svg>

      <input
        type="text"
        placeholder="Ваше имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="
          h-[50px] w-full rounded-xl
          border border-[#D9DCF0]
          bg-white/70
          pl-12 pr-4
          text-[15px] text-[#344B91]
          outline-none
          transition
          placeholder:text-[#9AA2C5]
          focus:border-[#8B8FD5]
          focus:ring-2 focus:ring-[#B8B8E8]/20
        "
      />
    </div>
  )}

  {/* EMAIL */}
  <div className="relative">
    <svg
      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8D96C2]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>

    <input
      type="email"
      placeholder="Электронная почта"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="
        h-[50px] w-full rounded-xl
        border border-[#D9DCF0]
        bg-white/70
        pl-12 pr-4
        text-[15px] text-[#344B91]
        outline-none
        transition
        placeholder:text-[#9AA2C5]
        focus:border-[#8B8FD5]
        focus:ring-2 focus:ring-[#B8B8E8]/20
      "
    />
  </div>

  {/* ПАРОЛЬ */}
<div>

  {/* Само поле пароля */}
  <div className="relative">
    <svg
      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8D96C2]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>

    <input
      type={showPassword ? "text" : "password"}
      placeholder="Пароль"
      value={password}
      onChange={(e) => {
        const value = e.target.value;

        if (value.length > 32) {
          setPasswordLimitFlash(true);

          setTimeout(() => {
            setPasswordLimitFlash(false);
          }, 900);

          return;
        }

        const lastCharacter = value.slice(-1);

        if (
          lastCharacter &&
          !/^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]$/.test(
            lastCharacter
          )
        ) {
          setPasswordWarning(
            "Пароль должен состоять из латинских букв, цифр или специальных символов и содержать не менее 6 символов."
          );

          return;
        }

        setPasswordWarning("");
        setPassword(value);
      }}
      className={`
        h-[50px] w-full rounded-xl
        border
        ${
          passwordLimitFlash
            ? "border-[#E6A6B8] bg-[#FCEFF3]"
            : "border-[#D9DCF0] bg-white/70"
        }
        pl-12 pr-12
        text-[15px] text-[#344B91]
        outline-none
        transition
        placeholder:text-[#9AA2C5]
        focus:border-[#8B8FD5]
        focus:ring-2 focus:ring-[#B8B8E8]/20
      `}
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D96C2] transition hover:text-[#5967A6]"
      aria-label="Показать пароль"
    >
      {showPassword ? (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5 0 8.5 4 9.5 6a12 12 0 0 1-3.1 3.8" />
          <path d="M6.6 6.6C4.7 7.8 3.4 9.4 2.5 10c1 2 4.5 6 9.5 6 1 0 2-.2 2.9-.5" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      )}
    </button>
  </div>

  {/* Мягкое предупреждение */}
  {passwordWarning && (
    <p className="mt-1 px-1 text-[12px] leading-5 text-[#667CC9]">
      {passwordWarning}
    </p>
  )}

</div>

{/* ПОВТОР ПАРОЛЯ — ТОЛЬКО РЕГИСТРАЦИЯ */}
{isRegister && (
  <div className="relative">
    <svg
      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8D96C2]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>

    <input
  type={showConfirmPassword ? "text" : "password"}
  placeholder="Повторите пароль"
  value={confirmPassword}
  onChange={(e) => {
  const value = e.target.value;

  if (value.length > 32) {
    setConfirmPasswordLimitFlash(true);

    setTimeout(() => {
      setConfirmPasswordLimitFlash(false);
    }, 900);

    return;
  }

  const lastCharacter = value.slice(-1);

  if (
    lastCharacter &&
    !/^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]$/.test(
      lastCharacter
    )
  ) {
    return;
  }

  setConfirmPassword(value);
}}
  className="
    h-[50px] w-full rounded-xl
    border border-[#D9DCF0]
    bg-white/70
    pl-12 pr-12
    text-[15px] text-[#344B91]
    outline-none
    transition
    placeholder:text-[#9AA2C5]
    focus:border-[#8B8FD5]
    focus:ring-2 focus:ring-[#B8B8E8]/20
  "
/>
<button
  type="button"
  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D96C2] transition hover:text-[#5967A6]"
  aria-label="Показать пароль"
>
  {showConfirmPassword ? (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5 0 8.5 4 9.5 6a12 12 0 0 1-3.1 3.8" />
      <path d="M6.6 6.6C4.7 7.8 3.4 9.4 2.5 10c1 2 4.5 6 9.5 6 1 0 2-.2 2.9-.5" />
    </svg>
  ) : (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )}
</button>

  </div>
)}
  {/* ДОПОЛНИТЕЛЬНЫЕ ОПЦИИ — ТОЛЬКО ВХОД */}
  {!isRegister && (
    <div className="flex items-center justify-between px-1 text-[13px]">
      <label className="flex cursor-pointer items-center gap-2 text-[#68749F]">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-[#B7BDDF] accent-[#6878C4]"
        />
        Запомнить меня
      </label>

      <button
        type="button"
        className="text-[#6573C1] transition hover:text-[#46559F]"
      >
        Забыли пароль?
      </button>
    </div>
  )}

  {/* ГЛАВНАЯ КНОПКА */}
  <button
  type="button"
  onClick={handleSubmit}
    className="
      h-[50px] w-full rounded-xl
      bg-[#667CC9]
      text-[15px] font-medium text-white
      shadow-[0_7px_18px_rgba(91,108,185,0.22)]
      transition
      hover:bg-[#5D72BF]
      active:scale-[0.99]
    "
  >
    {isRegister ? "Создать аккаунт" : "Войти"}
  </button>

  {/* РАЗДЕЛИТЕЛЬ */}
  <div className="flex items-center gap-4 py-0">
    <div className="h-px flex-1 bg-[#E2E4F1]" />
    <span className="text-[13px] text-[#9AA2C5]">или</span>
    <div className="h-px flex-1 bg-[#E2E4F1]" />
  </div>

  {/* ПЕРЕКЛЮЧЕНИЕ */}
  <button
    type="button"
    onClick={() => setIsRegister(!isRegister)}
    className="
      h-[50px] w-full rounded-xl
      border border-[#7785D0]
      bg-white/50
      text-[15px] font-medium text-[#5264B4]
      transition
      hover:bg-[#F6F6FD]
    "
  >
    {isRegister ? "Войти" : "Создать аккаунт"}
  </button>

</div>

{authWarning && (
  <p className="mt-3 text-center text-[13px] leading-5 text-[#667CC9]">
    {authWarning}
  </p>
)}
          {/* УСЛОВИЯ */}
          <p className="mt-6 text-center text-[11px] leading-5 text-[#9AA2C5]">
            Продолжая, вы соглашаетесь с{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-[#6573C1]"
            >
              Условиями использования
            </button>{" "}
            и{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-[#6573C1]"
            >
              Политикой конфиденциальности
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}