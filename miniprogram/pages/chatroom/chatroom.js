// miniprogram/pages/chatroom/chatroom.js
const app = getApp()
var inputVal = '';
var testval = '';
var windowWidth = wx.getSystemInfoSync().windowWidth;
var windowHeight = wx.getSystemInfoSync().windowHeight;
var keyHeight = 0;
let db = wx.cloud.database()
//微信小程序新录音接口，录出来的是aac或者mp3，这里要录成mp3
const mp3Recorder = wx.getRecorderManager()
const mp3RecoderOptions = {
  duration: 60000,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: 'mp3',
  //frameSize: 50
}
const innerAudioContext = wx.createInnerAudioContext()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    records:[],
    scrollHeight: '100vh',
    inputBottom: 0,
  },

  /**
   * 获取聚焦
   */
  focus: function(e) {
    keyHeight = e.detail.height;
    this.setData({
      scrollHeight: (windowHeight - keyHeight) + 'px'
    });
    this.setData({
      toView: 'msg-' + (this.data.records.length - 1),
      inputBottom: keyHeight + 'px'
    })
    //计算msg高度
    // calScrollHeight(this, keyHeight);

  },

  //失去聚焦(软键盘消失)
  blur: function(e) {
    this.setData({
      scrollHeight: '100vh',
      inputBottom: 0
    })
    this.setData({
      toView: 'msg-' + (this.data.records.length - 1)
    })
  },

  /**
   * 发送点击监听
   */
  sendClick: function(e) {
    wx.showLoading({
      title: '检测文字中',
    })
    let that = this
    console.log('context',e.detail.value)
    wx.cloud.callFunction({
      name:'textsec',//云函数名称
      data:{
        text:e.detail.value//检测的文字
      },
      success(){//文字安全
        wx.showLoading({
          title: '上传文字中',
        })
        that.savecontext(e.detail.value)
      },
      fail(e){//文字不安全
        wx.hideLoading();
        wx.showModal({
          title:'提示',
          content:'你发表的话语中有不安全内容，请修整后重试',
          showCancel:false
        })
      }
    })
  },

  icontest:function(e) {
    console.log("icontest is running! inputVal value is :",testval)
    // this.setData({
    //  testval: testval + "???" 
    // })
    testval = testval + "???" 
    this.setData({
     testval
    })
  },

   formName:function (e) {
    // this.setData({
    //   testval: e.detail.value
    // })
    testval = e.detail.value
    console.log("set testval to:",testval)
    console.log("set cursor to:",e.detail.cursor)
  },


  savecontext:function(e){
    console.log("savecontext is running")
    inputVal = '';
    this.setData({
      inputVal
    })
    console.log('records:',this.data.records)
    db.collection('records').add({
      data:{
        nickName:app.globalData.userInfo.nickName,
        avatarUrl:app.globalData.userInfo.avatarUrl,
        content:e,
        type : 0,
        fileID:''
      }
    })
    wx.hideLoading();
  },

  onLoad: function(){
    this.loadInfo()
    this.setWatcher()
    this.initRecord()
  },

  initRecord:function(){
    let that = this
    //onLoad中为录音接口注册两个回调函数，主要是onStop，拿到录音mp3文件的文件名（不用在意文件后辍是.dat还是.mp3，后辍不决定音频格式）
    mp3Recorder.onStart(() => {
      console.log('mp3Recorder.onStart()...')
    })
    mp3Recorder.onStop((res) => {
      console.log('mp3Recorder.onStop() ' , res)
      const { tempFilePath } = res
      console.log('mp3Recorder.onStop() tempFilePath:' + tempFilePath)
      that.uploadVideo(res)
    })
  },

  uploadVideo:function(e){
    wx.showLoading({
      title: '上传音频中',
    })
    wx.cloud.uploadFile({
      cloudPath: `Media/${Date.now()}-${Math.floor(Math.random(0,1)*1000)}.mp3`,
      filePath:e.tempFilePath,
      success:(res)=>{
        console.log('video:',res)
        this.addVideo(res)
      },
      fail:(err)=>{console.log('err:',err)}
    })
  },

  addVideo:function(e){
    console.log('e:',e)
    db.collection('records').add({
      data:{
        nickName:app.globalData.userInfo.nickName,
        avatarUrl:app.globalData.userInfo.avatarUrl,
        content:'',
        type : 3,
        fileID:e.fileID,
      }
    })
    wx.hideLoading()
  },

  loadInfo:async function(){
    let result = {}
    wx.cloud.callFunction({
      name:'getRecords',
      success: res =>{
        console.log('exam:',res.result)
        result = res.result
        let records = []
      console.log('num',result.data)
      for(let item in result.data){
        let isMine = false
        if(result.data[item]._openid == app.globalData.OpenID){
          isMine = true
        }
        records.push({
          isMine:isMine,
          nickName:result.data[item].nickName,
          avatarUrl:result.data[item].avatarUrl,
          type:result.data[item].type,
          content:result.data[item].content,
          fileID:result.data[item].fileID
        })
        console.log('item:',item)
      }
      this.setData({
        records:records
      })
      console.log('records',this.data.records)
      }
    })
  },

  setWatcher:function(){
    let that = this
    const watcher = db.collection('records').watch({
      onChange: function(snapshot) {
        if(snapshot.docChanges.length>0 && snapshot.docChanges[0].dataType == "add"){
          console.log('snapshot', snapshot.docChanges[0])
          let isMine = false
          if(snapshot.docChanges[0].doc._openid == app.globalData.OpenID){
            isMine = true
          }
          let item = {
            isMine:isMine,
            nickName:snapshot.docChanges[0].doc.nickName,
            avatarUrl:snapshot.docChanges[0].doc.avatarUrl,
            type:snapshot.docChanges[0].doc.type,
            content:snapshot.docChanges[0].doc.content,
            fileID:snapshot.docChanges[0].doc.fileID
          }
          let records = that.data.records
          records.push(item)
          that.setData({
            records:records
          })
        }
       
      },
      onError: function(err) {
        console.error('the watch closed because of error', err)
      }
    })   
  },

  chooseMedio:function(){
    let that = this
    wx.chooseMedia({
      count: 9,
      mediaType: ['image','video'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success(res) {
        console.log('res:',res)
        that.uploadFile(res.tempFiles,res.type)
      },
      fail(res){
        console.log('err:',res)
      }
    })
  },

  uploadFile:function(imgs,type){
    console.log('imgs:',imgs)
    wx.showLoading({
      title: '上传图片视频中...',
      mask:true
    })
    const uploadTasks = imgs.map(
      item =>{
        if(type == 'image'){
          return wx.cloud.uploadFile({
            cloudPath: `Media/${Date.now()}-${Math.floor(Math.random(0,1)*1000)}.png`,
            filePath:item.tempFilePath
          })
        }
        else if(type == 'video'){
          return wx.cloud.uploadFile({
            cloudPath: `Media/${Date.now()}-${Math.floor(Math.random(0,1)*1000)}.mp4`,
            filePath:item.tempFilePath
          })
        }
      })
      Promise.all(uploadTasks).then(res=>{
        this.checkPic(res,type)
        console.log('upload res:',res)
      }).catch(err=>{
        console.log('err:',err)
        wx.hideLoading()
        wx.showToast({
          title: '上传图片视频资源异常',
          icon:'error'
        })
      })
  },

  checkPic:async function(e,type){
    let that = this
    if(type == "image"){
      wx.showLoading({
        title:'检测图片中'
      })
      const albumPhotos = e.map(item =>({
        fileID :item.fileID
      }))
      let passPhotos = []
      for(let i in albumPhotos){
        console.log('i',i)
        let secres = await that.imagesec(albumPhotos[i].fileID);
        if(secres)
        //TODO 图片安全检测
        passPhotos.push({fileID:albumPhotos[i].fileID})
      }
      if(passPhotos.length != 0){
        that.addMedia(passPhotos,type)
      }
    }
    else{
      this.addMedia(e,type)
    }
  },

  imagesec:function(fileID){
    //TODO 图片安全检查
    return new Promise((resolve, reject)=>{
      wx.cloud.callFunction({
        name:'imagesec',
        data:{
          img:fileID
        },
        success(res){
          resolve(true);
        },
        fail(e){
          wx.cloud.deleteFile({
            fileList: [fileID]
          });
          resolve(false);
        }
      });
    })
    //TODO 图片安全检查
  },

  addMedia:function(e,type){    
    wx.showLoading({
      title:'添加图片视频中'
    })
    let iType = 1
    if(type == "video"){
      iType = 2
    }
    const albumPhotos = e.map(item =>({
      fileID :item.fileID
    }))
    console.log('al:',albumPhotos)
    for(let i in albumPhotos){
      console.log('i',i)
      db.collection('records').add({
        data:{
          nickName:app.globalData.userInfo.nickName,
          avatarUrl:app.globalData.userInfo.avatarUrl,
          content:'',
          type : iType,
          fileID:albumPhotos[i].fileID,
        }
      })
    }
    wx.hideLoading()
  },

  touchdown: function () {
    //touchdown_mp3: function () {
      console.log("mp3Recorder.start with", mp3RecoderOptions)
      mp3Recorder.start(mp3RecoderOptions)
    },

    touchup: function () {
    //touchup_mp3: function () {
      console.log("mp3Recorder.stop")
      mp3Recorder.stop()
    },

  previewImage:function(e){
    console.log('fileID:',e)
    wx.previewImage({
      urls: [e.target.dataset.src],
    })
  },

  play:function(e){
    console.log('点击了')
    innerAudioContext.src = e.target.dataset.src
    innerAudioContext.play()
  },
})