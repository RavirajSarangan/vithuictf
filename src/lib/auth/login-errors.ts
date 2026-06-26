export const LOGIN_ERROR = {
  INVALID_EMAIL: "INVALID_EMAIL",
  STUDENT_ID_INVALID: "STUDENT_ID_INVALID",
  STUDENT_ID_NOT_FOUND: "STUDENT_ID_NOT_FOUND",
  STAFF_EMAIL_ONLY: "STAFF_EMAIL_ONLY",
  STUDENT_ID_ONLY: "STUDENT_ID_ONLY",
} as const;

export type LoginErrorCode = (typeof LOGIN_ERROR)[keyof typeof LOGIN_ERROR];

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isLoginErrorCode(message: string): message is LoginErrorCode {
  return Object.values(LOGIN_ERROR).includes(message as LoginErrorCode);
}
