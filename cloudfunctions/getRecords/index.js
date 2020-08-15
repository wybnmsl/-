// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
	env:'moguwai-6d96u'
})
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
	const wxContext = cloud.getWXContext()
	const result = await db.collection('records').get()
	console.log('result:',result)
	return result
}