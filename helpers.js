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
  }

}