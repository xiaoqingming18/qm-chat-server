export const getCaptchaMailContent = (captchaCode) => {
  return `<p>你的注册验证码是 ${captchaCode}</p>
  <p>有效期为 4 分钟</p>`;
};
