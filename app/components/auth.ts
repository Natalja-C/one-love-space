type User = {
  name: string;
  email: string;
  password: string;
};

const USER_KEY = "oneLoveSpaceUsers";
const AUTH_KEY = "oneLoveSpaceAuth";
const CURRENT_USER_KEY = "oneLoveSpaceCurrentUser";

const LEGACY_OWNER_EMAIL = "nataljacapkevic@gmail.com";

function migrateLegacyDataForUser(email: string) {
  if (email !== LEGACY_OWNER_EMAIL) {
    return;
  }

  const legacyKeys = [
    "oneLoveSpaceDiaryEntries",
    "oneLoveSpacePracticeHistory",
  ];

  legacyKeys.forEach((baseKey) => {
    const personalKey = `${baseKey}:${email}`;

    const personalData = localStorage.getItem(personalKey);
    const legacyData = localStorage.getItem(baseKey);

    if (!legacyData) {
      return;
    }

    let personalIsEmpty = !personalData;

    if (personalData) {
      try {
        const parsed = JSON.parse(personalData);

        personalIsEmpty =
          Array.isArray(parsed) && parsed.length === 0;
      } catch {
        personalIsEmpty = false;
      }
    }

    if (personalIsEmpty) {
      localStorage.setItem(personalKey, legacyData);
    }
  });
}

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 32;

const passwordPattern =
  /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/;

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


/* ================================================== */
/* РЕГИСТРАЦИЯ */
/* ================================================== */

export function registerUser(
  name: string,
  email: string,
  password: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  /* Проверка email */
  if (!emailPattern.test(normalizedEmail)) {
    return {
      success: false,
      message: "Введите корректный адрес электронной почты.",
    };
  }

  /* Проверка длины пароля */
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      message:
        "Пароль должен состоять из латинских букв, цифр или специальных символов и содержать не менее 6 символов.",
    };
  }

  /* Проверка допустимых символов */
  if (!passwordPattern.test(password)) {
    return {
      success: false,
      message:
        "Пароль должен состоять из латинских букв, цифр или специальных символов и содержать не менее 6 символов.",
    };
  }

  /* Максимальная длина */
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      success: false,
      message: "Пароль не может содержать более 32 символов.",
    };
  }

  /* Получаем существующих пользователей */
  const storedUsers = localStorage.getItem(USER_KEY);

  const users: User[] = storedUsers
    ? JSON.parse(storedUsers)
    : [];

  /* Проверяем именно этот email */
  const existingUser = users.find(
    (user) => user.email.toLowerCase() === normalizedEmail
  );

  if (existingUser) {
    return {
      success: false,
      message: "Пользователь с такой почтой уже существует.",
    };
  }

  /* Создаём пользователя */
  const user: User = {
    name: name.trim(),
    email: normalizedEmail,
    password,
  };

  users.push(user);

  localStorage.setItem(USER_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_KEY, "true");

  return {
    success: true,
  };
}


/* ================================================== */
/* ВХОД */
/* ================================================== */

export function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  /* Проверка email */
  if (!emailPattern.test(normalizedEmail)) {
    return {
      success: false,
      message: "Введите корректный адрес электронной почты.",
    };
  }

  const storedUsers = localStorage.getItem(USER_KEY);

  if (!storedUsers) {
    return {
      success: false,
      message: "Пользователь с такой почтой не найден.",
    };
  }

  const users: User[] = JSON.parse(storedUsers);

  const user = users.find(
    (user) => user.email.toLowerCase() === normalizedEmail
  );

  if (!user) {
    return {
      success: false,
      message: "Пользователь с такой почтой не найден.",
    };
  }

  if (user.password !== password) {
    return {
      success: false,
      message: "Неверная электронная почта или пароль.",
    };
  }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    localStorage.setItem(AUTH_KEY, "true");

    migrateLegacyDataForUser(normalizedEmail);

    return {
      success: true,
    };
}


/* ================================================== */
/* ВЫХОД */
/* ================================================== */

export function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

/* ================================================== */
/* ИЗМЕНЕНИЕ ИМЕНИ */
/* ================================================== */

export function updateUserName(name: string) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return {
      success: false,
      message: "Пользователь не найден.",
    };
  }

  const newName = name.trim();

  if (!newName) {
    return {
      success: false,
      message: "Имя не может быть пустым.",
    };
  }

  const storedUsers = localStorage.getItem(USER_KEY);

  if (!storedUsers) {
    return {
      success: false,
      message: "Пользователь не найден.",
    };
  }

  const users: User[] = JSON.parse(storedUsers);

  const updatedUsers = users.map((user) =>
    user.email.toLowerCase() === currentUser.email.toLowerCase()
      ? { ...user, name: newName }
      : user
  );

  const updatedUser = {
    ...currentUser,
    name: newName,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(updatedUsers));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

  return {
    success: true,
  };
}


/* ================================================== */
/* ИЗМЕНЕНИЕ ПАРОЛЯ */
/* ================================================== */

export function updatePassword(
  currentPassword: string,
  newPassword: string
) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return {
      success: false,
      message: "Пользователь не найден.",
    };
  }

  if (currentUser.password !== currentPassword) {
    return {
      success: false,
      message: "Неверный текущий пароль.",
    };
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      message:
        "Пароль должен состоять из латинских букв, цифр или специальных символов и содержать не менее 6 символов.",
    };
  }

  if (!passwordPattern.test(newPassword)) {
    return {
      success: false,
      message:
        "Пароль должен состоять из латинских букв, цифр или специальных символов и содержать не менее 6 символов.",
    };
  }

  if (newPassword.length > PASSWORD_MAX_LENGTH) {
    return {
      success: false,
      message: "Пароль не может содержать более 32 символов.",
    };
  }

  const storedUsers = localStorage.getItem(USER_KEY);

  if (!storedUsers) {
    return {
      success: false,
      message: "Пользователь не найден.",
    };
  }

  const users: User[] = JSON.parse(storedUsers);

  const updatedUsers = users.map((user) =>
    user.email.toLowerCase() === currentUser.email.toLowerCase()
      ? { ...user, password: newPassword }
      : user
  );

  const updatedUser = {
    ...currentUser,
    password: newPassword,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(updatedUsers));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

  return {
    success: true,
  };
}

/* ================================================== */
/* ПРОВЕРКА АВТОРИЗАЦИИ */
/* ================================================== */

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}


/* ================================================== */
/* ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ */
/* ================================================== */

export function getCurrentUser(): User | null {
  const storedUser = localStorage.getItem(CURRENT_USER_KEY);

  if (!storedUser) {
    return null;
  }

  return JSON.parse(storedUser);
}

export function getUserStorageKey(baseKey: string) {
  const user = getCurrentUser();

  if (!user) {
    return `${baseKey}:guest`;
  }

  return `${baseKey}:${user.email.trim().toLowerCase()}`;
}