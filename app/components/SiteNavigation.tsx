"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  getCurrentUser,
  updateUserName,
  updatePassword,
  logoutUser,
} from "./auth";

const passwordInputPattern =
  /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]*$/;

export default function SiteNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);

const [profileOpen, setProfileOpen] = useState(false);

const [settingsOpen, setSettingsOpen] = useState(false);
const [isEditingName, setIsEditingName] = useState(false);
const [editedName, setEditedName] = useState("");

const [passwordModalOpen, setPasswordModalOpen] = useState(false);
const [passwordSuccessOpen, setPasswordSuccessOpen] = useState(false);
const [logoutModalOpen, setLogoutModalOpen] = useState(false);

const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmNewPassword, setConfirmNewPassword] = useState("");
const [passwordMessage, setPasswordMessage] = useState("");

const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [currentUser, setCurrentUser] = useState<{
  name: string;
  email: string;
} | null>(null);

const profileRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const user = getCurrentUser();

  setCurrentUser(user);

  if (user) {
    setEditedName(user.name);
  }
}, []);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      profileRef.current &&
      !profileRef.current.contains(event.target as Node)
    ) {
      setProfileOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

useEffect(() => {
  function handleEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
  setProfileOpen(false);
  setSettingsOpen(false);
  setPasswordModalOpen(false);
  setLogoutModalOpen(false);
}
  }

  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener("keydown", handleEscape);
  };
}, []);

function handleNameSave() {
  const result = updateUserName(editedName);

  if (!result.success) {
    return;
  }

  const updatedUser = getCurrentUser();

  setCurrentUser(updatedUser);
  setEditedName(updatedUser?.name ?? "");
  setIsEditingName(false);
}

function handlePasswordChange() {
  setPasswordMessage("");

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    setPasswordMessage("Заполните все поля.");
    return;
  }

  function closePasswordModal() {
  setPasswordModalOpen(false);

  setCurrentPassword("");
  setNewPassword("");
  setConfirmNewPassword("");

  setShowCurrentPassword(false);
  setShowNewPassword(false);
  setShowConfirmPassword(false);

  setPasswordMessage("");
}

  if (newPassword.length < 6) {
    setPasswordMessage(
      "Новый пароль должен содержать не менее 6 символов."
    );
    return;
  }

  if (newPassword.length > 32) {
    setPasswordMessage(
      "Пароль не может содержать более 32 символов."
    );
    return;
  }

  if (newPassword !== confirmNewPassword) {
    setPasswordMessage("Новые пароли не совпадают.");
    return;
  }

  const result = updatePassword(currentPassword, newPassword);

  if (!result.success) {
    setPasswordMessage(
      result.message ?? "Не удалось изменить пароль."
    );
    return;
  }

  setCurrentPassword("");
  setNewPassword("");
  setConfirmNewPassword("");

  setShowCurrentPassword(false);
  setShowNewPassword(false);
  setShowConfirmPassword(false);

  setPasswordMessage("");

  setPasswordModalOpen(false);
  setPasswordSuccessOpen(true);
}

function closePasswordModal() {
  setPasswordModalOpen(false);

  setCurrentPassword("");
  setNewPassword("");
  setConfirmNewPassword("");

  setShowCurrentPassword(false);
  setShowNewPassword(false);
  setShowConfirmPassword(false);

  setPasswordMessage("");
}

function handleLogout() {
  logoutUser();
  setCurrentUser(null);
  setProfileOpen(false);
  setLogoutModalOpen(false);
  window.location.href = "/welcome";
}


  return (
    <>
      {/* ШАПКА */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#D9E1F0] bg-white px-6 py-2">

  <div className="flex items-center gap-4">

<button
  onClick={() => setMenuOpen(true)}
  className="flex h-8 w-8 items-center justify-center text-[#172B70] transition hover:text-[#667CC9]"
  aria-label="Открыть меню"
>
  <svg
    width="24"
    height="20"
    viewBox="0 0 24 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <line
      x1="2"
      y1="3"
      x2="22"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <line
      x1="2"
      y1="10"
      x2="22"
      y2="10"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <line
      x1="2"
      y1="17"
      x2="22"
      y2="17"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
</button>

    <Link
      href="/"
      className="flex items-center gap-3"
    >
      <img
      src="/one-love-space-logo-compact.svg"
      alt=""
      aria-hidden="true"
      className="h-8 w-8 object-contain"
    />

      <span className="logo-font text-2xl font-semibold text-[#172B70]">
        ONE LOVE SPACE
      </span>
    </Link>

  </div>

  <div ref={profileRef} className="relative">

    <button
      type="button"
      onClick={() => setProfileOpen((prev) => !prev)}
      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full"
      aria-label="Профиль"
      aria-expanded={profileOpen}
    >
      <img
        src="/profile-icon-yes.svg"
        alt="Профиль"
        className="h-full w-full object-cover"
      />
    </button>

  {profileOpen && (
  <>
    {/* МЯГКИЙ ФОН ПОД ПРОФИЛЕМ */}
    <div
      className="fixed inset-0 z-40 bg-[#172B70]/10 backdrop-blur-[2px]"
      onClick={() => {
        setProfileOpen(false);
        setSettingsOpen(false);
      }}
    />

    {/* ОКНО ПРОФИЛЯ */}
    <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[#E2E6F0] bg-white p-5 shadow-[0_12px_35px_rgba(23,43,112,0.10)]">

      {/* ИМЯ */}
      <div className="flex items-center gap-3">

        <img
          src="/profile-icon-yes.svg"
          alt=""
          aria-hidden="true"
          className="h-7 w-7 shrink-0 object-contain"
        />

        {isEditingName ? (
          <>
            <input
              type="text"
              value={editedName}
              onChange={(event) => setEditedName(event.target.value)}
              autoFocus
              className="min-w-0 flex-1 rounded-lg border border-[#D9E1F0] bg-[#FAFBFE] px-2.5 py-1.5 text-sm text-[#172B70] outline-none focus:border-[#9AAAD4]"
            />

            <button
              type="button"
              onClick={handleNameSave}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#667CC9] transition hover:bg-[#F5F7FC]"
              aria-label="Сохранить имя"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M5 12.5L9.5 17L19 7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        ) : (
          <>
            <p className="min-w-0 flex-1 truncate text-base font-medium text-[#172B70]">
              {currentUser?.name || "Пользователь"}
            </p>

            <button
              type="button"
              onClick={() => {
                setEditedName(currentUser?.name ?? "");
                setIsEditingName(true);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#7180A0] transition hover:bg-[#F5F7FC] hover:text-[#667CC9]"
              aria-label="Изменить имя"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4.5 19.5L5.4 15.7L15.9 5.2C16.7 4.4 18 4.4 18.8 5.2L19.1 5.5C19.9 6.3 19.9 7.6 19.1 8.4L8.6 18.9L4.5 19.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 6.6L17.4 9.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </>
        )}

      </div>

      {/* РАЗДЕЛИТЕЛЬ */}
      <div className="my-4 h-px bg-[#EEF1F6]" />

      {/* EMAIL */}
      <p className="truncate px-3 text-sm text-[#8B98B5]">
        {currentUser?.email || ""}
      </p>

      {/* НАСТРОЙКИ ПРОФИЛЯ */}
      <button
        type="button"
        onClick={() => setSettingsOpen((prev) => !prev)}
        className="mt-4 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#596B91] transition hover:bg-[#F7F9FD]"
      >
        <span>
          Настройки профиля
        </span>

        <svg
          width="12"
          height="7"
          viewBox="0 0 12 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 transition-transform duration-200 ${
            settingsOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path
            d="M1 1L6 6L11 1"
            stroke="#7180A0"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ИЗМЕНИТЬ ПАРОЛЬ */}
      {settingsOpen && (
        <div className="mt-1 pl-3">
          <button
            type="button"
            onClick={() => {
              setPasswordModalOpen(true);
              setPasswordMessage("");
            }}
            className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-[#7180A0] transition hover:bg-[#F8FAFD] hover:text-[#667CC9]"
          >
            Изменить пароль
          </button>
        </div>
      )}

      {/* ВЫХОД */}
      <button
        type="button"
        onClick={() => setLogoutModalOpen(true)}
        className="mt-2 flex w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#7180A0] transition hover:bg-[#F7F9FD] hover:text-[#667CC9]"
      >
        Выйти из системы
      </button>

    </div>
  </>
)}

</div>

      </header>


      {/* БУРГЕР-МЕНЮ */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">

          <div
            className="absolute inset-0 bg-[#172B70]/20 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-80 bg-white p-7 shadow-2xl">

            <div className="mb-8 flex items-center justify-between">

              <h2 className="logo-font text-xl font-medium uppercase text-[#172B70]">
                ONE LOVE SPACE
              </h2>

              <button
                onClick={() => setMenuOpen(false)}
                className="text-3xl text-[#172B70]"
                aria-label="Закрыть меню"
              >
                ×
              </button>

            </div>

            <div className="flex flex-col gap-1">

<MenuItem label="Главная" href="/" onClick={() => setMenuOpen(false)} />
<MenuItem label="Дневник состояний" href="/diary" onClick={() => setMenuOpen(false)} />
<MenuItem label="Медитации" href="/meditations" onClick={() => setMenuOpen(false)} />
<MenuItem label="Профиль" onClick={() => { setMenuOpen(false); setProfileOpen(true); }}/>
<MenuItem label="Поиск" href="/search" onClick={() => setMenuOpen(false)} />
<MenuItem label="My Fullness" href="/fullness" heart onClick={() => setMenuOpen(false)} />
<MenuItem label="О проекте" href="/#about" onClick={() => setMenuOpen(false)} />

            </div>

          </aside>

        </div>
      )}

      {passwordModalOpen && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center px-5">

    <div
      className="absolute inset-0 bg-[#172B70]/20 backdrop-blur-sm"
      onClick={closePasswordModal}
    />

    <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-[0_20px_60px_rgba(23,43,112,0.18)]">

      <button
        type="button"
        onClick={closePasswordModal}
        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-xl text-[#8B98B5] transition hover:bg-[#F5F7FC] hover:text-[#526EBA]"
        aria-label="Закрыть"
      >
        ×
      </button>

      <h2 className="text-xl font-medium text-[#172B70]">
        Изменить пароль
      </h2>

      <p className="mt-2 text-sm leading-5 text-[#7180A0]">
        Введите текущий пароль и придумайте новый.
      </p>

      <div className="mt-6 space-y-3">

        {/* ТЕКУЩИЙ ПАРОЛЬ */}
        <div className="relative">
          <input
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(event) => {
              const value = event.target.value;

              if (
                value.length <= 32 &&
                passwordInputPattern.test(value)
              ) {
                setCurrentPassword(value);
              }
            }}
                        placeholder="Текущий пароль"
            className="w-full rounded-xl border border-[#D9E1F0] bg-white px-4 py-3 pr-12 text-sm text-[#172B70] outline-none transition focus:border-[#7C91D4]"
          />

          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8B98B5] transition hover:bg-[#F5F7FC] hover:text-[#3E63B8]"
            aria-label={
              showCurrentPassword
                ? "Скрыть пароль"
                : "Показать пароль"
            }
          >
            {showCurrentPassword ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.8 4 10 8a12.8 12.8 0 0 1-3.1 5.1" />
                <path d="M6.2 6.2C4.5 7.5 3.3 9.3 2 12c1.2 3.4 4.8 8 10 8 1 0 2-.2 2.9-.5" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            )}
          </button>
        </div>


        {/* НОВЫЙ ПАРОЛЬ */}
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(event) => {
              const value = event.target.value;

              if (
                value.length <= 32 &&
                passwordInputPattern.test(value)
              ) {
                setNewPassword(value);
              }
            }}
            placeholder="Новый пароль"
            maxLength={32}
            className="w-full rounded-xl border border-[#D9E1F0] bg-white px-4 py-3 pr-12 text-sm text-[#172B70] outline-none transition focus:border-[#7C91D4]"
          />

          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8B98B5] transition hover:bg-[#F5F7FC] hover:text-[#3E63B8]"
            aria-label={
              showNewPassword
                ? "Скрыть пароль"
                : "Показать пароль"
            }
          >
            {showNewPassword ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.8 4 10 8a12.8 12.8 0 0 1-3.1 5.1" />
                <path d="M6.2 6.2C4.5 7.5 3.3 9.3 2 12c1.2 3.4 4.8 8 10 8 1 0 2-.2 2.9-.5" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            )}
          </button>
        </div>


        {/* ПОВТОР НОВОГО ПАРОЛЯ */}
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmNewPassword}
            onChange={(event) => {
              const value = event.target.value;

              if (
                value.length <= 32 &&
                passwordInputPattern.test(value)
              ) {
                setConfirmNewPassword(value);
              }
            }}
            placeholder="Повторите новый пароль"
            maxLength={32}
            className="w-full rounded-xl border border-[#D9E1F0] bg-white px-4 py-3 pr-12 text-sm text-[#172B70] outline-none transition focus:border-[#7C91D4]"
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8B98B5] transition hover:bg-[#F5F7FC] hover:text-[#3E63B8]"
            aria-label={
              showConfirmPassword
                ? "Скрыть пароль"
                : "Показать пароль"
            }
          >
            {showConfirmPassword ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.8 4 10 8a12.8 12.8 0 0 1-3.1 5.1" />
                <path d="M6.2 6.2C4.5 7.5 3.3 9.3 2 12c1.2 3.4 4.8 8 10 8 1 0 2-.2 2.9-.5" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {passwordMessage && (
        <p className="mt-3 text-sm text-[#7180A0]">
          {passwordMessage}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">

        <button
          type="button"
          onClick={closePasswordModal}
          className="rounded-xl px-4 py-2.5 text-sm text-[#7180A0] transition hover:bg-[#F5F7FC]"
        >
          Отмена
        </button>

        <button
          type="button"
          onClick={handlePasswordChange}
          className="rounded-xl bg-[#E9F0FC] px-5 py-2.5 text-sm font-medium text-[#3E63B8] transition hover:bg-[#D9E1F0]"
        >
          Сохранить
        </button>

      </div>

    </div>
  </div>
)}

{passwordSuccessOpen && (
  <div className="fixed inset-0 z-[80] flex items-center justify-center px-5">

    <div
      className="absolute inset-0 bg-[#172B70]/15 backdrop-blur-sm"
      onClick={() => setPasswordSuccessOpen(false)}
    />

    <div className="relative w-full max-w-sm rounded-3xl bg-white px-8 py-8 text-center shadow-[0_20px_60px_rgba(23,43,112,0.16)]">

      <button
        type="button"
        onClick={() => setPasswordSuccessOpen(false)}
        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-xl text-[#8B98B5] transition hover:bg-[#F5F7FC] hover:text-[#526EBA]"
        aria-label="Закрыть"
      >
        ×
      </button>

      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF1FA] text-[#667CC9]">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5 12.5L9.5 17L19 7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="mt-4 text-xl font-medium text-[#172B70]">
        Пароль успешно изменён
      </h2>

      <p className="mt-2 text-sm leading-5 text-[#7180A0]">
        Новый пароль сохранён.
      </p>

    </div>

  </div>
)}

{logoutModalOpen && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center px-5">

    <div
      className="absolute inset-0 bg-[#172B70]/20 backdrop-blur-sm"
      onClick={() => setLogoutModalOpen(false)}
    />

    <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-[0_20px_60px_rgba(23,43,112,0.18)]">

      <h2 className="text-xl font-medium text-[#172B70]">
        Выйти из системы?
      </h2>

      <p className="mt-2 text-sm leading-5 text-[#7180A0]">
        Вы действительно хотите выйти из аккаунта?
      </p>

      <div className="mt-6 flex justify-center gap-3">

        <button
          type="button"
          onClick={() => setLogoutModalOpen(false)}
          className="rounded-xl px-5 py-2.5 text-sm text-[#7180A0] transition hover:bg-[#F5F7FC]"
        >
          Отмена
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-[#EEF4FF] px-3.5 py-1 text-sm font-medium text-[#5871BD] transition hover:bg-[#E3ECFC]"
        >
          Да
        </button>

      </div>

    </div>
  </div>
)}


      {/* НИЖНЯЯ НАВИГАЦИЯ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#D9E1F0] bg-white px-3 py-1">

        <div className="mx-auto flex max-w-4xl justify-around">

<NavItem icon="⌂" label="Главная" href="/" />
<NavItem icon="📖" label="Дневник состояний" href="/diary" />
<NavItem icon="🪷" label="Медитации" href="/meditations" />
<NavItem icon="⌕" label="Поиск" href="/search" />
<NavItem icon="♡" label="My Fullness" href="/fullness" />

        </div>

      </nav>
    </>
  );
}


/* НИЖНИЙ ПУНКТ НАВИГАЦИИ */
function NavItem({
  icon,
  label,
  href,
}: {
  icon: string;
  label: string;
  href: string;
}) {

  const iconColor =
    icon === "⌂"
      ? "text-[#FFE36B]"
      : icon === "📖"
      ? "text-[#3E63B8]"
      : icon === "🪷"
      ? "text-[#5C9A78]"
      : icon === "⌕"
      ? "text-[#5B9CCB]"
      : "text-[#8B72B5]";

  return (

    <Link
  href={href}
  className="flex flex-col items-center gap-0 text-xs text-[#3E63B8] sm:text-sm">

      <span className={`flex h-6 w-6 items-center justify-center ${iconColor}`}>

        {/* Главная — домик */}
        {icon === "⌂" && (
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 10.5L12 4L20 10.5V19C20 19.6 19.6 20 19 20H5C4.4 20 4 19.6 4 19V10.5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />

            <path
              d="M9 20V14H15V20"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Дневник — открытая книга */}
        {icon === "📖" && (
          <svg
            width="28"
            height="24"
            viewBox="0 0 28 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M14 6.5C11.7 5.1 8.7 4.5 5 5.2V19C8.7 18.3 11.7 18.9 14 20.3"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M14 6.5C16.3 5.1 19.3 4.5 23 5.2V19C19.3 18.3 16.3 18.9 14 20.3"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M14 6.5V20.3"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Медитации — листик */}
        {icon === "🪷" && (
          <img
            src="/meditation-leaf.png"
            alt=""
            width="30"
            height="24"
            style={{ objectFit: "contain" }}
            aria-hidden="true"
          />
        )}

        {/* Поиск — лупа */}
        {icon === "⌕" && (
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="10.8"
              cy="10.8"
              r="6.2"
              stroke="currentColor"
              strokeWidth="1.7"
            />

            <path
              d="M15.5 15.5L20 20"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* My Fullness — сердце */}
        {icon === "♡" && (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 20.2C11.7 20.2 11.4 20.1 11.1 19.9C6.1 16.5 3.5 13.7 3.5 10.3C3.5 7.6 5.4 5.5 7.9 5.5C9.6 5.5 11 6.4 12 7.7C13 6.4 14.4 5.5 16.1 5.5C18.6 5.5 20.5 7.6 20.5 10.3C20.5 13.7 17.9 16.5 12.9 19.9C12.6 20.1 12.3 20.2 12 20.2Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

      </span>

      <span className="whitespace-nowrap">
        {label}
      </span>

    </Link>
  );
}


/* ПУНКТ БУРГЕР-МЕНЮ */
function MenuItem({
  label,
  href,
  heart = false,
  onClick,
}: {
  label: string;
  href?: string;
  heart?: boolean;
  onClick?: () => void;
}) {

  const content = (
    <>
      <span>
        {label}
      </span>

      {heart && (
        <svg
          className="ml-2"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M20.8 8.8C20.8 13.2 12 19 12 19C12 19 3.2 13.2 3.2 8.8C3.2 6.1 5.1 4.2 7.6 4.2C9.2 4.2 10.8 5 12 6.4C13.2 5 14.8 4.2 16.4 4.2C18.9 4.2 20.8 6.1 20.8 8.8Z"
            fill="#8B6FC4"
            stroke="#8B6FC4"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </>
  );

  const itemClassName =
    "flex w-full items-center rounded-xl px-4 py-3 text-left text-[#172B70] transition hover:bg-[#F5F7FC]";

  if (!href) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={itemClassName}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={itemClassName}
    >
      {content}
    </Link>
  );
}