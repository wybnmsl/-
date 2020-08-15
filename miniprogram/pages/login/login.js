// miniprogram/pages/login/login.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: './user-unlogin.png',
    isLogin:false,
    userInfo:{},
  },

  onLoad: function() {
    if (!wx.cloud) {
      return
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                isLogin :true,
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
              app.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
    wx.cloud.callFunction({
      name: 'getOpenID',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result)
        app.globalData.OpenID = res.result
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
    })
  },

  onGetUserInfo:function(e){
    if (!this.data.logged && e.detail.userInfo) {
      this.setData({
        isLogin: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
      app.globalData.userInfo = e.detail.userInfo
      wx.cloud.callFunction({
        name: 'getOpenID',
        data: {},
        success: res => {
          console.log('[云函数] [login] user openid: ', res.result)
          app.globalData.OpenID = res.result
        },
        fail: err => {
          console.error('[云函数] [login] 调用失败', err)
        }
      })
    }
  },

  goIntoroom:function(){
    wx.navigateTo({
      url: '../chatroom/chatroom',
    })
  },

  logout:function(){
    this.setData({
      avatarUrl: './user-unlogin.png',
      isLogin:false,
      userInfo:{},
    })
  }

})