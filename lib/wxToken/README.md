<!--
 * @Description: 微信授权和签名封装
 * @Author: Hexon
 * @Date: 2020-04-08 14:18:28
 * @LastEditors: Hexon
 * @LastEditTime: 2020-04-16 17:12:52
 -->

# wxAuth v0.1.0

用于微信授权和微信签名

## Installation

**Using npm:**
`$ npm i wxAuth -S`

**In project:**

```js
import wxAuth from "wxAuth";

const WxInstance = WxAuth.getInstance();

const authHttp = () => {
  const searchParams = locationSearch(window.location.search);
  return WxInstance.wxAuth(loginApi.wxGetJsapiSignature, loginApi.wxGetAuth, {
    auth: {
      code: searchParams.code,
      type: "parent",
      clientKey: searchParams.clientKey || "",
    },
    signature: {
      clientKey: searchParams.clientKey || "",
      url: window.location.href.split("#")[0],
    },
  });
};

// vue-router beforeEach
xport function routerBeforeEachFunc(to, from, next) {
  authHttp()
    .then((res) => {
      // 已授权
      if (res.status === 'authed') {
        // 判断是否已经获取了用户信息，如果没有获取，则在此处获取
      } else if (res.status === 'failed') {
        // 表示授权失败
        // eslint-disable-next-line no-invalid-this
        this.$toast.fail(res.message)
      }
      next()
    })
    .catch(() => {
      // 如果是生产环境，则需要重定向到微信授权页面，进入到此处，说明url上没有code，session中也没有token
      if (process.env.NODE_ENV === 'production') {
        WxInstance.wxAuthRedirect()
      } else {
        // 开发环境，可以在此处写入token信息到session中
        next()
      }
    })
}
```
