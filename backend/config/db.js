import mongoose from 'mongoose'

export default function connectDB(){
  const uri = process.env.MONGO_URI
  if(!uri) throw new Error('MONGO_URI missing in env')
  mongoose.connect(uri).then(()=> console.log('Mongo connected')).catch(err=>{ console.error(err); process.exit(1) })
}
ps