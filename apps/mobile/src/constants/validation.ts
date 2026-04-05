import * as yup from "yup";

export const phoneSchema = yup.object({
  phone: yup
    .string()
    .required("Vui lòng nhập số điện thoại")
    .matches(/^\d{10}$/, "Số điện thoại phải gồm 10 chữ số"),
});

export const otpSchema = yup.object({
  otp: yup
    .string()
    .required("Vui lòng nhập mã OTP")
    .matches(/^\d{6}$/, "Mã OTP gồm 6 chữ số"),
});

export const registerSchema = yup.object({
  name: yup.string().required("Vui lòng nhập tên").min(2, "Tên quá ngắn"),
});

export const resetPasswordSchema = yup
  .object({
    password: yup
      .string()
      .required("Vui lòng nhập mật khẩu")
      .min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: yup
      .string()
      .required("Vui lòng xác nhận mật khẩu")
      .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp"),
  })
  .required();
