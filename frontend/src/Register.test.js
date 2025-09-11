import { describe, it, expect } from "@jest/globals";

// ฟังก์ชันที่ต้องทดสอบ
function validate_password(password) {
  return (
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    /[A-Z]/.test(password)
  );
}

describe("validate_password", () => {
  it('should return true for "Abc12345"', () => {
    expect(validate_password("Abc12345")).toBe(true);
  });

  it('should return false for "abc"', () => {
    expect(validate_password("abc")).toBe(false);
  });

  it('should return false for "ABCDEFG"', () => {
    expect(validate_password("ABCDEFG")).toBe(false);
  });

  it('should return false for "12345678"', () => {
    expect(validate_password("12345678")).toBe(false);
    });
});