const express = require('express');
const expressGraphQL = require('express-graphql');
const schema = require('./schema.js')
const cors = require('cors');



const app = express();
app.use(cors());


app.use('/graphql', expressGraphQL({
  schema: schema,
  graphiql: true
}))

app.get('*', (req,res)=>{
  res.status(404);
  res.send('Use /graphql');
})

const PORT = process.env.PORT || 4000;

app.listen(PORT, () =>{
  console.log("server on 4000")
})