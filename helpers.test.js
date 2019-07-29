const helpers = require('./helpers');

test('should be false if more than 2 mins apart', ()=>{
  expect(helpers.isWithinMinutesOf('09:32', '09:58',2))
  .toBe(false);

})

test('should be true if num is big enough', ()=>{
  expect(helpers.isWithinMinutesOf('09:32', '09:58',30))
.toBe(true);
})

test('should still work if num passed', ()=>{
  expect(helpers.isWithinMinutesOf('09:32',  '21:58', 30))
.toBe(false);

})