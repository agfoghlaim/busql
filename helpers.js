module.exports = {

  getTimetableName: function(dayno){
    console.log("dayno ", dayno)
    let dayNumber = new Date().getDay();
    if(dayno){
      dayNumber = parseInt(dayno);
    }
    
    let day = {};
    
      if(dayNumber > 0 && dayNumber < 6){
        day =  'bus_times_week'
      }else if(dayNumber === 0 ){
        day =  'bus_times_sun';
      }else if(dayNumber === 6 ){
        day =  'bus_times_sat';
      }else{
        day = 'did not get the correct day'
      }
     return day
  },
  getNameOfTodaysTimetable: function(){
    let dayNumber = new Date().getDay();
    let day = {};
    
      if(dayNumber > 0 && dayNumber < 6){
        day =  {dayName:'bus_times_week', dayNumber:dayNumber};
      }else if(dayNumber === 0 ){
        day =  {dayName:'bus_times_sun', dayNumber:dayNumber};
      }else if(dayNumber === 6 ){
        day =  {dayName:'bus_times_sat', dayNumber:dayNumber};
      }else{
        day = 'err'
      }
     return day.dayName
  },
  
  getTimetableNameByString: function(dayOfWeek){
    const weekdays = ['mon','tue','wed','thu','fri']
    if(weekdays.includes(dayOfWeek.toLowerCase())){
      return 'bus_times_week'
    }else if(dayOfWeek.toLowerCase() === 'sat'){
      return 'bus_times_sat'
    }else if(dayOfWeek.toLowerCase() === 'sun'){
      return 'bus_times_sun'
    }
  },

  isWithinMinutesOf: function(busLoadTime,beTime,numMinutes){
 
    let theirDate = new Date();
    let myDate = new Date();
    
    theirDate.setHours(beTime.substr(0,2))
    theirDate.setMinutes(beTime.substr(3,2))
    
    myDate.setHours(busLoadTime.substr(0,2))
    myDate.setMinutes(busLoadTime.substr(3,2))
  
    //subtract the largest time from the smallest time
    var diff = Math.max(theirDate.valueOf(), myDate.valueOf()) - Math.min(theirDate.valueOf(), myDate.valueOf()); 
  
    diff = diff/1000/60
  
    //is the difference less than numMinutes???
    return (diff <= numMinutes)? true : false;
  },
  addSnapshotsArrayToTimetable: function(relevantTimetable,relevantSnaps){
 
    let respWithSnaps = relevantTimetable.reduce((out,bus, j,all)=>{
      let obj = {
        bus:bus.bus,
        time:bus.time,
        snapshots:[]
      }
  
      for(let i = 0; i< relevantSnaps.length;i++){
          if(this.isWithinMinutesOf(bus.time,relevantSnaps[i].forBusDue,2)){

          obj.snapshots.push(relevantSnaps[i])
        } 
      }
      out.push(obj)
     // console.log("num of snaps for this... "+obj.time, obj.snapshots.length)
      return out
  
    },[])
    
    return respWithSnaps;
  },
  doAllTimeAverage: function(timetablesWithSnapshots){
    timetablesWithSnapshots.map(timetable=>{
      let theSnapTotalMinsLate = timetable.snapshots.reduce((out,snap,i,all)=>{
        if(snap.earlyOrLate === 'late'){
          out +=parseInt(snap.minutesOff)
        }else if(snap.earlyOrLate === 'early'){
          out -=parseInt(snap.minutesOff)
        }
        return Math.round(out)
      },0)
      let theSnapAverage = theSnapTotalMinsLate/timetable.snapshots.length
      timetable.theSnapAverage = Math.round(theSnapAverage);
      // console.log("calculating... ", theSnapTotalMinsLate, ' / ',timetable.snapshots.length ,  ' = ',  theSnapTotalMinsLate/timetable.snapshots.length )
      return timetable
    })

   return timetablesWithSnapshots

  },
  checkIfSameWeather: function(rainNum,weather){
    if(weather === 'wet'){
       if(rainNum > 0 ) return true
    }else if(weather === 'dry'){
      if(rainNum === 0 ) return true
    }else{
      return false;
    }
  },
  doWetDryAllAverage: function(timetablesWithSnapshots){
    //create dry_snaps array with only dry weather results
   
    timetablesWithSnapshots.map(bus=>{
      bus.dry_snaps = bus.snapshots.filter(snap=>this.checkIfSameWeather(snap.weather.precipIntensity,'dry'))
     
    })
    
    //create wet_snaps array with only wet weather results
    timetablesWithSnapshots.map(bus=>{
      bus.wet_snaps = bus.snapshots.filter(snap=>this.checkIfSameWeather(snap.weather.precipIntensity,'wet'))
     
    })

   
    
    /*
        Now there's 3 arrays:- 
            ie bus_times_X:[{
                bus,
                time,
                snapshots: (all snapshots),
                dry_snaps:(dry results only),
                wet_snaps:(wet results only)
              }]
            
            NEXT ADD AVERAGES FOR THE 3 SNAPSHOT ARRAYS
    */
    
    timetablesWithSnapshots.map((bus,i)=>{
      let thisBusDryAggregate = this.aggregateLateOrEarly(bus.dry_snaps)
      let thisBusWetAggregate = this.aggregateLateOrEarly(bus.wet_snaps)
      let thisBusTotalAggregate = this.aggregateLateOrEarly(bus.snapshots)
//console.log("tot", thisBusTotalAggregate)
      //to get average, divide totalEarlyOrLate by the number of snaps taken
      

      if(thisBusWetAggregate!==null){
        //if not null divide aggregate by number of non null results
        let notNullResults = bus.wet_snaps.filter(snap=>snap.earlyOrLate !== "bus_not_found_on_rtpi").length;
        if(notNullResults===0){
          bus.wet_avg = null;
        }else{
          bus.wet_avg = Math.round(thisBusWetAggregate/notNullResults)
        }
      }

      if(thisBusDryAggregate!==null){
        //if not null divide aggregate by number of non null results
        let notNullResults = bus.dry_snaps.filter(snap=>snap.earlyOrLate !== "bus_not_found_on_rtpi").length;
        if(notNullResults===0){
          bus.dry_avg = null;
        }else{
          bus.dry_avg = Math.round(thisBusDryAggregate/notNullResults)
        }
      }

      if(thisBusTotalAggregate!==null){
        //if not null divide aggregate by number of non null results
        let notNullResults = bus.snapshots.filter(snap=>snap.earlyOrLate !== "bus_not_found_on_rtpi").length;
        if(notNullResults===0){
          bus.total_avg = null;
        }else{
          bus.total_avg = Math.round(thisBusTotalAggregate/notNullResults)
        }
      }

      //note null/num =>0
      //null/null => nan
     // bus.wet_avg = Math.round(thisBusWetAggregate/bus.wet_snaps.length)
     // bus.dry_avg = Math.round(thisBusDryAggregate/bus.dry_snaps.length)
      bus.num_dry = bus.dry_snaps.length;
      bus.num_wet = bus.wet_snaps.length;
      //bus.total_avg = Math.round(thisBusTotalAggregate/bus.snapshots.length)
      bus.num_total = bus.snapshots.length;


      //console.log("tot >>>>>", bus.total_avg)
      // console.log("dry avg No."+ i + ": "+ bus.dry_avg +" should equal " + thisBusDryAggregate + " / " + bus.dry_snaps.length + " ============ " )

     // console.log("total avg No."+ i + ": "+ bus.total_avg +" should equal " + thisBusTotalAggregate + " / " + bus.snapshots.length + " ============ " + Math.round(thisBusTotalAggregate/bus.snapshots.length) )
     // console.log("will return ", bus)
      return bus
    })
    
    
   return timetablesWithSnapshots

  },
  aggregateLateOrEarly: function (snapsArray){
    
    //if never found on rtpi, set avg to null
    if(snapsArray.filter(snap=>snap.earlyOrLate==="bus_not_found_on_rtpi").length === snapsArray.length){
      //console.log("returning null")
      return null;
    }
    //console.log("continuing")

    return snapsArray.reduce((out,snap,i,all)=>{
      if(snap.earlyOrLate === 'late'){
        out +=parseInt(snap.minutesOff)
      }else if(snap.earlyOrLate === 'early'){
        out -=parseInt(snap.minutesOff)
      }
      
      return Math.round(out)
    },0)
  }


}