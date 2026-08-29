"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
  const exchangeRecoveryCode = async () => {
    const code =
      new URLSearchParams(
        window.location.search
      ).get("code");

    if (!code) {
      setMessage(
        "Ссылка для восстановления пароля недействительна."
      );
      return;
    }

    const supabase = createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code
      );

    if (error) {
      setMessage(
        "Ссылка для восстановления пароля недействительна или устарела."
      );
    }
  };

  exchangeRecoveryCode();
}, []);

  const handleResetPassword = async () => {
    setMessage("");

    if (password.length < 6) {
      setMessage(
        "Новый пароль должен содержать не менее 6 символов."
      );
      return;
    }

    if (password.length > 32) {
      setMessage(
        "Пароль не может содержать более 32 символов."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Пароли не совпадают.");
      return;
    }

    setIsSaving(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    setIsSaving(false);

    if (error) {
      setMessage(
        "Не удалось изменить пароль. Попробуйте открыть ссылку из письма ещё раз."
      );
      return;
    }

    setMessage("Пароль успешно изменён.");

    setTimeout(() => {
      router.replace("/welcome");
    }, 1200);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEF3FA] px-5">
      <div
        className="
          w-full max-w-[455px]
          rounded-[28px]
          border border-white/60
          bg-white/90
          px-8 py-9
          shadow-[0_20px_60px_rgba(63,83,145,0.18)]
          sm:px-10
        "
      >
        <div className="mb-5 flex justify-center">
          <img
            src="/one-love-space-brand.svg"
            alt="One Love Space"
            className="h-auto w-[205px]"
          />
        </div>

        <div className="mb-6 text-center">
          <h1 className="font-[family-name:var(--font-cormorant)] text-[34px] font-light leading-tight text-[#344B91]">
            Новый пароль
          </h1>

          <p className="mt-2 text-[15px] text-[#7D87B5]">
            Придумайте новый пароль для своего аккаунта
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            placeholder="Новый пароль"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="
              h-[50px] w-full rounded-xl
              border border-[#D9DCF0]
              bg-white/70
              px-4
              text-[15px] text-[#344B91]
              outline-none
              transition
              placeholder:text-[#9AA2C5]
              focus:border-[#8B8FD5]
              focus:ring-2 focus:ring-[#B8B8E8]/20
            "
          />

          <input
            type="password"
            placeholder="Повторите новый пароль"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            className="
              h-[50px] w-full rounded-xl
              border border-[#D9DCF0]
              bg-white/70
              px-4
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
            onClick={handleResetPassword}
            disabled={isSaving}
            className="
              h-[50px] w-full rounded-xl
              bg-[#667CC9]
              text-[15px] font-medium text-white
              shadow-[0_7px_18px_rgba(91,108,185,0.22)]
              transition
              hover:bg-[#5D72BF]
              disabled:cursor-default
              disabled:opacity-60
            "
          >
            {isSaving
              ? "Сохраняем..."
              : "Сохранить новый пароль"}
          </button>
        </div>

        {message && (
          <p className="mt-4 text-center text-[13px] leading-5 text-[#667CC9]">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}