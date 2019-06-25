const timetables = require('./timetablesOut.json')
const{
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = require('graphql');


const busTimetableTypeWeek = new GraphQLObjectType({
  name: 'bus_times_week',
  fields:()=>({
    bus:{type:GraphQLString},
    time:{type:GraphQLString}
  })
})

const busTimetableTypeSat = new GraphQLObjectType({
  name: 'bus_times_sat',
  fields:()=>({
    bus:{type:GraphQLString},
    time:{type:GraphQLString}
  })
})

const busTimetableTypeSun = new GraphQLObjectType({
  name: 'bus_times_sun',
  fields:()=>({
    bus:{type:GraphQLString},
    time:{type:GraphQLString}
  })
})

const WeatherType = new GraphQLObjectType({
name: 'weather',
  fields:()=>({
    lastUpdated:{type:GraphQLInt},
    precipIntensity:{type:GraphQLInt},
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
    name:{type:GraphQLString},
    bestopid:{type:GraphQLString},
    stop_sequence:{type:GraphQLString},
    bus_times_week:{type: GraphQLList(busTimetableTypeWeek)},
    bus_times_sat:{type: GraphQLList(busTimetableTypeSat)}, 
    bus_times_sun:{type: GraphQLList(busTimetableTypeSun)},
    snapshots: {type: GraphQLList(snapshotType)}

  })
})

// const basicBusStopTypeList = new GraphQLObjectType({
//   name: 'basicBusStopListType',

// })
// GraphQLList(busTimetableTypeWeek)
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

const RootQuery = new GraphQLObjectType({
  name:'RootQueryType',
  fields:{
    busRoute:{
      type: busRouteType,
      args:{
        route:{type:GraphQLString},
        direction:{type:GraphQLString}
      },
      resolve(parentValue,args){
          let m = timetables.filter(t=>t.route === args.route && t.direction === args.direction)
          return m[0]
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
      },resolve(parentValue,args){
        let r = timetables.find(t=>t.route===args.route&&t.direction ===args.direction)
        //console.log(r.stops.find(stop=>stop.bestopid===args.bestopid))

     
        return r.stops.find(stop=>stop.bestopid===args.bestopid)
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
        
        //console.log(stops.flat())
        return stops.flat()
      }
    }
  }
})

module.exports = new GraphQLSchema({
 query: RootQuery
})

