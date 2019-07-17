//mongo related
const config = require('./config');
const mongoose = require('mongoose');
const BusRoute = require('./mongoSchema');
const helpers = require('./helpers');
const axios = require('axios');
const{
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
} = require('graphql');

//timetables is being phased out
const timetables = require('./timetablesOut.json');

mongoose.connect(config.MONGO_URI,{useNewUrlParser:true})


/*
Define GraphQL Types for rtpi response
*/


const rtpiResult = new GraphQLObjectType({
  name: 'rtpi_result',
  fields:()=>({
    arrivaldatetime:{type:GraphQLString},
    duetime:{type:GraphQLString},
    departuredatetime:{type:GraphQLString},
    departureduetime:{type:GraphQLString},
    scheduledarrivaldatetime:{type:GraphQLString},
    scheduleddeparturedatetime:{type:GraphQLString},
    destination:{type:GraphQLString},
    destinationlocalized:{type:GraphQLString},
    origin:{type:GraphQLString},
    originlocalized:{type:GraphQLString},
    direction:{type:GraphQLString},
    operator:{type:GraphQLString},
    operatortype:{type:GraphQLString},
    additionalinformation:{type:GraphQLString},
    lowfloorstatus:{type:GraphQLString},
    route:{type:GraphQLString},
    sourcetimestamp:{type:GraphQLString},
    monitored:{type:GraphQLString},
  })
})

const rtpiResponse = new GraphQLObjectType({
  name: 'rtpi_response',
  fields:()=>({
    errorcode:{type:GraphQLString},
    errormessage:{type:GraphQLString},
    numberofresults:{type:GraphQLString},
    stopid:{type:GraphQLString},
    timestamp:{type:GraphQLString},
    results:{type:GraphQLList(rtpiResult)}	
  })
})



const busTimetableType = new GraphQLObjectType({
  name: 'bus_times',
  fields:()=>({
    bus:{type:GraphQLString},
    time:{type:GraphQLString},
    snapshots:{type: GraphQLList(snapshotType)},
    dry_snaps:{type: GraphQLList(snapshotType)},
    wet_snaps:{type: GraphQLList(snapshotType)},
    dry_avg:{type: GraphQLInt},
    num_dry:{type:GraphQLInt},
    num_wet:{type:GraphQLInt},
    num_total:{type:GraphQLInt},
    wet_avg:{type: GraphQLInt},
    total_avg:{type: GraphQLInt}
  })
})

const WeatherType = new GraphQLObjectType({
name: 'weather',
  fields:()=>({
    lastUpdated:{type:GraphQLString},
    precipIntensity:{type:GraphQLString},
    summary:{type:GraphQLString},
    icon:{type:GraphQLString}
  })
})

const snapshotType = new GraphQLObjectType({
  name:'snapshot',
  fields:()=>({
    _id:{type:GraphQLString},
    queryScheduledTime:{type:GraphQLString},
    dayOfWeek:{type:GraphQLString},
    queryDateTime:{type:GraphQLString},
    forBusDue:{type:GraphQLString},
    route:{type:GraphQLString},
    direction:{type:GraphQLString},
    stop:{type:GraphQLString},
    bestopid:{type:GraphQLString},
    busname:{type:GraphQLString},
    timetabled:{type:GraphQLString},
    actual:{type:GraphQLString},
    earlyOrLate:{type:GraphQLString},
    minutesOff:{type:GraphQLString},
    weather:{type: WeatherType}
  })
})

const busStopType = new GraphQLObjectType({
  name:'Stop',
  fields:()=>({
    _id:{type:GraphQLInt},
    name:{type:GraphQLString},
    bestopid:{type:GraphQLString},
    stop_sequence:{type:GraphQLInt},
    bus_times_week:{type: GraphQLList(busTimetableType)},
    bus_times_sat:{type: GraphQLList(busTimetableType)}, 
    bus_times_sun:{type: GraphQLList(busTimetableType)},
    snapshots: {type: GraphQLList(snapshotType)}

  })
})

const SingleStopSnapType = new GraphQLObjectType({
  name:'SingleStopSnap',
  fields:()=>({
    _id:{type:GraphQLInt},
    name:{type:GraphQLString},
    bestopid:{type:GraphQLString},
    stop_sequence:{type:GraphQLInt},
    timetable_name: {type:GraphQLString},
    bus_times:{type: GraphQLList(busTimetableType)},
    snapshots: {type: GraphQLList(snapshotType)}

  })
})

const basicBusStopType = new GraphQLObjectType({
  name:'BasicStop',
  fields:()=>({
    route:{type:GraphQLString},
    direction:{type:GraphQLString},
    name:{type:GraphQLString},
    bestopid:{type:GraphQLString},
    stop_sequence:{type:GraphQLInt}
  })
})

const busRouteType  = new GraphQLObjectType({
  name:'Route',
  fields:()=>({
    route:{type:GraphQLString},
    routename:{type:GraphQLString},
    direction:{type:GraphQLString},
    stops:{type: GraphQLList(busStopType)}
  })
})

const routeOneStopType = new GraphQLObjectType({
  name:'RouteStop',
  fields:()=>({
    route:{type:GraphQLString},
    routename:{type:GraphQLString},
    direction: {type:GraphQLString},
    stops:{type:busStopType}
  })
})


/*

GraphQL Queries

*/
const RootQuery = new GraphQLObjectType({
  name:'RootQueryType',
  fields:{
    busRouteOverview:{
      type: busRouteType,
      args:{
        route:{type:GraphQLString},
        direction:{type:GraphQLString}
      },
      async resolve(parentValue,args){
 
          const {route, direction} = args
         // return await BusRoute.findOne({route:route,direction:direction})
          let busRouteOverview = await BusRoute.aggregate([
            {$match:{route:route,direction:direction}},
            {$project:{"stops.snapshots":0}}
          ])
         // console.log("got overview>>>>>>>>>>>>>>>>>> ", busRouteOverview)
          return busRouteOverview[0]
      }
      
    },
    busRoutesOverview:{
      type: new GraphQLList(busRouteType),
      async resolve(parentValue,args){
        let routeOverviews = await BusRoute.aggregate([
          {$project:{
            _id:0,route:1,routename:1,direction:1
          }}
        ])
        return routeOverviews;
       
      }
    },
    stop:{
      type: busStopType,
      args:{
        route:{type:GraphQLString},
        direction:{type:GraphQLString},
        bestopid: {type:GraphQLString}
       
      },
      async resolve(parentValue,args){
        let { route, direction, bestopid } = args;

        return await BusRoute.find({route:route,direction:direction,"stops.bestopid": bestopid})
        .exec()
        .then(doc=>{
          return doc[0].stops.find(stop=>stop.bestopid === bestopid)
        })
      }
    },
    stop2:{
      type: busStopType,
      args:{
        route:{type:GraphQLString},
        direction:{type:GraphQLString},
        bestopid: {type:GraphQLString}
       
      },
      async resolve(parentValue,args){
        console.log("recieved request")
        let { route, direction, bestopid } = args;
        let theBusStop = await BusRoute.aggregate([
          {$match: {route:route,direction:direction}},
          {$unwind: '$stops'},
          {$match: {'stops.bestopid':bestopid}},
          {$replaceRoot: { newRoot: "$stops" }}
       ])
    
       console.log("got bus stop", theBusStop.length)
       return theBusStop[0]
      }
    },
    bus_times_x_snaps:{
      type: busStopType,
      args:{
        route:{type:GraphQLString},
        direction:{type:GraphQLString},
        bestopid: {type:GraphQLString},
        requestedTimetable: {type:GraphQLString}
       
      },
      async resolve(parentValue,args){
        //todo is there a way to limit the weather to be 'wet','dry','all' only?
        let { route, direction, bestopid, requestedTimetable } = args;
        let whichTimetable;
        let dayToday;

        //const availableTimetables = ['bus_times_week','bus_times_sat','bus_times_sun'];
        const availableTimetables = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        if(requestedTimetable !== ''){//if some param is passed, check
          if(availableTimetables.includes(requestedTimetable)){
            whichTimetable = helpers.getTimetableNameByString(requestedTimetable)
            dayToday = requestedTimetable; //eg. Mon,Tue
            //console.log("whichTimetable .is ", whichTimetable, dayToday)
          }else if(requestedTimetable.toLowerCase() === 'today'){
            console.log("defaulting to today's timetable...")
            whichTimetable = helpers.getNameOfTodaysTimetable();
            dayToday = new Date().toString().substring(0,3); //eg. Mon,Tue
          }
        else{
          throw new Error('must specify day or today')
        }
      }

     //console.log("datToday is ", dayToday)
        return await BusRoute.find({route:route,direction:direction,"stops.bestopid": bestopid, "stops.snapshots.dayOfWeek": `${dayToday}`})
        .limit(1)
        .exec()
        .then(doc=>{
          //make sure
          console.log("here?",doc[0].stops[0].snapshots.length)

          let resp = doc[0].stops.find(stop=>stop.bestopid === bestopid).toObject();
        
          //use only snapshots for today
          let relevantSnaps = resp.snapshots.filter(snap=>snap.dayOfWeek === dayToday);
          console.log(relevantSnaps)
          //use today's bus_times_X
          let relevantTimetable = resp[`${whichTimetable}`];
          
          //add appropiate snapshots to bus_times_X
          let respWithSnaps = helpers.addSnapshotsArrayToTimetable(relevantTimetable,relevantSnaps);
         
          //get an average for wet, dry and all weather
          let respWithAllAvg = helpers.doWetDryAllAverage(respWithSnaps);
          resp.bus_times_week = respWithAllAvg;
     
          return resp;
        })
      }
    },
    bus_times_x_snaps_2:{
      //type: busStopType,
      type:SingleStopSnapType,
      args:{
        route:{type:GraphQLString},
        direction:{type:GraphQLString},
        bestopid: {type:GraphQLString},
        requestedTimetable: {type:GraphQLString}
       
      },
      async resolve(parentValue,args){
        // console.log("in resolve", args.requestedTimetable)
        //requestedTimetable will be a day of the week, 3 letters only with a leading capital letter.
        let { route, direction, bestopid, requestedTimetable } = args;
        console.log("in resolve", requestedTimetable)
        if(!route || !direction || !bestopid || !requestedTimetable){
          throw new Error('Fields missing- route, direction, bestopid, requestedTimetable required.');
        }
        let whichTimetable;
        let dayToday;

        //determine which bus_times_x (timetable) to use

        const availableTimetables = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        if(requestedTimetable !== ''){//if some param is passed, check
          if(availableTimetables.includes(requestedTimetable)){
            whichTimetable = helpers.getTimetableNameByString(requestedTimetable)
            dayToday = requestedTimetable; //eg. Mon,Tue
           // console.log("whichTimetable .is ", whichTimetable, dayToday)
          }else if(requestedTimetable.toLowerCase() === 'today'){
            console.log("defaulting to today's timetable...")
            whichTimetable = helpers.getNameOfTodaysTimetable();
            dayToday = new Date().toString().substring(0,3); //eg. Mon,Tue
          }else{
            throw new Error('Please specify "today" or day of week, eg. "Mon","Tue"... for requestedTimetable Field');
          }
        }
        else{
          throw new Error('Please specify "today" or day of week, eg. "Mon","Tue"... for requestedTimetable Field')
        }
      

      //get the bus stop
     let theBusStop = await BusRoute.aggregate([
        {$match: {route:route,direction:direction}},
        {$unwind: '$stops'},
        {$match: {'stops.bestopid':bestopid}},
        {$replaceRoot: { newRoot: "$stops" }}
     ])

     //get the snapshots for dayToday/requestedTimetable
     //console.log("day today should be tuesday ", dayToday)
     let theSnapshots =  await BusRoute.aggregate([
      {$match: {route:route,direction:direction}},
      {$unwind: '$stops'},
      {$match: {'stops.bestopid':bestopid}},
      {$unwind: '$stops.snapshots'},
      {$match: {'stops.snapshots.dayOfWeek':`${dayToday}`}},
      {$replaceRoot: { newRoot: "$stops.snapshots"}}
     ])
     
        //override theBusStop (all)snapshots with only the ones that occured on dayToday/requested timetable
        theBusStop = theBusStop[0]
        console.log("before replace ",theBusStop.snapshots.length )
        //console.log(">>>>>>", theSnapshots[0])
        theBusStop.snapshots = theSnapshots
        console.log("after replace ",theBusStop.snapshots.length )

          //use appropiate bus_times_X
          let relevantTimetable = theBusStop[`${whichTimetable}`];
          //console.log("got relevant timetable")

          //add appropiate snapshots to bus_times_X
          let respWithSnaps = helpers.addSnapshotsArrayToTimetable(relevantTimetable,theBusStop.snapshots);

          //console.log("added snaps")
          //get an average for wet, dry and all weather
          let respWithAllAvg = helpers.doWetDryAllAverage(respWithSnaps);

          //add key that say's which bus_times_x
          theBusStop.timetable_name = whichTimetable;

          //add key with the new data added
          theBusStop.bus_times = respWithAllAvg;

          console.log("got avgs, returning...", theBusStop.bus_times)
          return theBusStop;
        
      }
    },
 
    routeOneStop:{
      type: routeOneStopType,
      args:{
        route:{type:GraphQLString},
        direction:{type:GraphQLString},
        bestopid: {type:GraphQLString}
      },
      async resolve(parentValue,args){
        let m = await  BusRoute.aggregate([{$unwind: "$stops"},{$match: { "route": args.route, "direction": args.direction, "stops.bestopid": args.bestopid  } }])
        console.log(m)
        return m[0];
      }
    },
    allstops:{
      type: new GraphQLList(basicBusStopType),
      
      args:{
      },resolve(parentValue,args){
        let stops = []
        timetables.forEach((route)=>{
            let p =  route.stops.map(stop=>{
              return {name:stop.name,bestopid:stop.bestopid,stop_sequence:stop.stop_sequence,route:route.route,direction:route.direction}
              
            })
         stops.push([...p])
            
        })
        
        
        return stops.flat()
      }
    },


    testq:{
      type: new GraphQLList(snapshotType),
      
      args:{
        route:{type:GraphQLString},
        direction:{type:GraphQLString},
        bestopid:{type:GraphQLString},
        dayOfWeek:{type:GraphQLString}
      },
      async resolve(parentValue,args){
        console.log("res")
        const {route,direction,bestopid,dayOfWeek} = args;

        /*
        This query returns an array of snapshots based on a day
        */
         return await BusRoute.aggregate([
          
            {$match: {route:route,direction:direction}},
            {$unwind: '$stops'},
            {$match: {'stops.bestopid':bestopid}},
            {$unwind: '$stops.snapshots'},
            {$match: {'stops.snapshots.dayOfWeek':`${dayOfWeek}`}},
            {$replaceRoot: { newRoot: "$stops.snapshots" } }
           ])
        //.exec()
        .then(doc=>{
          //console.log(doc.length, doc, doc[0].stops.snapshots.length)
          console.log(doc[0] ,doc.length)

          return doc
        })
        .catch(e=>console.log(e))
      }
    },
    rtpiRequest:{
      type: rtpiResponse,
      args:{
        route:{type:GraphQLString},
        bestopid:{type:GraphQLString}
      },
      async resolve(parentValue,args){
        const {route, bestopid} = args
          let rtpiUrl = `https://rtpiapp.rtpi.openskydata.com/RTPIPublicService_v2/service.svc/realtimebusinformation?stopid=${bestopid}&routeid=${route}&format=json`
          
 
          let rtpi = await axios.get(rtpiUrl)
          //console.log("got rtpi ", rtpi)

          return rtpi.data
      }
      
    },

  }
})

module.exports = new GraphQLSchema({
 query: RootQuery
})

