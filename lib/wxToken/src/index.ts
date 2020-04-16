/*
 * @Description:
 * @Author: Hexon
 * @Date: 2019-12-13 16:36:10
 * @LastEditors: Hexon
 * @LastEditTime: 2020-04-16 14:43:26
 */
import locationSearch from "./locationSearch";
declare global {
  interface Window {
    wx: any; // 添加wx声明到window对象上，否则，调用window.wx会报错
  }
}

interface WxConfig {
  debug: boolean;

  appId: string;
  timestamp: string;
  nonceStr: string;
  signature: string;
  jsApiList: Array<string>;
}

interface WxLocation {
  code?: string;
}

// 用于声明不知道属性值的对象
interface WxSignatureResponse {
  code: number;
  result: WxConfig;
  message: string;
}

interface HttpResponse {
  code: number;
  result?: object;
  message: string;
}

interface HttpResponseAuth extends HttpResponse {
  result: {
    Authorization: string;
  };
}

interface AuthParams {
  signature: object;
  auth: object;
}

type PromiseFunc = <P>(params: P) => Promise<any>;

class SingletonWxAuth {
  private static _instance: SingletonWxAuth = new SingletonWxAuth();
  public static getInstance(): SingletonWxAuth {
    return SingletonWxAuth._instance;
  }
  private _isAuth = false; // 是否已经授权登录
  private _isWxsdkReady = false; //  微信sdk是否已准备

  // private _isWxBroswer: Boolean = false; // 是否为微信浏览器
  private _wxConfig: WxConfig = {
    debug: false,
    appId: "",
    timestamp: "",
    nonceStr: "",
    signature: "",
    jsApiList: [
      "chooseWXPay",
      "updateAppMessageShareData",
      "updateTimelineShareData", //
      "onMenuShareTimeline",
      "onMenuShareAppMessage", //
      "chooseImage",
      "previewImage",
      "uploadImage",
      "downloadImage", //
      "hideOptionMenu",
      "showOptionMenu", //
      "hideMenuItems",
      "showMenuItems", //
      "hideAllNonBaseMenuItem",
      "showAllNonBaseMenuItem",
      "closeWindow",
    ],
  }; // 通过微信sdk签名获取的微信配置

  private constructor() {
    if (SingletonWxAuth._instance) {
      throw new Error(
        "Error: Instantiation failed: Use SingletonWxAuth.getInstance() instead of new."
      );
    }
    SingletonWxAuth._instance = this;
  }

  public setWxApiList(apiList: string[]) {
    this._wxConfig.jsApiList = apiList;
  }

  public getWxApiList(): string[] {
    return this._wxConfig.jsApiList;
  }

  public getWxSdkStatus(): boolean {
    return this._isWxsdkReady;
  }

  public setWxDebug(debug: boolean) {
    this._wxConfig.debug = debug;
  }

  public wxSignatureConfig(): Promise<any> {
    return new Promise((resolve, reject) => {
      window.wx.config({
        debug: this._wxConfig.debug, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId: this._wxConfig.appId, // 必填，公众号的唯一标识
        timestamp: this._wxConfig.timestamp, // 必填，生成签名的时间戳
        nonceStr: this._wxConfig.nonceStr, // 必填，生成签名的随机串
        signature: this._wxConfig.signature, // 必填，签名
        // 必填，需要使用的JS接口列表
        jsApiList: this._wxConfig.jsApiList,
      });
      window.wx.ready(() => {
        this._isWxsdkReady = true;
        this.setWxConfigToSession(this._wxConfig);
        console.log("wx.config ok");
        resolve();
      });
      window.wx.error((err: HttpResponse) => {
        console.error("wx.config error");
        // 进行jssdk config失败 不应该阻塞微信授权，因为可能出现不需要使用jssdk的情况
        resolve();
      });
    });
  }

  // 获取微信签名
  public httpGetWxSignature<P>(http: PromiseFunc, params: P) {
    if (this._wxConfig && this._wxConfig.appId && this._wxConfig.appId.length) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      http(params)
        .then((res: WxSignatureResponse) => {
          const result: WxConfig = res.result;
          this._wxConfig.appId = result.appId;
          this._wxConfig.nonceStr = result.nonceStr;
          this._wxConfig.signature = result.signature;
          this._wxConfig.timestamp = result.timestamp;
          // 调用微信签名
          this.wxSignatureConfig()
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err: HttpResponse) => {
          reject(err);
        });
    });
  }
  /**
   * @description: 设置授权信息，因为在授权之后需要重定位，去除微信添加在url上的参数，重定位后页面重新加载，因此SingletonWxAuth重新执行
   * 导致在该实例上的属性被初始化，因此将授权信息保存到session中
   * @param {type}
   * @return:
   */
  public setAuthToSession(authInfo: HttpResponseAuth) {
    sessionStorage.setItem("SingletonWxAuth:auth", JSON.stringify(authInfo));
  }
  // 获取授权信息
  public getAuthFromSession(): HttpResponseAuth {
    return JSON.parse(sessionStorage.getItem("SingletonWxAuth:auth") || "null");
  }
  // 设置wxconfig
  public setWxConfigToSession(wxConfig: object) {
    sessionStorage.setItem(
      "SingletonWxAuth:wxConfig",
      JSON.stringify(wxConfig)
    );
  }
  // 获取wxconfig
  public getWxConfigFromSession(): WxConfig {
    return JSON.parse(
      sessionStorage.getItem("SingletonWxAuth:wxConfig") || "null"
    );
  }
  // 跳转到微信授权页面
  public wxAuthRedirect() {
    // console.log('redirectToWechatAuthUrl, _wxConfig.appId=' + _wxConfig.appId)
    // 要去掉本地的code和state参数
    const re = /(code=[A-Za-z0-9-=_]+&state=STATE[&]{0,1})/;
    let currentUrl = window.location.href.replace(re, "");
    currentUrl = currentUrl.replace("?#", "#");

    let url =
      "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" +
      this._wxConfig.appId +
      "&redirect_uri=" +
      encodeURIComponent(currentUrl) +
      "&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect";
    window.location.replace(url);
  }

  // 去除链接上面的code和STATE参数，跳转到项目地址
  public wxAuthLocationReplace() {
    // 去除code和state参数，然后跳转到页面地址
    const re = /(code=[A-Za-z0-9-=_]+&state=STATE[&]{0,1})/;
    let currentUrl = window.location.href.replace(re, "");
    currentUrl = currentUrl.replace("?#", "#");
    console.log("replace url: ", currentUrl);
    window.location.replace(currentUrl);
  }

  // 微信授权
  public wxAuth(
    httpSignature: PromiseFunc,
    httpAuth: PromiseFunc,
    authParams: AuthParams
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this._wxConfig.appId) {
        resolve();
        return;
      }
      this.httpGetWxSignature(httpSignature, authParams.signature)
        .then(() => {
          const searchObj: WxLocation = locationSearch(window.location.search);
          if (searchObj["code"]) {
            httpAuth(authParams.auth)
              .then((authRes: HttpResponseAuth) => {
                this.setAuthToSession(authRes);
                this.wxAuthLocationReplace();
              })
              .catch((err) => {
                reject(err);
              });
          } else {
            // 从session中获取授权信息
            this._isAuth = !!this.getAuthFromSession();
            if (this._isAuth) {
              resolve();
            } else {
              reject(new Error("no code，no auth"));
            }
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

export default SingletonWxAuth;
