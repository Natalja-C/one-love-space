import { createClient } from "../../lib/supabase/client";

type User = {
  name: string;
  email: string;
};

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 32;

const passwordPattern =
  /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/;

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


/* ================================================== */
/* РЕГИСТРАЦИЯ */
/* ================================================== */

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const supabase = createClient();

  const normalizedEmail =
    email.trim().toLowerCase();

  const normalizedName =
    name.trim();

  if (!normalizedName) {
    return {
      success: false,
      message: "Пожалуйста, введите ваше имя.",
    };
  }

  if (!emailPattern.test(normalizedEmail)) {
    return {
      success: false,
      message:
        "Введите корректный адрес электронной почты.",
    };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      message:
        "Пароль должен состоять из латинских букв, цифр или специальных символов и содержать не менее 6 символов.",
    };
  }

  if (!passwordPattern.test(password)) {
    return {
      success: false,
      message:
        "Пароль должен состоять из латинских букв, цифр или специальных символов и содержать не менее 6 символов.",
    };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      success: false,
      message:
        "Пароль не может содержать более 32 символов.",
    };
  }

  const { data, error } =
    await supabase.auth.signUp({
      email: normalizedEmail,
      password,

      options: {
        data: {
          name: normalizedName,
        },
      },
    });

  if (error) {
    const message =
      error.message.toLowerCase();

    if (
      message.includes("already") ||
      message.includes("registered")
    ) {
      return {
        success: false,
        message:
          "Пользователь с такой почтой уже существует.",
      };
    }

    return {
      success: false,
      message:
        "Не удалось создать аккаунт. Попробуйте ещё раз.",
    };
  }

  if (!data.user) {
    return {
      success: false,
      message:
        "Не удалось создать аккаунт.",
    };
  }

  return {
    success: true,
  };
}


/* ================================================== */
/* ВХОД */
/* ================================================== */

export async function loginUser(
  email: string,
  password: string
) {
  const supabase = createClient();

  const normalizedEmail =
    email.trim().toLowerCase();

  if (!emailPattern.test(normalizedEmail)) {
    return {
      success: false,
      message:
        "Введите корректный адрес электронной почты.",
    };
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

  if (error || !data.user) {
    return {
      success: false,
      message:
        "Неверная электронная почта или пароль.",
    };
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", data.user.id)
      .single();

  const name =
    profile?.name ||
    data.user.user_metadata?.name ||
    "Пользователь";


  return {
    success: true,
  };
}


/* ================================================== */
/* ВЫХОД */
/* ================================================== */

export async function logoutUser() {
  const supabase = createClient();

  const { error } =
    await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      message:
        "Не удалось выйти из аккаунта.",
    };
  }

  return {
    success: true,
  };
}


/* ================================================== */
/* ИЗМЕНЕНИЕ ИМЕНИ */
/* ================================================== */

export async function updateUserName(
  name: string
) {
  const supabase = createClient();

  const newName = name.trim();

  if (!newName) {
    return {
      success: false,
      message:
        "Имя не может быть пустым.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message:
        "Пользователь не найден.",
    };
  }

  const { error } =
    await supabase
      .from("profiles")
      .update({
        name: newName,
        updated_at:
          new Date().toISOString(),
      })
      .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      message:
        "Не удалось изменить имя.",
    };
  }

  await supabase.auth.updateUser({
    data: {
      name: newName,
    },
  });

  return {
    success: true,
  };
}


/* ================================================== */
/* ИЗМЕНЕНИЕ ПАРОЛЯ */
/* ================================================== */

export async function updatePassword(
  currentPassword: string,
  newPassword: string
) {
  const supabase = createClient();

  if (
    newPassword.length <
    PASSWORD_MIN_LENGTH
  ) {
    return {
      success: false,
      message:
        "Новый пароль должен содержать не менее 6 символов.",
    };
  }

  if (!passwordPattern.test(newPassword)) {
    return {
      success: false,
      message:
        "Пароль содержит недопустимые символы.",
    };
  }

  if (
    newPassword.length >
    PASSWORD_MAX_LENGTH
  ) {
    return {
      success: false,
      message:
        "Пароль не может содержать более 32 символов.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      success: false,
      message:
        "Пользователь не найден.",
    };
  }

  const { error: passwordCheckError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

  if (passwordCheckError) {
    return {
      success: false,
      message:
        "Неверный текущий пароль.",
    };
  }

  const { error } =
    await supabase.auth.updateUser({
      password: newPassword,
    });

  if (error) {
    return {
      success: false,
      message:
        "Не удалось изменить пароль.",
    };
  }

  return {
    success: true,
  };
}


/* ================================================== */
/* ПРОВЕРКА АВТОРИЗАЦИИ */
/* ================================================== */

export async function isAuthenticated() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return Boolean(session);
}


/* ================================================== */
/* ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ */
/* ================================================== */

export async function getCurrentUser():
  Promise<User | null> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.id)
      .single();

  const currentUser = {
    name:
      profile?.name ||
      user.user_metadata?.name ||
      "Пользователь",

    email:
      user.email ?? "",
  };

  return currentUser;
}