//mongo related
const config = require('./config');
const mongoose = require('mongoose');
const BusRoute = require('./mongoSchema');
//const helpers = require('./helpers');
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
Gefine GraphQL Types
*/

const busTimetableType = new GraphQLObjectType({
  name: 'bus_times',
  fields:()=>({
    bus:{type:GraphQLString},
    time:{type:GraphQLString}
  })
})

// const stopWithSpecificTimetableType = new GraphQLObjectType({
//   name: 'stopWithSpecificTimetable',
//   fields:()=>({

//   })
// })


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
    _id:{type:GraphQLInt},
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
    busRoute:{
      type: busRouteType,
      args:{
        route:{type:GraphQLString},
        direction:{type:GraphQLString}
      },
      async resolve(parentValue,args){
          /*
            let m = timetables.filter(t=>t.route === args.route && t.direction === args.direction)
          return m[0]
          */
          const {route, direction} = args
          return await BusRoute.findOne({route:route,direction:direction})
      }
      
    },
    busRoutes:{
      type: new GraphQLList(busRouteType),
      resolve(parentValue,args){
        return timetables
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
        //console.log("args ", args)
        // let r = timetables.find(t=>t.route===args.route&&t.direction ===args.direction)
        // return r.stops.find(stop=>stop.bestopid===args.bestopid)
        return await BusRoute.find({route:route,direction:direction,"stops.bestopid": bestopid})
        .exec()
        .then(doc=>{
          return doc[0].stops.find(stop=>stop.bestopid === bestopid)
        })
      }
    },
    //think this will replace main stop query
    // stopWithSpecificTimetable:{
    //   type: busStopType,
    //   args:{
    //     route:{type:GraphQLString},
    //     direction:{type:GraphQLString},
    //     bestopid: {type:GraphQLString},
    //     day:{type:GraphQLString}
    //   },
    //   async resolve(parentValue,args){
    //     let { route, direction, bestopid } = args;
    //     return await BusRoute.find({route:route,direction:direction,"stops.bestopid": bestopid})
    //     .exec()
    //     .then(doc=>{
    //       const timetableRequested = helpers.getTimetableName(args.day)
    //       let respondWithtimetable = {}
          
          
    //       let y = doc[0].stops.find(stop=>stop.bestopid === bestopid)
    //       respondWithtimetable[`${timetableRequested}`] = y[timetableRequested];
    //       console.log("resp with... " , respondWithtimetable)
    //       y
    //       return y
    //     })
    //   }
    // },


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
    }

  }
})

module.exports = new GraphQLSchema({
 query: RootQuery
})

