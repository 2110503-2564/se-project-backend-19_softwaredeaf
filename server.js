const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const cors = require('cors')
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

//Load env vars
dotenv.config({ path: "./config/config.env" });

//Connect to database
connectDB();

//Route files
const camps = require("./routes/camps");
const auth = require("./routes/auth");
const bookings = require("./routes/bookings");
const amenities = require("./routes/amenities");
const amenityBookings = require('./routes/amenityBookings');
const campReviews = require('./routes/campReviews');
const userReviews = require('./routes/userReviews');
// //by kwan
const reports = require('./routes/reports');
const { version } = require("mongoose");

const app = express();

//body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors())

//Cookie parser
app.use(cookieParser());

//Mount routers
app.use("/api/v1/camps", camps);
app.use("/api/v1/auth", auth);
app.use("/api/v1/bookings", bookings);
app.use("/api/v1/camps/:campId/amenities", amenities);
app.use('/api/v1/amenitybookings', amenityBookings);
app.use('/api/v1/campreviews', campReviews);
app.use('/api/v1/userreviews', userReviews);
//by kwan
app.use('/api/v1/reports',reports);

//swagger by karn
const swaggerOptions={
  swaggerDefinition:{
    openapi: '3.0.0',
    info: {
      title: 'Library API',
      version: '1.0.0',
      description: 'Campground booking system API by softwaredeaf team'
    },
    servers: [
      {
          url: 'http://localhost:5050/api/v1'
      }
    ],
  },

  // apis:['./swagger/user.yml','./swagger/camp.yml','./swagger/booking.yml'
  //   ,'./swagger/amenity.yml','./swagger/amenitybooking.yml'],

  apis:['./swagger/user.yml','./swagger/camp.yml','./swagger/booking.yml','./swagger/amenity.yml'],

};

const swaggerDocs=swaggerJsDoc(swaggerOptions);
app.use('/api-docs',swaggerUI.serve, swaggerUI.setup(swaggerDocs));

const PORT = process.env.PORT || 5003;

const server = app.listen(
  PORT,
  console.log("Server running in", process.env.NODE_ENV, " mode on port", PORT),
);

//Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  //Close server & exit process
  server.close(() => process.exit(1));
});
