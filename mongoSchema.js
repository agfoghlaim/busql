const mongoose = require('mongoose');

const busTimesSchema = mongoose.Schema(
  
{
  bus: String,
  time: String,
}

)

const snapshotSchema = mongoose.Schema(
  
{
  _id:Number,
  queryScheduledTime: String,
  dayOfWeek: String,
  queryDateTime: String,
  forBusDue: String,
  route: String,
  direction: String,
  stop: String,
  bestopid: String,
  busname: String,
  timetabled: String,
  actual: String,
  earlyOrLate: String,
  minutesOff: String
}

)

const busStopSchema = mongoose.Schema(
  
{
  _id: Number,
  name: String,
  bestopid: String,
  stop_sequence: Number,
  bus_times_week:[busTimesSchema],
  bus_times_sat:[busTimesSchema],
  bus_times_sun:[busTimesSchema],
  snapshots:[snapshotSchema]
}

)

const mongoWeatherSchema = mongoose.Schema(

{
  lastUpdated: String,
  precipIntensity: Number,
  summary: String,
  icon: String
}
  
)

const mongoBusRoutesSchema = mongoose.Schema(
  
  
{
  _id: mongoose.Schema.Types.ObjectId,
  route: String,
  routename: String,
  direction: String,
  stops: [busStopSchema]
}

)

// const snapShotSchema = mongoose.Schema({
  
// })


module.exports = mongoose.model('BusRoute', mongoBusRoutesSchema);